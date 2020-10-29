import { db } from "./db";
import { ReverseProxy } from "./proxy-server";
import { Route, ITargetOptions } from "src/shared/api";
import { Service } from "typedi";

@Service()
export class RouteStorage {
    constructor(private readonly proxy: ReverseProxy) {}

    async load(): Promise<void> {
        for (const route of await this.getRoutes()) this.registerRoute(route);
    }

    async getRoutes(): Promise<Route[]> {
        return (await db().select().from("routes")) ?? [];
    }

    private registerRoute(route: Route) {
        if (route.target.proxyUri) this.proxy.register(route);
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

    private async removeIRoute(id: number) {
        await db().del().from("routes").where({ id });
    }

    async register(route: Route) {
        if (route.ssl && route.email === "")
            throw new Error("Need to specify an email address when using ssl");

        const result = await this.findRoute(route.source, route.target);
        if (result) {
            this.removeIRoute(result.idx);
            this.proxy.unregister(route);
        }
        this.registerRoute(route);
        await db().insert(route).returning("*").into("routes");
    }

    async unregister(source: string, target: ITargetOptions) {
        const result = await this.findRoute(source, target);
        if (result) {
            this.removeIRoute(result.idx);
            return this.proxy.unregister(result.route);
        }
        throw new Error("IRoute doesn't exist!");
    }
}
