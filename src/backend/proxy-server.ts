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
import AcmeExpress from "acme-middleware";
import express, { Request, Response, NextFunction } from "express";
import url from "url";
import fs from "fs";
import mime from "mime";
import { Route } from "../shared/api";
import { log } from "./libs/utils";
import path from "path";
import { db } from "./db";
import { loadCfg } from "./libs/config";

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
    app: express.Application;
    acmeApp?: AcmeExpress;

    constructor(opts: BirdConfig) {
        this.store = opts;
        this.routes = [];
        this.app = express();

        this.reload().then(() => {
            this.init();
        });
    }

    async reload() {
        this.routes =
            (await db("routes").select()).map((r) => ({
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
                if (this.store.auth(route, req, res, next)) return next();
                else return res.status(403).send("<h1>Access Denied</h1>");
            } else return next();
        });

        // deepcode ignore NoRateLimitingForExpensiveWebOperation: Custom rate limiter implemented
        this.app.use(async (req, res) => {
            const u = url.parse(req.url);
            await this.reload();
            const route = this.routes.find(
                (r) => r.source === req.get("host") ?? "example.com"
            );
            // console.log(route);
            if (!route) return this.store.notFound(req, res);
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
    }

    listen() {
        this.acmeApp = new AcmeExpress({
            app: this.app,
        });
        const config = loadCfg();
        const { http, https } = this.acmeApp.listen(
            { host: "0.0.0.0", port: config.ports.http },
            ({ host, port }: { host: string; port: number }) => {
                // this callback will be called 2 times
                // (1) when http server (your app) started and
                // (2) when a https server started
                log.main.info(`Proxy server started at ${host}:${port}`);
            }
        );
    }
}
