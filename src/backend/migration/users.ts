import { db } from "../db";

export const up = () => {
    return new Promise<void>((resolve, reject) => {
        db.instance.schema.hasTable("users").then((hasTable) => {
            if (!hasTable)
                db.instance.schema
                    .createTable("users", (table) => {
                        table.increments("id").primary().unsigned();

                        table.string("username", 255).notNullable();
                        table.string("password").notNullable();
                        table.string("email").notNullable();

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
        db.instance.schema.hasTable("users").then((hasTable) => {
            if (hasTable)
                db.instance.schema
                    .dropTable("users")
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
