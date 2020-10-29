import { Controller, Get, Post, Put, Delete } from "@overnightjs/core";
import { Request, Response } from "express";
import { RouteStorage } from "../storage";
import { log } from "../libs/utils";
import { Auth } from "../auth";
import { Route } from "../../shared/api";
import { Service } from "typedi";
import validator from "validator";

@Service()
@Controller("routes")
export class SiteController {
    constructor(private storage: RouteStorage, private auth: Auth) {}

    @Get()
    async getRoutes(req: Request, res: Response) {
        return !this.auth.checkAuth(req)
            ? res.json([])
            : await this.storage.getRoutes();
    }

    @Post()
    async addRoute(req: Request, res: Response) {
        try {
            const r: Route = req.body;

            const validation: boolean =
                validator.isFQDN(r.source) &&
                validator.isLength(r.source, { min: 1 });
            if (!validation)
                throw new Error(
                    `Invalid request! Make sure you have filled out all required fields.`
                );

            if (!this.auth.checkAuth(req)) throw new Error("Not logged in!");

            if (await this.storage.getRoute(r.source, r.target))
                throw new Error("Route already exists!");

            await this.storage.register(req.body);
            log.interaction.info(
                `Added route: ${r.source} -> ${JSON.stringify(r.target)}`
            );
            return res.json({ success: true });
        } catch (err) {
            log.main.error(`Error adding route: ${err.toString()}`);
            return res
                .status(500)
                .json({ success: false, error: err.toString() });
        }
    }

    @Put(":source/:target")
    async updateRoute(req: Request, res: Response) {
        try {
            const route: Route = req.body;

            if (!this.auth.checkAuth(req)) throw new Error("Not logged in!");

            await this.storage.register(route);
            log.interaction.info(
                `Updated route: ${route.source} -> ${route.target}`
            );
            return res.json({ success: true });
        } catch (err) {
            log.main.error(`Error updating route: ${err.toString()}`);
            return res.json({ success: false, error: err.toString() });
        }
    }

    @Delete(":source/:target")
    async deleteRoute(req: Request, res: Response) {
        try {
            const route: Route = {
                ...req.params,
                target: JSON.parse(decodeURIComponent(req.params.target)),
            } as Route;

            // log.main.info(JSON.stringify(route));

            if (!this.auth.checkAuth(req)) throw new Error("Not logged in!");

            await this.storage.unregister(route.source, route.target);
            log.interaction.info(
                `Deleted route: ${route.source} -> ${JSON.stringify(
                    route.target
                )}`
            );
            return { success: true };
        } catch (err) {
            log.main.error(`Error deleting route: ${err.toString()}`);
            return { success: false, error: err.toString() };
        }
    }
}
