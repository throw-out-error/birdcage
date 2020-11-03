import { db } from "../db";

export const up = () => {
    return new Promise<void>((resolve, reject) => {
        db.instance.schema.hasTable("routes").then((hasTable) => {
            if (!hasTable)
                db.instance.schema
                    .createTable("routes", (table) => {
                        table.increments("id").primary().unsigned();

                        table.string("source", 255).notNullable();
                        table.jsonb("target").notNullable();
                        table.boolean("ssl").notNullable();
                        table.string("username").notNullable();

                        table.jsonb("auth").nullable();

                        table
                            .timestamp("createdAt")
                            .defaultTo(new Date().toISOString());
                        table.timestamp("updatedAt");
                    })
                    .then(() => {
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    });
            else resolve();
        });
    });
};

export const down = () => {
    return new Promise<void>((resolve, reject) => {
        db.instance.schema.hasTable("routes").then((hasTable) => {
            if (hasTable)
                db.instance.schema
                    .dropTable("routes")
                    .then(() => {
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    });
        });
    });
};

export const config = {
    transaction: false,
};
