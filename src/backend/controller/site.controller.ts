import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Inject,
    Session,
    BodyParams,
    QueryParams,
    PathParams,
} from "@tsed/common";
import { Request, Response } from "express";
import { RouteStorage } from "../storage";
import { log } from "../libs/utils";
import { Auth } from "../auth";
import { IResponse, Route } from "../../shared/api";
import validator from "validator";
import { BadRequest, InternalServerError } from "@tsed/exceptions";

@Controller("routes")
export class SiteController {
    constructor(
        @Inject(RouteStorage) private storage: RouteStorage,
        @Inject(Auth) private auth: Auth
    ) {}

    @Get()
    async getRoutes(@Session() session, @BodyParams() body) {
        return;
        !this.auth.checkAuth(session) ? [] : await this.storage.getRoutes();
    }

    @Post()
    async addRoute(@Session() session, @BodyParams() r: Route) {
        try {
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

            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            if (await this.storage.getRoute(r.source, r.target))
                throw new Error("Route already exists!");

            await this.storage.register(r);
            log.interaction.info(
                `Added route: ${r.source} -> ${JSON.stringify(r.target)}`
            );
            return { success: true };
        } catch (err) {
            log.main.error(`Error adding route: ${err.toString()}`);
            throw new InternalServerError(err.toString());
        }
    }

    @Put(":source/:target")
    async updateRoute(
        @Session() session,
        @BodyParams() route: Route
    ): Promise<IResponse> {
        try {
            if (!this.auth.checkAuth(session))
                throw new Error("Not logged in!");

            await this.storage.register(route);
            log.interaction.info(
                `Updated route: ${route.source} -> ${JSON.stringify(
                    route.target
                )}`
            );
            return { success: true };
        } catch (err) {
            log.main.error(`Error updating route: ${err.toString()}`);
            throw new InternalServerError(err.toString());
        }
    }

    @Delete(":source/:target")
    async deleteRoute(
        @Session() session,
        @PathParams() params
    ): Promise<IResponse> {
        try {
            const route: Route = {
                ...params,
                target: JSON.parse(decodeURIComponent(params.target)),
            } as Route;

            // log.main.info(JSON.stringify(route));

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
            throw new InternalServerError(err.toString());
        }
    }
}
