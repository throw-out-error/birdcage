import { loadConfig, Config, updateConfig } from "./libs/config";
import { ReverseProxy } from "./server";
import { Route, TargetOptions } from "src/shared/api";
import { Service } from "typedi";

@Service()
export class RouteStorage {
    private config!: Config;
    constructor(
        private readonly path: string,
        private readonly production: boolean,
        private readonly proxy: ReverseProxy
    ) {}

    async load() {
        this.config = await loadConfig(this.path);
        for (const route of this.config.routes) this.registerRoute(route);
    }

    getRoutes(): Route[] {
        return this.config.routes;
    }

    private registerRoute(route: Route) {
        if (route.target.proxyUri) this.proxy.register(route);
    }

    private findRoute(
        source: string,
        target: TargetOptions
    ): { route: Route; idx: number } | undefined {
        const idx = this.config.routes.findIndex(
            (r) => r.source === source && r.target === target
        );
        return idx >= 0 ? { route: this.config.routes[idx], idx } : undefined;
    }

    public getRoute(source: string, target: TargetOptions): Route | undefined {
        const result = this.findRoute(source, target);
        return result ? result.route : undefined;
    }

    private removeRoute(idx: number) {
        this.config.routes.splice(idx, 1);
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
        this.config.routes = [route, ...this.config.routes];
        return updateConfig<Config>({ routes: this.config.routes }, this.path);
    }

    async unregister(source: string, target: TargetOptions) {
        const result = this.findRoute(source, target);
        if (result) {
            this.removeRoute(result.idx);
            this.proxy.unregister(result.route);
            return updateConfig<Config>(
                { routes: this.config.routes },
                this.path
            );
        }
        throw new Error("Route doesn't exist!");
    }
}
