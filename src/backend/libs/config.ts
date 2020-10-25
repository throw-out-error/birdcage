import { Route } from "src/shared/api";
import { loadConfig as lc, writeFile, exists } from "@toes/core";
import { join } from "path";

export interface Config {
    session_secret: string;
    admin_password: string;
    http2: boolean;
    ports: {
        http: number;
        https: number;
        letsencrypt: number;
        admin: number;
    };
    certificates: string;
    production: boolean;
    "404path": string;
    routes: Route[];
}

export const configDir = join(__dirname, "..", "..", "..", "config");

export const defaultCfgPath = join(configDir, "config.json");
export const sampleCfgPath = join(configDir, "sample.json");

export async function loadConfig<T extends Config = Config>(
    path = defaultCfgPath
): Promise<T> {
    const sampleConfig = await lc(sampleCfgPath);
    const config = await lc(path, sampleConfig);

    try {
        if (!(await exists(path)))
            await writeFile(path, JSON.stringify(config));
    } catch (err) {
        throw new Error("Error writing configuration: " + err.toString());
    }

    return (config as unknown) as T;
}

export async function saveConfig<T extends Config = Config>(
    config: Partial<T>,
    path = defaultCfgPath
): Promise<void> {
    const existing = await lc<T>(path);

    Object.keys(config)
        .filter((key) => (config as never)[key] === undefined)
        .forEach(
            (key) =>
                ((existing as Record<string, unknown>)[key] = (config as Record<
                    string,
                    unknown
                >)[key])
        );

    try {
        await writeFile(path, existing);
    } catch (err2) {
        throw new Error("Error writing configuration: " + err2.toString());
    }
}

export async function updateConfig<T extends Config = Config>(
    config: Partial<T>,
    path = defaultCfgPath
): Promise<void> {
    const conf = await loadConfig(path);

    Object.keys(config).forEach(
        (key) =>
            (((conf as unknown) as Record<string, unknown>)[
                key
            ] = ((conf as unknown) as Record<string, unknown>)[key] as Record<
                string,
                unknown
            >)
    );

    return saveConfig(conf, path);
}
