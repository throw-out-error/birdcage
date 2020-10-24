import chalk from "chalk";
import { ConsoleLogger, PrefixLogger } from "@toes/core";
import { readFile as rF, writeFile as wF } from "fs";

export { chalk };

/**
 * Does nothing.
 * @param args Anything.
 */
export const nop = (): null => null;

/**
 * Time utilities
 */
export const localTime = (): string => new Date().toLocaleString();

/**
 * Logging utilities
 */
export const log = {
    main: new PrefixLogger(new ConsoleLogger(), chalk.red.bold("[birdcage]")),
    interaction: new PrefixLogger(
        new ConsoleLogger(),
        chalk.green.bold("[Interaction]")
    ),
    debug: new PrefixLogger(new ConsoleLogger(), chalk.yellow.bold("[Debug]")),
    test: new PrefixLogger(new ConsoleLogger(), chalk.green.bold("[Test]")),
};

export function randomSequence(length: number): string {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!§$%&/()=?{[]}-_.:,;<>|#+~";

    for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
