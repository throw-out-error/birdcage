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

export interface BirdConfig {
    httpPort?: number;
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
    store: BirdConfig;
    routes: Route[];
    app: express.Application;

    constructor(opts: BirdConfig) {
        this.store = { ...opts, httpPort: opts.httpPort ?? 9000 };
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
        const isStatic = new RegExp(/\/static\/(.*)/);

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
                const safePath = path.normalize(u.pathname ?? "");
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
                    return this.store.notFound(req, res);
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
}
