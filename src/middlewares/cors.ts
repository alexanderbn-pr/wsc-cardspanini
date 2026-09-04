import cors from 'cors';
import { ACCEPTED_ORIGINS } from "../config/config.js";

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => {
    return cors({
        origin: (origin, callback) => {
            if (!origin || acceptedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
    });
}