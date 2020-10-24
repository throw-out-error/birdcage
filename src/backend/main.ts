import { createServer } from "http";
import { defaultCfgPath, loadConfig, updateConfig } from "./libs/config";
import express from "express";
import { static as serveStatic, Router } from "express";
import { join } from "path";
import session = require("express-session");
import { log, randomSequence } from "./libs/utils";
import { readFile } from "@toes/core";

import { redbird } from "./libs/redbird";
import { RouteStorage } from "./storage";
import { registerAPI } from "./api";
import { Auth } from "./auth";

const path = (...str: string[]) => join(__dirname, ...str);

export async function main(): Promise<void> {
    log.main.info("Starting server...");

    const config = await loadConfig();
    if (config.session_secret && config.session_secret === "replace me") {
        config.session_secret = randomSequence(12);
        await updateConfig({ session_secret: config.session_secret });
    }

    const proxy = redbird({
        port: config.ports.http,
        letsencrypt: {
            path: config.certificates,
            port: config.ports.letsencrypt,
        },
        ssl: {
            http2: config.http2,
            port: config.ports.https,
        },
        bunyan: false,
    });

    const page404 = await readFile({
        path: config["404path"],
        defaultContent: await readFile({ path: path("..", "www", "404.html") }),
    });
    proxy.notFound((req, res) => {
        res.statusCode = 404;
        res.write(page404);
        res.end();
    });

    const routeStorage = new RouteStorage(
        defaultCfgPath,
        config.production,
        proxy
    );
    await routeStorage.load();

    const auth = new Auth(defaultCfgPath);
    await auth.load();

    const app = express();
    const server = createServer(app);

    app.use(serveStatic(path("..", "www"), { index: ["index.html"] }));
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

    const apiRouter = Router();
    registerAPI(apiRouter, routeStorage, auth);
    app.use("/api", apiRouter);

    server.listen(config.ports.admin, () => {
        log.main.info(`Server started.`);
        log.main.info(`Admin Panel listening on port ${config.ports.admin}.`);
        log.main.info(`HTTP Proxy listening on port ${config.ports.http}.`);
        log.main.info(`HTTPS Proxy listening on port ${config.ports.https}.`);
    });
}
