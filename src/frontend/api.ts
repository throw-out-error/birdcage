import { AdminAPI } from "../shared/admin-api";
import axios from "axios";

export const api = axios.create({
    baseURL: "./api/",
});
