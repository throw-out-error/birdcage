export interface Route {
    source: string;
    target: string;
    ssl: boolean;
    email: string;
}

export interface Response {
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
            response: Response;
        };
        PUT: {
            body: {
                password: string;
            };
            response: Response;
        };
        DELETE: {
            response: Response;
        };
    };
    "/routes": {
        POST: {
            body: Route;
            response: Response;
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
            response: Response;
        };
        DELETE: {
            params: {
                source: string;
                target: string;
            };
            response: Response;
        };
    };
}
