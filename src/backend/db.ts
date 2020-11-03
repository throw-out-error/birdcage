import Knex from "knex";
import fs from "fs";
import { log } from "./libs/utils";
import { join } from "path";

// Create data folder if not exists
if (!fs.existsSync(join(__dirname, "..", "..", "data")))
    fs.mkdirSync(join(__dirname, "..", "..", "data"));

export let db: { instance: Knex };

export const checkConn = () => {
    log.main.info(`Connecting to database...`);
    if (db.instance.client.connectionSettings)
        log.main.info(`Connected to database - OK`);
    else {
        log.main.error(`Failed to connect to database!`);
        process.exit(1);
    }
};

// Returns a timestamp suitable for inserting into Postgres
export const timestamp = (): string => new Date().toUTCString();
