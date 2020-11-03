/**
 * A proxy for loading static files in development. Django doesn't handle this well.
 *
 * To run, do something like:
 *   npm install .
 *   node proxy.js --docroot=$PWD
 *
 * Then just visit http://localhost:9000/ as you normally would.
 */
import httpProxy from "http-proxy";
import express, { Request, Response, NextFunction } from "express";
import url from "url";
import fs from "fs";
import mime from "mime";
import { Route } from "../shared/api";
import { log } from "./libs/utils";
import path from "path";
import { db } from "./db";
import { AcmeExpress } from "@peculiar/acme-express";
import { ConfigService } from "./service/config.service";
import { Inject, Opts } from "@tsed/common";

export interface BirdConfig {
    notFound: (req: Request, res: Response) => Promise<void>;
    auth: (
        route: Route,
        req: Request,
        res: Response,
        next: NextFunction
    ) => Promise<boolean>;
}

export interface ReverseProxy<T extends ReverseProxy<T> = BirdServer> {
    reload(): Promise<void>;
    getConfig(): BirdConfig;
}

// TODO: create seperate npm package

/**
 * Birdcage proxy server
 */
export class BirdServer implements ReverseProxy<BirdServer> {
    private store: BirdConfig;
    routes: Route[];
    app: express.Express;
    httpsApp: express.Express;
    acmeApp?: AcmeExpress;

    constructor(
        @Inject(ConfigService) private config: ConfigService,
        @Opts opts: BirdConfig
    ) {
        this.store = opts;
        this.routes = [];

        this.reload().then(() => {
            this.init();
        });
    }

    async reload() {
        this.routes =
            (await db.instance("routes").select()).map((r) => ({
                ...r,
                target: JSON.parse(r.target),
                auth: r.auth ? JSON.parse(r.auth) : undefined,
            })) ?? [];
    }

    getConfig() {
        return this.store;
    }

    init() {
        const proxy = httpProxy.createProxyServer();

        this.app.use((req, res, next) => {
            const route = this.routes.find(
                (r) => r.source === req.get("host") ?? "example.com"
            );
            if (route && route.auth) {
                if (this.store.auth(route, req as Request, res, next))
                    return next();
                else return res.status(403).send("<h1>Access Denied</h1>");
            } else return next();
        });

        // deepcode ignore NoRateLimitingForExpensiveWebOperation: Custom rate limiter implemented
        this.app.use(async (req: Request, res) => {
            const u = url.parse(req.url);
            await this.reload();
            const route = this.routes.find(
                (r) => r.source === req.get("host") ?? "example.com"
            );
            // console.log(route);
            if (!route) return this.store.notFound(req as Request, res);
            if (route.target.webroot) {
                let loc = u.pathname ?? "index/";
                if (u.pathname === "/" || u.pathname === "") loc = "index";
                if (!loc.match(/\.[0-9a-z]+$/i)) loc = loc + ".html";
                console.log(loc);
                const safePath = path.normalize(loc);
                const filePath = path.join(route.target.webroot, safePath);
                // console.log(filePath);
                const exists = fs.existsSync(filePath);
                if (exists) {
                    res.setHeader(
                        "Content-Type",
                        mime.getType(filePath) ?? "text/html"
                    );
                    return res.sendFile(filePath);
                } else {
                    if (fs.existsSync(filePath + ".html"))
                        return res.sendFile(filePath + ".html");
                    else if (fs.existsSync(filePath + ".php")) {
                        this.app.set("view engine", "php");
                        this.app.set("views", route.target.webroot);
                        return res.render(safePath + ".php");
                    } else return this.store.notFound(req, res);
                }
            } else {
                if (!route.target.proxyUri)
                    return this.store.notFound(req, res);
                return proxy.web(
                    req,
                    res,
                    {
                        target: route.target.proxyUri,
                    },
                    (err) => res.status(500).send(err.toString())
                );
            }
        });
        this.httpsApp.use(this.app);
    }

    listen(): Promise<void> {
        return new Promise((resolve) => {
            AcmeExpress.register(this.httpsApp, {});

            this.app.listen(this.config.get("HTTP_PORT"), () => {
                this.httpsApp.listen(this.config.get("HTTPS_PORT"), () => {
                    resolve();
                });
            });
        });
    }
}
