import cors from "cors";
import { ACCEPTED_ORIGINS } from "../../../config/config.js";

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => {
  return cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (acceptedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      try {
        const url = new URL(origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          callback(null, true);
          return;
        }
      } catch (error) {
        // ignore and fall through
      }
      callback(new Error("Not allowed by CORS"));
    },
  });
};
