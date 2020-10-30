import { Controller, Get, Post, Put, Delete } from "@overnightjs/core";
import { Request, Response } from "express";
import { RouteStorage } from "../storage";
import { log } from "../libs/utils";
import { Auth } from "../auth";
import { Route } from "../../shared/api";
import { Inject, Service } from "typedi";
import validator from "validator";

@Service()
@Controller("routes")
export class SiteController {
    constructor(
        @Inject(() => RouteStorage) private storage: RouteStorage,
        @Inject(() => Auth) private auth: Auth
    ) {}

    @Get()
    async getRoutes(req: Request, res: Response) {
        res.json(
            !this.auth.checkAuth(req)
                ? res.json([])
                : await this.storage.getRoutes()
        );
    }

    @Post()
    async addRoute(req: Request, res: Response) {
        try {
            const r: Route = req.body;
            if (!r)
                throw new Error(
                    `Invalid request! Make sure you have filled out all required fields.`
                );
            const validation: boolean =
                (validator.isFQDN(r.source) ||
                    r.source.includes("localhost")) &&
                validator.isLength(r.source, { min: 1 });
            if (!validation)
                throw new Error(
                    `Invalid request! Make sure you have filled out all required fields.`
                );

            if (!this.auth.checkAuth(req)) throw new Error("Not logged in!");

            if (await this.storage.getRoute(r.source, r.target))
                throw new Error("Route already exists!");

            await this.storage.register(r);
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
                `Updated route: ${route.source} -> ${JSON.stringify(
                    route.target
                )}`
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
            res.json({ success: true });
        } catch (err) {
            log.main.error(`Error deleting route: ${err.toString()}`);
            res.status(500).json({ success: false, error: err.toString() });
        }
    }
}
