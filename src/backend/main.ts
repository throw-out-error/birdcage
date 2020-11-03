import "reflect-metadata";
import { join } from "path";
import express from "express";
import { static as serveStatic } from "express";
import session from "express-session";
import { log, path } from "./libs/utils";
import { createRateLimit } from "./middleware/rate-limit";
import { BirdServer } from "./proxy-server";
import { Auth } from "./auth";
import { checkConn, db } from "./db";
import Knex from "knex";
import { ConfigService } from "./service/config.service";
import {
    Inject,
    registerProvider,
    createContainer,
    UseOpts,
    PlatformApplication,
    Configuration,
} from "@tsed/common";
import { RouteStorage } from "./storage";
import { AuthController } from "./controller/auth.controller";
import { SiteController } from "./controller/site.controller";
import { readFile } from "@toes/core";

registerProvider({
    provide: BirdServer,
    deps: [ConfigService],
    async useAsyncFactory(cfg: ConfigService, app: BirdAdmin) {
        return new BirdServer(cfg, {
            auth: async (route, req) => {
                if (!route || !route.auth) return true;
                if (!req.headers.authorization) return false;
                // TODO: finish route auth
                /*                         return (Container.get(Auth)).checkPassword(
        req.headers["authorization"]
    ); */
                return true;
            },
            notFound: async (_, res) => {
                res.send(
                    await readFile({
                        path: (await cfg.get("NOT_FOUND")) ?? "",
                    })
                );
            },
        });
    },
});

@Configuration({
    rootDir: `${__dirname}/../../`,
    acceptMimes: ["application/json"],
})
export class BirdAdmin {
    @Inject()
    app!: PlatformApplication;

    constructor(
        @Inject(ConfigService) private readonly config: ConfigService,
        @Inject(RouteStorage) private readonly routeStorage: RouteStorage,

        @Inject(BirdServer) private readonly proxy: BirdServer
    ) {}

    async $beforeRoutesInit(): Promise<void> {
        return this.init();
    }

    async init(): Promise<void> {
        const dbConfig: Knex.Config<Knex.Sqlite3ConnectionConfig> = {
            client: "sqlite",
            connection: {
                filename: this.config.get("DATABASE_PATH"),
                database: "birdcage",
            },
            useNullAsDefault: true,
            migrations: {
                directory: join(__dirname, "migration"),
                loadExtensions: [".js"],
            },
            pool: {
                min: 0,
                max: 1,
            },
            debug: process.env.DB_DEBUG ? true : false,
        };

        // Initialize database
        db.instance = Knex(dbConfig);

        checkConn();

        await this.routeStorage.load();

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(
            session({
                secret: this.config.get<string>("SESSION_SECRET") ?? "",
                resave: false,
                saveUninitialized: true,
                cookie: {
                    // TODO: https on admin panel
                    secure: false,
                    httpOnly: true,
                },
            })
        );
        this.app.use(
            await createRateLimit({
                apiLimits: {
                    duration: this.config.get("API_LIMIT_DURATION"),
                    points: this.config.get("API_LIMIT_POINTS"),
                },
            })
        );

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
    }

    $beforeListen(): void {
        log.main.info("Starting servers...");
    }

    async $afterListen(): Promise<void> {
        log.main.info(
            `Admin Panel listening on port ${this.config.get("ADMIN_PORT")}.`
        );
        await this.proxy.listen();
        log.main.info(
            `HTTP Proxy listening on port ${this.config.get("HTTP_PORT")}.`
        );
        log.main.info(
            `HTTPS Proxy listening on port ${this.config.get("HTTPS_PORT")}.`
        );
        log.main.info("Server started.");
    }
}
