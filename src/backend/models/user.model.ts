import cryptoRandomString from "crypto-random-string";
import Joi from "joi";

export const userSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().required().default("admin@example.com"),
    password: Joi.string()
        .required()
        .default(cryptoRandomString({ length: 20 })),
});

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
}
