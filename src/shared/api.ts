import {
    ValidateIf,
    IsFQDN,
    Length,
    IsUrl,
    IsBoolean,
    IsDefined,
    IsEmail,
    IsNotEmptyObject,
} from "class-validator";

export class TargetOptions {
    @ValidateIf(
        (o: TargetOptions) => o.webroot !== undefined && o.webroot !== null
    )
    @Length(3)
    webroot?: string;

    @ValidateIf(
        (o: TargetOptions) => o.proxyUri !== undefined && o.proxyUri !== null
    )
    @Length(1)
    @IsUrl()
    proxyUri?: string;
}

export interface IRoute {
    source: string;
    target: TargetOptions;
    ssl: boolean;
    email: string;
    /**
     * If specified, these are the valid users/roles that are allowed to access this route;
     */
    auth?: string[] | string;
}

export class Route implements IRoute {
    @Length(1)
    @IsFQDN()
    @IsDefined()
    source = "example.com";
    @IsDefined()
    @IsNotEmptyObject()
    target: TargetOptions = {};
    @IsDefined()
    @IsBoolean()
    ssl = false;

    @ValidateIf((o: IRoute) => o.email !== undefined && o.email !== null)
    @IsEmail()
    email = "admin@example.com";

    auth?: string | string[] | undefined;
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
