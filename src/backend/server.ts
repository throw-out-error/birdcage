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
    register(route: Route): T;
    unregister(route: Route): T;
    getConfig(): BirdConfig;
}

// TODO: create seperate npm package

export class BirdServer implements ReverseProxy<BirdServer> {
    config: BirdConfig;
    routes: Record<string, Route>;
    app: express.Application;

    constructor(opts: BirdConfig) {
        this.config = { ...opts, httpPort: opts.httpPort ?? 9000 };
        this.routes = {};
        this.app = express();
        this.init();
    }
    register(route: Route) {
        this.routes[route.source] = route;
        return this;
    }

    unregister(route: Route) {
        delete this.routes[route.source];
        return this;
    }

    getConfig() {
        return this.config;
    }

    init() {
        const port = this.config.httpPort || 9000;
        const proxy = httpProxy.createProxyServer();
        const isStatic = new RegExp(/\/static\/(.*)/);

        this.app.use((req, res, next) => {
            const route = this.routes[req.get("host") ?? "example.com"];
            if (route && route.auth) {
                if (this.config.auth(route, req, res, next)) next();
                else res.status(403).send("<h1>Access Denied</h1>");
            } else next();
        });

        this.app.use((req, res) => {
            const u = url.parse(req.url);
            const route = this.routes[req.get("host") ?? "example.com"];
            if (!route) return this.config.notFound(req, res);
            const match = isStatic.exec(u.pathname!);
            if (match && route.target.webroot) {
                const path = `${route.target.webroot}/${match[1]}`;
                const exists = fs.existsSync(path);
                if (exists) {
                    res.setHeader("Content-Type", mime.getType(path)!);
                    res.sendFile(path);
                } else {
                    return this.config.notFound(req, res);
                }
            } else {
                if (!route.target.proxyUri)
                    return this.config.notFound(req, res);
                proxy.web(req, res, {
                    target: route.target.proxyUri,
                });
            }
        });

        log.main.info("listening at port http://localhost:" + port + "/");
    }
}
