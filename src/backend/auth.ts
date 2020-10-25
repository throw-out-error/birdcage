import { loadConfig, Config, updateConfig } from "./libs/config";
import { hash, compare } from "bcrypt";
import { Service } from "typedi";

@Service()
export class Auth {
    private password = "";

    constructor(private path: string) {}

    async load(): Promise<void> {
        const config = await loadConfig(this.path);
        this.password = config.admin_password;
    }

    checkAuth = (session: Express.Session) => !!(session && session.authed);

    async setPassword(pw: string): Promise<boolean> {
        this.password = await hash(pw, 10);
        await updateConfig<Config>({ admin_password: this.password });
        return true;
    }

    async checkPassword(pw: string): Promise<boolean> {
        if (!this.password || this.password === "") return true;
        return await compare(pw, this.password);
    }
}
