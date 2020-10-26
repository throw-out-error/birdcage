import { store, tc } from "./libs/config";
import { ReverseProxy } from "./server";
import { Route, TargetOptions } from "src/shared/api";
import { Service } from "typedi";

@Service()
export class RouteStorage {
    constructor(
        private readonly production: boolean,
        private readonly proxy: ReverseProxy
    ) {}

    async load() {
        for (const route of await this.getRoutes()) this.registerRoute(route);
    }

    async getRoutes(): Promise<Route[]> {
        return (store.get(tc.routes.$path) as Route[]) ?? [];
    }

    private registerRoute(route: Route) {
        if (route.target.proxyUri) this.proxy.register(route);
    }

    private async findRoute(
        source: string,
        target: TargetOptions
    ): Promise<{ route: Route; idx: number } | undefined> {
        const routes = await this.getRoutes();
        const idx = routes.findIndex(
            (r) => r.source === source && r.target === target
        );
        return idx >= 0 ? { route: routes[idx], idx } : undefined;
    }

    public async getRoute(
        source: string,
        target: TargetOptions
    ): Promise<Route | undefined> {
        const result = await this.findRoute(source, target);
        return result ? result.route : undefined;
    }

    private async removeRoute(idx: number) {
        store.set(tc.routes.$path, (await this.getRoutes()).splice(idx, 1));
    }

    async register(route: Route) {
        if (route.ssl && route.email === "")
            throw new Error("Need to specify an email address when using ssl");

        const result = await this.findRoute(route.source, route.target);
        if (result) {
            this.removeRoute(result.idx);
            this.proxy.unregister(route);
        }
        this.registerRoute(route);
        store.set(tc.routes.$path, [route, ...(await this.getRoutes())]);
    }

    async unregister(source: string, target: TargetOptions) {
        const result = await this.findRoute(source, target);
        if (result) {
            this.removeRoute(result.idx);
            return this.proxy.unregister(result.route);
        }
        throw new Error("Route doesn't exist!");
    }
}
