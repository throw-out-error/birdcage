import Joi from "joi";
import { Injectable } from "@tsed/di";
import { ConfigManager } from "@toes/config";
import { path } from "../libs/utils";
import cryptoRandomString from "crypto-random-string";
import { Config } from "../libs/config";
import { join } from "path";

@Injectable()
export class ConfigService extends ConfigManager<Config> {
    constructor() {
        super({
            schema: Joi.object({
                NOT_FOUND: Joi.string().default(
                    path("..", "..", "..", "..", "dist", "www", "404.html")
                ),
                SESSION_SECRET: Joi.string().default(
                    cryptoRandomString({ length: 12 })
                ),
                API_LIMIT_POINTS: Joi.number().default(75),
                API_LIMIT_DURATION: Joi.number().default(1),
                HTTP_PORT: Joi.number().default(80),
                HTTPS_PORT: Joi.number().default(443),
                ADMIN_PORT: Joi.number().default(3330),
                DATABASE_PATH: Joi.string().default(
                    process.env.NODE_ENV === "production"
                        ? join(__dirname, "..", "..", "data", "prod.sqlite")
                        : join(__dirname, "..", "..", "data", "dev.sqlite")
                ),
            }),
            yamlPath: `${process.cwd()}/config.yml`,
        });
    }
}
