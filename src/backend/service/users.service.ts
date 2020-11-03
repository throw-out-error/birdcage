import Joi from "joi";
import cryptoRandomString from "crypto-random-string";
import { db } from "../db";
import { User, userSchema } from "../models/user.model";
import { Service } from "@tsed/common";

@Service()
export class UsersService {
    async get(username: string): Promise<User> {
        return db.instance
            .select("*")
            .from("users")
            .where({ username })
            .first();
    }

    async updatePassword(username: string, password: string) {
        await db.instance("users").update({ password }).where({ username });
        return db.instance
            .select("*")
            .from("users")
            .where({ username })
            .first();
    }

    async addUser(
        user: Record<string, unknown>,
        isAuthed: boolean
    ): Promise<User> {
        const u = userSchema.validate(user);
        if (u.error) throw new Error(`Invalid user: ${u.error.message}`);

        const existingUsers = await db.instance.select("*").from("users");
        if (existingUsers.length > 1 && !isAuthed)
            throw new Error(`You must be signed in to add a new user.`);
        await db.instance("users").insert(u.value);
        return db.instance
            .select("*")
            .from("users")
            .where({ username: u.value.username })
            .first();
    }
}
