import Knex from "knex";
import fs from "fs";
import { config } from "./libs/config";
import { log } from "./libs/utils";
import { join } from "path";

// Create data folder if not exists
if (!fs.existsSync(join(__dirname, "..", "..", "data")))
    fs.mkdirSync(join(__dirname, "..", "..", "data"));

export const dbPath =
    process.env.NODE_ENV === "production"
        ? join(__dirname, "..", "..", "data", "prod.sqlite")
        : join(__dirname, "..", "..", "data", "dev.sqlite");

const dbConfig: Knex.Config<Knex.Sqlite3ConnectionConfig> = {
    client: "sqlite",
    connection: {
        filename: config.paths.database ?? dbPath,
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

export const db: () => Knex = () => Knex(dbConfig);

export const checkConn = () => {
    log.main.info(`Connecting to database...`);
    if (db().client.connectionSettings)
        log.main.info(`Connected to database - OK`);
    else {
        log.main.error(`Failed to connect to database!`);
        process.exit(1);
    }
};

// Returns a timestamp suitable for inserting into Postgres
export const timestamp = (): string => new Date().toUTCString();
