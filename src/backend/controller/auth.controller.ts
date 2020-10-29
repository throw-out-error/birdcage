import { Controller, Get, Post, Put, Delete } from "@overnightjs/core";
import { Request, Response } from "express";
import { log } from "../libs/utils";
import { Auth } from "../auth";
import { Service } from "typedi";

@Controller("auth")
@Service()
export class AuthController {
    constructor(private auth: Auth) {}

    @Get()
    async isAuthed(req: Request, res: Response) {
        try {
            let authed = this.auth.checkAuth(req);
            if (!authed && (await this.auth.checkPassword("")) && req.session) {
                authed = true;
                req.session.authed = authed;
            }

            return res.json({ authed });
        } catch (err) {
            log.main.error(`Error getting auth: ${err.toString()}`);
            return res.status(500).json({ authed: false });
        }
    }

    @Put()
    async setPassword(req: Request, res: Response) {
        try {
            const pw = req.body.password;

            if (!this.auth.checkAuth(req)) throw new Error("Not logged in!");

            await this.auth.setPassword(pw as string);
            return res.json({ success: true });
        } catch (err) {
            log.main.error(`Error setting password: ${err.toString()}`);
            return res
                .status(500)
                .json({ success: false, error: err.toString() });
        }
    }

    @Post()
    async authenticate(req: Request, res: Response) {
        const pw: string = req.body.password;
        try {
            if (await this.auth.checkPassword(pw)) {
                if (req.session) req.session.authed = true;
                return res.json({ success: true });
            } else
                return res.status(400).json({
                    success: false,
                    error: "Wrong password!",
                });
        } catch (err) {
            log.main.error(`Error checking password: ${err.toString()}`);
            return res
                .status(500)
                .json({ success: false, error: err.toString() });
        }
    }

    @Delete()
    async logout(req: Request, res: Response) {
        if (!this.auth.checkAuth(req))
            return res
                .status(400)
                .json({ success: false, error: "Not logged in!" });

        if (req.session) req.session.authed = false;

        return res.json({ success: true });
    }
}
