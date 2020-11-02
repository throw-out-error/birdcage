import yaml from "yaml";
import { existsSync, writeFileSync } from "fs";
import { IRateLimiterOptions } from "rate-limiter-flexible";
import Joi from "joi";
import { loadConfiguration } from "@toes/core";
import cryptoRandomString from "crypto-random-string";
export interface Config {
    ports: {
        http: number;
        https: number;
        admin: number;
    };
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

export const configSchema = Joi.object({
    paths: Joi.object({
        notFound: Joi.string().required(),
    }),
    secrets: Joi.object({
        session: Joi.string()
            .required()
            .default(cryptoRandomString({ length: 12 })),
        adminPassword: Joi.string()
            .required()
            .default(cryptoRandomString({ length: 20 })),
    }),
    apiLimits: Joi.object({
        points: Joi.number().required().default(75),
        duration: Joi.number().required().default(1),
    }),
    ports: Joi.object({
        http: Joi.number().required().default(80),
        https: Joi.number().required().default(443),
        admin: Joi.number().default(3330),
    }),
});

export const validateConfig = configSchema.validate;

export const env = process.env.NODE_ENV === "production" ? "prod" : "dev";
export const cfgPath = `config/${env}.yml`;

export const loadCfg = (): Config => {
    config = loadConfiguration<Config>({
        env,
        defaultConfig: {},
    });
    const res = validateConfig(config);
    if (res.error) throw new Error("Invalid config!");
    else {
        config = res.value;
        writeCfg();
        return config;
    }
};

export const writeCfg = (cfg?: Config): void =>
    writeFileSync(cfgPath, yaml.stringify(cfg ?? config), {
        encoding: "utf-8",
    });

export let config: Config;
// console.log(config);
if (!existsSync(cfgPath)) writeCfg();
