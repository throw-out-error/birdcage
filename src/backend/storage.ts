import { loadConfig, Config, updateConfig } from "./libs/config";
import { ReverseProxy } from "./server";
import { Route, TargetOptions } from "src/shared/api";
import { Service } from "typedi";

@Service()
export class RouteStorage {
    routes: Route[] = [];

    constructor(
        private readonly path: string,
        private readonly production: boolean,
        private readonly proxy: ReverseProxy
    ) {}

    async load() {
        const config = await loadConfig(this.path);
        this.routes = config.routes;
        for (const route of this.routes) this.registerRoute(route);
    }

    private registerRoute(route: Route) {
        if (route.target.proxyUri) this.proxy.register(route);
    }

    private findRoute(
        source: string,
        target: TargetOptions
    ): { route: Route; idx: number } | undefined {
        const idx = this.routes.findIndex(
            (r) => r.source === source && r.target === target
        );
        return idx >= 0 ? { route: this.routes[idx], idx } : undefined;
    }

    public getRoute(source: string, target: TargetOptions): Route | undefined {
        const result = this.findRoute(source, target);
        return result ? result.route : undefined;
    }

    private removeRoute(idx: number) {
        this.routes.splice(idx, 1);
    }

    async register(route: Route) {
        if (route.ssl && route.email === "")
            throw new Error("Need to specify an email address when using ssl");

        const result = this.findRoute(route.source, route.target);
        if (result) {
            this.removeRoute(result.idx);
            this.proxy.unregister(route);
        }
        this.registerRoute(route);
        this.routes = [route, ...this.routes];
        return updateConfig<Config>({ routes: this.routes }, this.path);
    }

    async unregister(source: string, target: TargetOptions) {
        const result = this.findRoute(source, target);
        if (result) {
            this.removeRoute(result.idx);
            this.proxy.unregister(result.route);
            return updateConfig<Config>({ routes: this.routes }, this.path);
        }
        throw new Error("Route doesn't exist!");
    }
}
