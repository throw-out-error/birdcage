import "reflect-metadata";
import { ajv, store, validateConfig, tc, initStore } from "./libs/config";
import express from "express";
import { static as serveStatic } from "express";
import session = require("express-session");
import { log, path } from "./libs/utils";
import { readFile } from "@toes/core";
import { createRateLimit } from "./middleware/rate-limit";
import { BirdServer } from "./server";
import { RouteStorage } from "./storage";
import { Auth } from "./auth";
import { AuthController } from "./api/auth.controller";
import { ProxyController } from "./api/proxy.controller";
import { useExpressServer, useContainer } from "routing-controllers";
import { Container } from "typedi";

export async function main(): Promise<void> {
    log.main.info("Starting server...");

    await initStore();

    const page404 = await readFile({
        path: store.get(tc.paths.notFound.$path) as string,
    });

    const valid = validateConfig(
        Object.fromEntries(Object.entries(store.get(tc.$path)))
    );
    if (!valid)
        throw new Error(
            `Invalid config: ${ajv.errorsText(validateConfig.errors)}`
        );

    const auth = new Auth();
    await auth.load();

    const proxy = new BirdServer({
        httpPort: store.get(tc.ports.http.$path) as number,
        auth: async (route, req) => {
            if (!route || !route.auth) return true;
            if (!req.headers.authorization) return false;
            return auth.checkPassword(req.headers["authorization"]);
        },
        notFound: async (_, res) => {
            res.send(page404);
        },
    });

    const routeStorage = new RouteStorage(
        store.get(tc.production.$path) as boolean,
        proxy
    );
    await routeStorage.load();

    const app = express();

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
        session({
            secret: store.get(tc.secrets.session.$path) as string,
            resave: false,
            saveUninitialized: true,
            cookie: {
                // TODO: https on admin panel
                secure: false,
                httpOnly: true,
            },
        })
    );

    /*     const apiRouter = Router();
    registerAPI(apiRouter, routeStorage, auth);
    app.use("/api", apiRouter); */

    Container.set(Auth, auth);
    Container.set(RouteStorage, routeStorage);
    useContainer(Container);

    const server = useExpressServer(app, {
        controllers: [AuthController, ProxyController],
        routePrefix: "/api",
    });

    server.use(serveStatic(path("..", "..", "..", "dist", "www")));
    server.use(await createRateLimit());
    /* final catch-all route to index.html defined last */
    server.get("/*", (_, res) => {
        res.sendFile(path("..", "..", "..", "dist", "www", "index.html"));
    });

    server.listen(store.get(tc.ports.admin.$path), async () => {
        log.main.info(
            `Admin Panel listening on port ${store.get(tc.ports.admin.$path)}.`
        );

        proxy.app.listen(store.get(tc.ports.http.$path), async () => {
            log.main.info(
                `HTTP Proxy listening on port ${store.get(
                    tc.ports.http.$path
                )}.`
            );
            log.main.info(
                `HTTPS Proxy listening on port ${store.get(
                    tc.ports.https.$path
                )}.`
            );
            log.main.info("Server started.");
        });
    });
}

main().catch((err) => {
    console.error("Fatal Error:\n", err);
});
