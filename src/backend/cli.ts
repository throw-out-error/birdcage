import { Command } from "commander";
import { down, up } from "./db";
import { BirdAdmin } from "./main";
const program = new Command();

program.version("1.0.0");

program
    .command("up")
    .description("Initializes the tables and columns of the database.")
    .action(() => {
        up();
    });

program
    .command("down")
    .description("Removes tables and columns from the database!")
    .action(() => {
        down();
    });

program
    .command("server")
    .description("Starts birdcage")
    .action(() => {
        // Start admin panel server
        new BirdAdmin();
    });

program.parse(process.argv);
