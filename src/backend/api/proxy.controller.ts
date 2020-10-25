import {
    Controller,
    Params,
    Body,
    Get,
    Post,
    Put,
    Delete,
    Session,
} from "routing-controllers";
import { RouteStorage } from "../storage";
import { log } from "../libs/utils";
import { Auth } from "../auth";
import { Express } from "express";
import { Route } from "../../shared/api";
import { Service } from "typedi";
import { validate } from "class-validator";

@Service()
@Controller("/routes")
export class ProxyController {
    constructor(private storage: RouteStorage, private auth: Auth) {}

    @Get()
    async getRoutes(@Session() session: Express.Session) {
        if (!this.auth.checkAuth(session)) return [];
        // console.log(this.storage.routes);
        return this.storage.getRoutes();
    }

    @Post()
    async addRoute(
        @Body({ validate: false }) body: Route,
        @Session() session: Express.Session
    ) {
        try {
            const { source, target } = body;

            const validation = await validate(body);
            if (validation && validation.length > 0)
                throw new Error(`Validation errors: ${validation.join(", ")}`);

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            if (this.storage.getRoute(source, target))
                throw new Error("Route already exists!");

            await this.storage.register((body as unknown) as Route);
            log.interaction.info(
                `Added route: ${source} -> ${JSON.stringify(target)}`
            );
            return { success: true };
        } catch (err) {
            log.main.error(`Error adding route: ${err.toString()}`);
            return { success: false, error: err.toString() };
        }
    }

    @Put("/:source/:target")
    async updateRoute(
        @Body() body: Route,
        @Session() session: Express.Session
    ) {
        try {
            const route: Route = body;

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            await this.storage.register(route);
            log.interaction.info(
                `Updated route: ${route.source} -> ${route.target}`
            );
            return { success: true };
        } catch (err) {
            log.main.error(`Error adding route: ${err.toString()}`);
            return { success: false, error: err.toString() };
        }
    }

    @Delete("/:source/:target")
    async deleteRoute(
        @Params() params: Record<string, string>,
        @Session() session: Express.Session
    ) {
        try {
            const route: Route = {
                ...params,
                target: JSON.parse(decodeURIComponent(params.target)),
            } as Route;

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

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
