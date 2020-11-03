import { RateLimiterMemory, IRateLimiterOptions } from "rate-limiter-flexible";
import { Request, Response, NextFunction, RequestHandler } from "express";

export const createRateLimit = async (opts: {
    err?: () => unknown;
    apiLimits: IRateLimiterOptions;
}): Promise<RequestHandler> => {
    const rateLimiter = new RateLimiterMemory(opts.apiLimits);

    return (req: Request, res: Response, next: NextFunction) => {
        rateLimiter
            .consume(req.ip)
            .then(() => {
                next();
            })
            .catch(() => {
                if (!opts.err) opts.err = () => new Error("Too many requests");

                const error = opts.err();
                res.status(429);

                return res.json(error);
            });
    };
};
