import "reflect-metadata";
import { defaultCfgPath, loadConfig, updateConfig } from "./libs/config";
import express from "express";
import { static as serveStatic, Router } from "express";
import { join } from "path";
import session = require("express-session");
import { log, randomSequence } from "./libs/utils";
import { readFile } from "@toes/core";

import { BirdServer } from "./server";
import { RouteStorage } from "./storage";
// import { registerAPI } from "./api";
import { Auth } from "./auth";
import { AuthController } from "./api/auth.controller";
import { ProxyController } from "./api/proxy.controller";
import { useExpressServer, useContainer } from "routing-controllers";
import { Container } from "typedi";

const path = (...str: string[]) => join(__dirname, ...str);

export async function main(): Promise<void> {
    log.main.info("Starting server...");

    const config = await loadConfig();
    if (config.session_secret && config.session_secret === "replace me") {
        config.session_secret = randomSequence(12);
        await updateConfig({ session_secret: config.session_secret });
    }

    const page404 = await readFile({
        path: config["404path"],
        defaultContent: await readFile({
            path: path("..", "..", "dist", "www", "404.html"),
        }),
    });

    const auth = new Auth(defaultCfgPath);
    await auth.load();

    const proxy = new BirdServer({
        httpPort: config.ports.http,
        auth: async (route, req, res, next) => {
            if (!route || !route.auth) return true;
            if (!req.headers.authorization) return false;
            return auth.checkPassword(req.headers["authorization"]);
        },
        notFound: async (req, res) => {
            res.send(page404);
        },
    });

    const routeStorage = new RouteStorage(
        defaultCfgPath,
        config.production,
        proxy
    );
    await routeStorage.load();

    const app = express();

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
        session({
            secret: config.session_secret,
            resave: false,
            saveUninitialized: true,
            cookie: {},
        })
    );

    /*     const apiRouter = Router();
    registerAPI(apiRouter, routeStorage, auth);
    app.use("/api", apiRouter); */

    useContainer(Container);
    Container.bind(Auth, auth);
    Container.bind(RouteStorage, routeStorage);

    const server = useExpressServer(app, {
        controllers: [AuthController, ProxyController],
        routePrefix: "/api",
    });

    server.use(serveStatic(path("..", "..", "dist", "www")));

    /* final catch-all route to index.html defined last */
    server.get("/*", (_, res) => {
        res.sendFile(path("..", "..", "dist", "www", "index.html"));
    });

    server.listen(config.ports.admin, () => {
        log.main.info(`Admin Panel listening on port ${config.ports.admin}.`);

        proxy.app.listen(config.ports.http, () => {
            log.main.info(`HTTP Proxy listening on port ${config.ports.http}.`);
            log.main.info(
                `HTTPS Proxy listening on port ${config.ports.https}.`
            );
            log.main.info("Server started.");
        });
    });
}

main().catch((err) => {
    console.error("Fatal Error:\n", err);
});
