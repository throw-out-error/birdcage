import { config, writeCfg } from "./libs/config";
import { hash, compare } from "bcrypt";
import { Service } from "typedi";
import { Request } from "express";

@Service()
export class Auth {
    private password = "";

    async load(): Promise<void> {
        this.password = config.secrets.adminPassword;
    }

    checkAuth = (req: Request) => !!(req.session && req.session.authed);

    async setPassword(pw: string): Promise<boolean> {
        this.password = await hash(pw, 10);
        config.secrets.adminPassword = this.password;
        writeCfg();
        return true;
    }

    async checkPassword(pw: string): Promise<boolean> {
        if (!this.password || this.password === "") return true;
        return await compare(pw, this.password);
    }
}
