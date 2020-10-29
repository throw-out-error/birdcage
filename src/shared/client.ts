import axios from "restyped-axios";
import { AdminAPI } from "./api";

export const api = axios.create<AdminAPI>({
    baseURL: process.env.API || "/api",
});
