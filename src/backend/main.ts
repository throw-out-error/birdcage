import "reflect-metadata";
import { ajv, config, validateConfig } from "./libs/config";
import express from "express";
import { static as serveStatic } from "express";
import session = require("express-session");
import { log, path } from "./libs/utils";
import { readFile } from "@toes/core";
import { createRateLimit } from "./middleware/rate-limit";
import { BirdServer } from "./proxy-server";
import { RouteStorage } from "./storage";
import { Auth } from "./auth";
import { Container } from "typedi";
import { Server } from "@overnightjs/core";
import { ApiController } from "./controller/api.controller";

export class BirdAdmin extends Server {
    proxy!: BirdServer;

    constructor() {
        super();

        this.init();
    }

    async init(): Promise<void> {
        const valid = validateConfig(config);
        if (!valid)
            throw new Error(
                `Invalid config: ${ajv.errorsText(validateConfig.errors)}`
            );
        const page404 = await readFile({
            path: config.paths.notFound,
        });

        const auth = new Auth();
        await auth.load();

        this.proxy = new BirdServer({
            httpPort: config.ports.http,
            auth: async (route, req) => {
                if (!route || !route.auth) return true;
                if (!req.headers.authorization) return false;
                return auth.checkPassword(req.headers["authorization"]);
            },
            notFound: async (_, res) => {
                res.send(page404);
            },
        });

        const routeStorage = new RouteStorage(this.proxy);
        await routeStorage.load();

        Container.set(Auth, auth);
        Container.set(RouteStorage, routeStorage);

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(
            session({
                secret: config.secrets.session,
                resave: false,
                saveUninitialized: true,
                cookie: {
                    // TODO: https on admin panel
                    secure: false,
                    httpOnly: true,
                },
            })
        );
        this.app.use(await createRateLimit());

        super.addControllers([new ApiController()]);

        this.app.use(
            "/panel",
            serveStatic(path("..", "..", "..", "dist", "www"))
        );
        /* final catch-all route to index.html defined last */
        this.app.get("/panel/*", (_, res) => {
            res.sendFile(path("..", "..", "..", "dist", "www", "index.html"));
        });

        this.app.get("/", (_, res) => {
            res.redirect("/panel");
        });

        this.start();
    }

    start(): void {
        log.main.info("Starting server...");
        this.app.listen(process.env.PORT ?? config.ports.admin, async () => {
            log.main.info(
                `Admin Panel listening on port ${config.ports.admin}.`
            );

            this.proxy.app.listen(config.ports.http, async () => {
                log.main.info(
                    `HTTP Proxy listening on port ${config.ports.http}.`
                );
                log.main.info(
                    `HTTPS Proxy listening on port ${config.ports.https}.`
                );
                log.main.info("Server started.");
            });
        });
    }
}
