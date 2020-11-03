import { hash, compare } from "bcrypt";
import { Request } from "express";
import { Inject, Service } from "@tsed/common";
import { UsersService } from "./service/users.service";

@Service()
export class Auth {
    constructor(@Inject(UsersService) private users: UsersService) {}

    checkAuth = (session?: Record<string, unknown>): boolean =>
        session && session.authed ? true : false;

    async setPassword(username: string, pw: string): Promise<boolean> {
        const newPassword = await hash(pw, 10);
        await this.users.updatePassword(username, newPassword);
        return true;
    }

    async checkPassword(username: string, pw: string): Promise<boolean> {
        if (!pw) return false;
        return await compare(pw, (await this.users.get(username)).password);
    }
}
