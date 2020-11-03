import { Command } from "commander";
import { checkConn, db } from "./db";
import { PlatformExpress } from "@tsed/platform-express";
import { BirdAdmin as BirdAdminServer } from "./main";
import { log } from "./libs/utils";
const program = new Command();

program.version("1.0.0");

program
    .command("up")
    .description("Initializes the tables and columns of the database.")
    .action(() => {
        checkConn();
        db.instance.migrate
            .latest()
            .catch(console.error)
            .finally(() => db.instance.destroy());
    });

program
    .command("down")
    .description("Removes tables and columns from the database!")
    .action(() => {
        checkConn();
        db.instance.migrate
            .down()
            .catch(console.error)
            .finally(() => db.instance.destroy());
    });

program
    .command("server")
    .description("Starts birdcage")
    .action(async () => {
        // Start admin panel server
        try {
            const platform = await PlatformExpress.bootstrap(BirdAdminServer, {
                httpPort: 3330,
            });
            await platform.listen();
        } catch (er) {
            log.main.error(er);
        }
    });
program.parse(process.argv);
