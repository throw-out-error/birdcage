import { AdminAPI } from "../shared/admin-api";
import { Router, Request, Response } from "express";
import { RouteStorage } from "./storage";
import { log } from "./libs/utils";
import { Auth } from "./auth";

const checkAuth = (req: Request) => !!(req.session && req.session.authed);

export function registerAPI(
    apiRouter: Router,
    storage: RouteStorage,
    auth: Auth
): void {
    const router = apiRouter;

    router.get("/auth", async (req: Request, res) => {
        try {
            let authed = checkAuth(req);
            if (!authed && (await auth.checkPassword("")) && req.session) {
                req.session.authed = true;
                authed = true;
            }

            res.json({ authed });
        } catch (err) {
            log.main.error(`Error getting auth: ${err.toString()}`);
            res.json({ authed: false });
        }
    });

    router.put("/auth", async (req, res) => {
        try {
            const pw = req.body.password;

            if (!checkAuth(req)) throw new Error("Not logged in!");

            await auth.setPassword(pw);
            res.json({ success: true });
        } catch (err) {
            log.main.error(`Error setting password: ${err.toString()}`);
            res.json({ success: false, error: err.toString() });
        }
    });

    router.post("/auth", async (req, res) => {
        const pw: string = req.body.password;
        try {
            if (await auth.checkPassword(pw)) {
                if (req.session) req.session.authed = true;
                res.json({ success: true });
            } else
                res.json({
                    success: false,
                    error: "Wrong password!",
                });
        } catch (err) {
            log.main.error(`Error checking password: ${err.toString()}`);
            res.json({ success: false, error: err.toString() });
        }
    });

    router.delete("/auth", async (req, res) => {
        if (!checkAuth(req))
            res.json({ success: false, error: "Not logged in!" });

        if (req.session) req.session.authed = false;

        res.json({ success: true });
    });

    router.get("/routes", async (req) => {
        if (!checkAuth(req)) return [];

        return storage.routes;
    });

    router.post("/routes", async (req, res) => {
        try {
            const { source, target } = req.body;

            if (!checkAuth(req)) throw new Error("Not logged in!");

            if (storage.getRoute(source, target))
                throw new Error("Route already exists!");

            await storage.register(req.body);
            log.interaction.info(`Added route: ${source} -> ${target}`);
            res.json({ success: true });
        } catch (err) {
            log.main.error(`Error adding route: ${err.toString()}`);
            res.json({ success: false, error: err.toString() });
        }
    });

    router.put("/routes/:source/:target", async (req, res) => {
        try {
            const { source, target } = req.body;

            if (!checkAuth(req)) throw new Error("Not logged in!");

            await storage.register(req.body);
            log.interaction.info(`Updated route: ${source} -> ${target}`);
            res.json({ success: true });
        } catch (err) {
            log.main.error(`Error adding route: ${err.toString()}`);
            res.json({ success: false, error: err.toString() });
        }
    });

    router.delete("/routes/:source/:target", async (req, res) => {
        try {
            const { source, target } = req.params;

            if (!checkAuth(req)) throw new Error("Not logged in!");

            await storage.unregister(source, target);
            log.interaction.info(`Deleted route: ${source} -> ${target}`);
            res.json({ success: true });
        } catch (err) {
            log.main.error(`Error deleting route: ${err.toString()}`);
            res.json({ success: false, error: err.toString() });
        }
    });
}
