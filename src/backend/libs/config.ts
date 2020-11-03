import yaml from "yaml";
import { existsSync, writeFileSync } from "fs";
import { IRateLimiterOptions } from "rate-limiter-flexible";
import cryptoRandomString from "crypto-random-string";
import { log, path } from "./utils";
export interface Config {
    NOT_FOUND: string;
    SESSION_SECRET: string;
    API_LIMIT_POINTS: number;
    API_LIMIT_DURATION: number;
    HTTP_PORT: number;
    HTTPS_PORT: number;
    ADMIN_PORT: number;
    DATABASE_PATH: string;
}

export const envKey = process.env.NODE_ENV === "production" ? "prod" : "dev";
export const cfgPath = `config/${envKey}.yml`;
