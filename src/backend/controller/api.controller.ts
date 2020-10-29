import {
    Controller,
    ClassOptions,
    ChildControllers,
    Get,
} from "@overnightjs/core";
import Container from "typedi";
import { Request, Response } from "express";
import { AuthController } from "./auth.controller";
import { SiteController } from "./site.controller";

@Controller("api")
@ClassOptions({})
@ChildControllers([
    Container.get(AuthController),
    Container.get(SiteController),
])
export class ApiController {
    @Get("")
    status(_: Request, res: Response) {
        return res.status(200).json({
            success: true,
            message: "Hello World! This is a birdcage api.",
        });
    }
}
