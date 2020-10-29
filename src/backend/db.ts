import Knex from "knex";
import { config } from "./libs/config";
import { log } from "./libs/utils";
import { join } from "path";

export const dbPath =
    process.env.NODE_ENV === "production"
        ? join(__dirname, "..", "..", "..", "data", "prod.sqlite")
        : join(__dirname, "..", "..", "..", "data", "dev.sqlite");

const dbConfig: Knex.Config<Knex.Sqlite3ConnectionConfig> = {
    client: "sqlite",
    connection: {
        database: config.paths.database ?? dbPath,
    },
    useNullAsDefault: true,
};

export const db: Knex = Knex(dbConfig);

log.main.info(`Connecting to database...`);
db.raw("select 1")
    .then(() => {
        log.main.info(`Connected to database - OK`);
    })
    .catch((err) => {
        log.main.error(`Failed to connect to database: ${err}`);
        process.exit(1);
    });

// Returns a timestamp suitable for inserting into Postgres
export const timestamp = (): string => new Date().toUTCString();

export const up = () => {
    db.schema.createTableIfNotExists("routes", (table) => {
        table.increments("id").primary().unsigned();

        table.string("source", 255).notNullable();
        table.json("target").notNullable();
        table.boolean("ssl").notNullable();
        table.string("email").notNullable();

        table.json("auth").nullable();

        table.timestamp("createdAt").defaultTo(db.fn.now());
        table.timestamp("updatedAt");
    });
};

export const down = () => {
    return db.schema.dropTableIfExists("routes");
};
