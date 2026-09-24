import type { Options } from "p-retry";
import { Prisma } from "@prisma/client";

/**
 * Shared retry configuration for database operations (Prisma).
 * - 3 retries with exponential backoff
 * - Randomized timeouts to avoid thundering herd
 */
export const DB_RETRY_CONFIG: Options = {
  retries: 3,
  minTimeout: 500,
  factor: 2,
  maxTimeout: 5000,
  randomize: true,
};

/**
 * Shared retry configuration for cache operations (Redis).
 * - 2 retries with faster backoff (cache is expected to be fast)
 */
export const CACHE_RETRY_CONFIG: Options = {
  retries: 2,
  minTimeout: 200,
  factor: 2,
  maxTimeout: 2000,
};

/**
 * Checks if an error is a business error that should NOT be retried.
 * These errors are expected behavior, not transient failures.
 */
export function isBusinessError(error: unknown): boolean {
  // Prisma known errors (P2002 unique constraint, P2025 not found, etc.)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation — duplicate write
    // P2025: Record not found — business rule
    // P2003: Foreign key constraint — invalid reference
    return ["P2002", "P2025", "P2003"].includes(error.code);
  }

  // Application-level business errors (4xx)
  // AppError is thrown by controllers/services for business logic
  if (error && typeof error === "object" && "statusCode" in error) {
    const statusCode = (error as { statusCode: number }).statusCode;
    return statusCode >= 400 && statusCode < 500;
  }

  return false;
}

/**
 * shouldConsumeRetry function for pRetry.
 * Returns false to skip retry on business errors, true otherwise.
 */
export const shouldConsumeRetry = ({ error }: { error: unknown }): boolean => {
  return !isBusinessError(error);
};

/**
 * DB write retry config — uses shouldConsumeRetry to skip on business errors.
 * Use this for create/update/delete operations.
 */
export const DB_WRITE_RETRY_CONFIG: Options = {
  ...DB_RETRY_CONFIG,
  shouldConsumeRetry,
};
