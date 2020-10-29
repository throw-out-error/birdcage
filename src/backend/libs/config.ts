import yaml from "yaml";
import { existsSync, writeFileSync } from "fs";
import { IRateLimiterOptions } from "rate-limiter-flexible";
import Ajv from "ajv";
import { loadConfiguration } from "@toes/core";

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
        database?: string;
    };
    secrets: {
        session: string;
        // TODO: create users database table
        adminPassword: string;
    };
    apiLimits: IRateLimiterOptions;
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

export const ajv = new Ajv({ allErrors: true });
export const validateConfig = ajv.compile(configSchema);

export const env = process.env.NODE_ENV === "production" ? "prod" : "dev";
export const cfgPath = `config/${env}.yml`;

export const loadCfg = (): Config =>
    loadConfiguration<Config>({
        env,
        defaultConfig: "config/example.yml",
    });

export const writeCfg = (): void =>
    writeFileSync(cfgPath, yaml.stringify(config), { encoding: "utf-8" });

export const config: Config = loadCfg();

if (!existsSync(cfgPath)) writeCfg();
