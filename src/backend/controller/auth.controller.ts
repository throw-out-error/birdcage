import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Session,
    BodyParams,
} from "@tsed/common";
import { Request, Response } from "express";
import { log } from "../libs/utils";
import { Auth } from "../auth";
import { Inject } from "@tsed/common";
import { UsersService } from "../service/users.service";
import { IAuthResponse, IResponse } from "../../shared/api";
import { BadRequest, InternalServerError } from "@tsed/exceptions";

@Controller("auth")
export class AuthController {
    constructor(
        @Inject(Auth) private auth: Auth,
        @Inject(UsersService) private users: UsersService
    ) {}

    @Get()
    async isAuthed(@Session() session): Promise<IAuthResponse> {
        try {
            const authed = this.auth.checkAuth(session);

            return { authed, success: true };
        } catch (err) {
            log.main.error(`Error getting auth: ${err.toString()}`);
            throw new InternalServerError(
                `You were not authenticated: ${err.toString()}`
            );
        }
    }

    @Put()
    async setPassword(
        @Session() session,
        @BodyParams() body
    ): Promise<IResponse> {
        try {
            const pw = body.password;

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            await this.auth.setPassword(
                session.username ?? "admin",
                pw as string
            );
            return { success: true };
        } catch (err) {
            log.main.error(`Error setting password: ${err.toString()}`);
            throw new InternalServerError(err.toString());
        }
    }

    @Post("signup")
    async signup(@Session() session, @BodyParams() body): Promise<IResponse> {
        try {
            await this.users.addUser(body, this.auth.checkAuth(session));
            return { success: true };
        } catch (err) {
            log.main.error(`Error creating user: ${err.toString()}`);
            throw new InternalServerError(err.toString());
        }
    }

    @Post()
    async authenticate(
        @Session() session,
        @BodyParams() body
    ): Promise<IResponse> {
        try {
            if (await this.auth.checkPassword(body.username, body.password)) {
                if (session) {
                    session.authed = true;
                    session.username = body.username;
                }
                return { success: true };
            } else {
                if (session) {
                    session.authed = false;
                    delete session.username;
                }
                throw new BadRequest("Wrong password!");
            }
        } catch (err) {
            log.main.error(`Error checking password: ${err.toString()}`);
            throw new InternalServerError(err.toString());
        }
    }

    @Delete()
    async logout(@Session() session, @BodyParams() body): Promise<IResponse> {
        if (!this.auth.checkAuth(session))
            throw new BadRequest("Not logged in!");

        if (session) session.authed = false;

        return { success: true };
    }
}
