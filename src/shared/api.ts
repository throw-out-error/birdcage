export interface ITargetOptions {
    webroot?: string;
    proxyUri?: string;
}

export interface Route {
    source: string;
    target: ITargetOptions;
    ssl: boolean;
    email: string;
    /**
     * If specified, these are the valid users/roles that are allowed to access this route;
     */
    auth?: string[] | string;
}

export interface Site {
    routes: Route[];
}

export interface IResponse {
    success: boolean;
    error?: string;
}

export interface AdminAPI {
    "/auth": {
        GET: {
            response: {
                authed: boolean;
            };
        };
        POST: {
            body: {
                password: string;
            };
            response: IResponse;
        };
        PUT: {
            body: {
                password: string;
            };
            response: IResponse;
        };
        DELETE: {
            response: IResponse;
        };
    };
    "/routes": {
        POST: {
            body: Route;
            response: IResponse;
        };
        GET: {
            response: Route[];
        };
    };
    "/routes/:source/:target": {
        PUT: {
            params: {
                source: string;
                target: string;
            };
            body: Route;
            response: IResponse;
        };
        DELETE: {
            params: {
                source: string;
                target: string;
            };
            response: IResponse;
        };
    };
}

export * from "./client";
