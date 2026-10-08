import { createRequire } from "module";
const require = createRequire(import.meta.url);
const rateLimitModule = require("express-rate-limit");
const rateLimit =
  rateLimitModule.rateLimit || rateLimitModule.default || rateLimitModule;

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});
