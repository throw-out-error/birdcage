export interface ITargetOptions {
    webroot?: string;
    proxyUri?: string;
}

export interface Route {
    id: number;
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
}

export interface IAuthResponse extends IResponse {
    authed: boolean;
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
                username: string;
                password: string;
            };
            response: IResponse;
        };
        PUT: {
            body: {
                username: string;
                password: string;
            };
            response: IResponse;
        };
        DELETE: {
            response: IResponse;
        };
    };
    "/auth/signup": {
        POST: {
            body: {
                username: string;
                password: string;
            };
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
