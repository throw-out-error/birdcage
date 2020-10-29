import { config, loadCfg, writeCfg } from "./libs/config";
import { hash, compare } from "bcrypt";
import { Service } from "typedi";
import { Request } from "express";

@Service()
export class Auth {
    async load(): Promise<void> {
        loadCfg();
    }

    checkAuth = (req: Request) => req.session && req.session.authed;

    async setPassword(pw: string): Promise<boolean> {
        config.secrets.adminPassword = await hash(pw, 10);
        writeCfg();
        return true;
    }

    async checkPassword(pw: string): Promise<boolean> {
        if (
            !config.secrets.adminPassword ||
            config.secrets.adminPassword === ""
        )
            return true;
        if (!pw) return false;
        return await compare(pw, config.secrets.adminPassword);
    }
}
