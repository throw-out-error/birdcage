import { store, tc } from "../libs/config";
import { RateLimiterMemory, IRateLimiterOptions } from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";

export const createRateLimit = async (err?: () => unknown) => {
    const rateLimiter = new RateLimiterMemory(
        store.get(tc.apiLimits.$path) as IRateLimiterOptions
    );

    return (req: Request, res: Response, next: NextFunction) => {
        rateLimiter
            .consume(req.ip)
            .then(() => {
                next();
            })
            .catch(() => {
                if (!err) err = () => new Error("Too many requests");

                const error = err();
                res.status(429);

                if (typeof error === "string") return res.send(error);
                else return res.json(error);
            });
    };
};
