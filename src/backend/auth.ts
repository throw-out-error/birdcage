import { store, tc } from "./libs/config";
import { hash, compare } from "bcrypt";
import { Service } from "typedi";

@Service()
export class Auth {
    private password = "";

    async load(): Promise<void> {
        this.password = store.get(tc.secrets.adminPassword.$path) as string;
    }

    checkAuth = (session: Express.Session) => !!(session && session.authed);

    async setPassword(pw: string): Promise<boolean> {
        this.password = await hash(pw, 10);
        store.set(tc.secrets.adminPassword.$path, this.password);
        return true;
    }

    async checkPassword(pw: string): Promise<boolean> {
        if (!this.password || this.password === "") return true;
        return await compare(pw, this.password);
    }
}
