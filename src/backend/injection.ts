import { readFile } from "@toes/core";
import { Container } from "@tsed/common";
import { Auth } from "./auth";
import { BirdServer } from "./proxy-server";
import { ConfigService } from "./service/config.service";

export const container = new Container();

export const get = async <T = string>(key: string): Promise<T> => {
    const config = container.get(ConfigService);

    return config?.get(key);
};
