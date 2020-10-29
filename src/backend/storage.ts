import { db } from "./db";
import { BirdServer } from "./proxy-server";
import { Route, ITargetOptions } from "src/shared/api";
import { Inject, Service } from "typedi";

@Service()
export class RouteStorage {
    constructor(@Inject(() => BirdServer) private readonly proxy: BirdServer) {}

    async load(): Promise<void> {
        for (const route of await this.getRoutes()) this.registerRoute(route);
    }

    async getRoutes(): Promise<Route[]> {
        return (
            (await db("routes").select()).map((r) => ({
                ...r,
                target: JSON.parse(r.target),
                auth: r.auth ? JSON.parse(r.auth) : undefined,
            })) ?? []
        );
    }

    private registerRoute(route: Route) {
        if (route.target) this.proxy.reload();
    }

    private async findRoute(
        source: string,
        target: ITargetOptions
    ): Promise<{ route: Route; idx: number } | undefined> {
        const routes = await this.getRoutes();
        const idx = routes.findIndex(
            (r) =>
                r.source === source &&
                r.target.proxyUri === target.proxyUri &&
                r.target.webroot === target.webroot
        );
        return idx >= 0 ? { route: routes[idx], idx } : undefined;
    }

    public async getRoute(
        source: string,
        target: ITargetOptions
    ): Promise<Route | undefined> {
        const result = await this.findRoute(source, target);
        return result ? result.route : undefined;
    }

    private async removeRoute(id: number) {
        await db("routes").where({ id }).del();
    }

    async register(route: Route) {
        if (route.ssl && route.email === "")
            throw new Error("Need to specify an email address when using ssl");

        const result = await this.findRoute(route.source, route.target);
        if (result) {
            await this.removeRoute(result.route.id);
            this.proxy.reload();
        }
        this.registerRoute(route);
        await db
            .insert({
                ...route,
                updatedAt: new Date().toISOString(),
                target: JSON.stringify(route.target),
                auth: route.auth ? JSON.stringify(route.auth) : undefined,
            })
            .into("routes");
    }

    async unregister(source: string, target: ITargetOptions) {
        const result = await this.findRoute(source, target);
        if (result) {
            await this.removeRoute(result.route.id);
            return this.proxy.reload();
        }
        throw new Error("Route doesn't exist!");
    }
}
