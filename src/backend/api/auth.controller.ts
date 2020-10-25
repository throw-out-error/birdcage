import {
    Controller,
    Body,
    Get,
    Post,
    Put,
    Delete,
    Session,
} from "routing-controllers";
import { log, ReqBody } from "../libs/utils";
import { Auth } from "../auth";

@Controller("/auth")
export class AuthController {
    constructor(private auth: Auth) {}

    @Get()
    async isAuthed(@Session() session: Express.Session) {
        try {
            let authed = this.auth.checkAuth(session);
            if (!authed && (await this.auth.checkPassword("")) && session) {
                authed = true;
                session.authed = authed;
            }

            return { authed };
        } catch (err) {
            log.main.error(`Error getting auth: ${err.toString()}`);
            return { authed: false };
        }
    }

    @Put()
    async setPassword(
        @Body() body: ReqBody,
        @Session() session: Express.Session
    ) {
        try {
            const pw = body.password;

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            await this.auth.setPassword(pw as string);
            return { success: true };
        } catch (err) {
            log.main.error(`Error setting password: ${err.toString()}`);
            return { success: false, error: err.toString() };
        }
    }

    @Post()
    async authenticate(
        @Body() body: ReqBody,
        @Session() session: Express.Session
    ) {
        const pw: string = body.password;
        try {
            if (await this.auth.checkPassword(pw)) {
                if (session) session.authed = true;
                return { success: true };
            } else
                return {
                    success: false,
                    error: "Wrong password!",
                };
        } catch (err) {
            log.main.error(`Error checking password: ${err.toString()}`);
            return { success: false, error: err.toString() };
        }
    }

    @Delete()
    async logout(@Session() session: Express.Session) {
        if (!this.auth.checkAuth(session))
            return { success: false, error: "Not logged in!" };

        if (session) session.authed = false;

        return { success: true };
    }
}
