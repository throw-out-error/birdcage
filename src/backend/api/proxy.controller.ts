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
import { log, ReqBody } from "../libs/utils";
import { Auth } from "../auth";
import { Express } from "express";
import { Route } from "src/shared/api";
import { Service } from "typedi";

@Service()
@Controller("/routes")
export class ProxyController {
    constructor(private storage: RouteStorage, private auth: Auth) {}

    @Get()
    async getRoutes(@Session() session: Express.Session) {
        if (!this.auth.checkAuth(session)) return [];
        // console.log(this.storage.routes);
        return this.storage.routes;
    }

    @Post()
    async addRoute(@Body() body: ReqBody, @Session() session: Express.Session) {
        try {
            const { source, target } = body;

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            if (this.storage.getRoute(source, target))
                throw new Error("Route already exists!");

            await this.storage.register((body as unknown) as Route);
            log.interaction.info(`Added route: ${source} -> ${target}`);
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
        @Params() params: Route,
        @Session() session: Express.Session
    ) {
        try {
            const route: Route = params;

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            await this.storage.unregister(route.source, route.target);
            log.interaction.info(
                `Deleted route: ${route.source} -> ${route.target}`
            );
            return { success: true };
        } catch (err) {
            log.main.error(`Error deleting route: ${err.toString()}`);
            return { success: false, error: err.toString() };
        }
    }
}
