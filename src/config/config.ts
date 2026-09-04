import { DEFAULTS_TYPE, ACCEPTED_ORIGINS_TYPE } from "./config.types.js";
export const DEFAULTS: DEFAULTS_TYPE = {
    LIMIT_PAGINATION: 100,
    OFFSET_PAGINATION: 0,
    ORDER: 'asc'
}

export const ACCEPTED_ORIGINS: ACCEPTED_ORIGINS_TYPE = [
    "http://localhost:*",
]
