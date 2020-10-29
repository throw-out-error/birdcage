import { Command } from "commander";
import { checkConn, db } from "./db";
import { BirdAdmin } from "./main";
const program = new Command();

program.version("1.0.0");

program
    .command("up")
    .description("Initializes the tables and columns of the database.")
    .action(() => {
        checkConn();
        db()
            .migrate.up()
            .catch(console.error)
            .finally(() => db().destroy());
    });

program
    .command("down")
    .description("Removes tables and columns from the database!")
    .action(() => {
        checkConn();
        db()
            .migrate.down()
            .catch(console.error)
            .finally(() => db().destroy());
    });

program
    .command("server")
    .description("Starts birdcage")
    .action(() => {
        // Start admin panel server
        new BirdAdmin();
    });

program.parse(process.argv);
