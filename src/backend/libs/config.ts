import { Route } from "../../shared/api";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { IRateLimiterOptions } from "rate-limiter-flexible";
import Ajv from "ajv";
import { typedPath as tp } from "typed-path";
import Keyv from "keyv";
import db from "quick.db";
import { path, randomSequence, ValueOf } from "./utils";

export interface Config {
    ports: {
        http: number;
        https: number;
        letsencrypt: number;
        admin: number;
    };
    certificates: string;
    paths: {
        notFound: string;
    };
    secrets: {
        session: string;
        adminPassword: string;
    };
    routes: Route[];
    apiLimits: IRateLimiterOptions;
    production: boolean;
}

export const configSchema = {
    properties: {
        paths: {
            type: "object",
            properties: {
                notFound: { type: "string" },
            },
        },
        secrets: {
            type: "object",
            properties: {
                session: { type: "string" },
                adminPassword: { type: "string" },
            },
        },
        apiLimits: {
            type: "object",
            properties: {
                points: {
                    type: "number",
                },
                duration: {
                    type: "number",
                },
            },
        },
        ports: {
            type: "object",
            properties: {
                http: {
                    type: "number",
                },
                admin: {
                    type: "number",
                },
            },
        },
    },
};

export const storeDir =
    process.env.NODE_ENV === "production"
        ? join(__dirname, "..", "..", "..", "data", "prod.sqlite")
        : join(__dirname, "..", "..", "..", "data", "dev.sqlite");

export const store = new db.table("admin");
export const ajv = new Ajv({ allErrors: true });
export const validateConfig = ajv.compile(configSchema);
export const tc = tp<Config>(["config"]);

export const initStore = async () => {
    /*
    {
        "session_secret": "replace me",
        "admin_password": "",
        "http2": true,
        "ports": {
            "http": 80,
            "https": 443,
            "letsencrypt": 9990,
            "admin": 3330
        },
        "apiLimits": {
            "duration": 1,
            "points": 75
        },
        "certificates": "/etc/letsencrypt",
        "production": false,
        "404path": "../dist/www/404.html",
        "routes": []
    }
    */
    if (!store.has(tc.secrets.adminPassword.$path))
        store.set(tc.secrets.adminPassword.$path, "");

    if (!store.has(tc.secrets.session.$path))
        store.set(tc.secrets.session.$path, randomSequence(12));
    if (!store.has(tc.paths.notFound.$path))
        store.set(
            tc.paths.notFound.$path,
            path("..", "..", "..", "dist", "www", "404.html")
        );
    if (!store.has(tc.apiLimits.$path))
        store.set(tc.apiLimits.$path, { duration: 1, points: 75 });
    if (!store.has(tc.ports.$path))
        store.set(tc.ports.$path, {
            http: 80,
            https: 443,
            letsencrypt: 9990,
            admin: 3330,
        });
    if (!store.has(tc.routes.$path)) store.set(tc.routes.$path, []);
    if (!store.has(tc.production.$path)) store.set(tc.production.$path, false);
};
