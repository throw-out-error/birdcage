import { db } from "../db";

export const up = () => {
    return new Promise<void>((resolve, reject) => {
        db()
            .schema.hasTable("routes")
            .then((hasTable) => {
                if (!hasTable)
                    db()
                        .schema.createTable("routes", (table) => {
                            table.increments("id").primary().unsigned();

                            table.string("source", 255).notNullable();
                            table.json("target");
                            table.boolean("ssl").notNullable();
                            table.string("email").notNullable();

                            table.json("auth").nullable();

                            table
                                .timestamp("createdAt")
                                .defaultTo(db().fn.now());
                            table.timestamp("updatedAt");
                        })
                        .then(() => {
                            resolve();
                        })
                        .catch((err) => {
                            reject(err);
                        });
                else resolve();
            })
            .catch(reject);
    });
};

export const down = () => {
    return new Promise<void>((resolve, reject) => {
        db()
            .schema.hasTable("routes")
            .then((hasTable) => {
                if (hasTable)
                    db()
                        .schema.dropTable("routes")
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
