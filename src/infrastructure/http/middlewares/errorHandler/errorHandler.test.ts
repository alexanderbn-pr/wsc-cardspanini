import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorHandler, AppError } from "./errorHandler.js";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../../../logger/logger.js";

vi.mock("../../../logger/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Error Handler Middleware", () => {
  let req: Request;
  let res: Response;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      id: "request-123",
      method: "GET",
      url: "/teams/1",
    } as unknown as Request;

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    next = vi.fn();
  });

  describe("selección de nivel de log", () => {
    it("should log an operational AppError below 500 as a warning", () => {
      const error = new AppError(404, "Team not found");

      errorHandler(error, req, res, next);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should log an AppError with a 5xx status as an error, not a warning", () => {
      const error = new AppError(503, "Service unavailable");

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("should log a non-operational AppError as an error even on a 4xx status", () => {
      const error = new AppError(404, "Teapot", false);

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should log an unexpected Error as an error, not a warning", () => {
      const error = new Error("Database connection failed");

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("should log a ZodError as an error, not a warning", () => {
      const error = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string, received number",
        },
      ]);

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe("payload del log", () => {
    it("should include the request context and the error message", () => {
      const error = new AppError(404, "Team not found");

      errorHandler(error, req, res, next);

      expect(logger.warn).toHaveBeenCalledWith(
        {
          err: error,
          requestId: "request-123",
          method: "GET",
          url: "/teams/1",
        },
        "Team not found",
      );
    });
  });

  describe("respuestas", () => {
    it("should return the status code and message for an AppError", () => {
      const error = new AppError(404, "Team not found");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Team not found",
      });
    });

    it("should return 500 for an unexpected error without leaking its message", () => {
      const error = new Error("Database connection failed");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Internal server error",
      });
      const body = vi.mocked(res.json).mock.calls[0]?.[0] as {
        message: string;
      };
      expect(body.message).not.toContain("Database connection failed");
    });

    it("should return validation errors for a ZodError", () => {
      const error = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string, received number",
        },
      ]);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation error",
        errors: [
          {
            field: "name",
            message: "Expected string, received number",
          },
        ],
      });
    });

    it("should flatten a nested ZodError path into a dotted field name", () => {
      const error = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["user", "profile", "email"],
          message: "Expected string, received number",
        },
      ]);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation error",
        errors: [
          {
            field: "user.profile.email",
            message: "Expected string, received number",
          },
        ],
      });
    });

    it("should map every ZodError issue, not only the first", () => {
      const error = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string, received number",
        },
        {
          code: "invalid_type",
          expected: "number",
          received: "string",
          path: ["year"],
          message: "Expected number, received string",
        },
      ]);

      errorHandler(error, req, res, next);

      const body = vi.mocked(res.json).mock.calls[0]?.[0] as {
        errors: { field: string; message: string }[];
      };
      expect(body.errors).toHaveLength(2);
      expect(body.errors.map((e) => e.field)).toEqual(["name", "year"]);
    });

    it("should honour a non-standard AppError status code", () => {
      const error = new AppError(429, "Too many requests");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Too many requests",
      });
    });
  });

  describe("contrato del middleware", () => {
    it("should never delegate to next, because it terminates the response", () => {
      const appError = new AppError(404, "Team not found");
      errorHandler(appError, req, res, next);
      expect(next).not.toHaveBeenCalled();

      const plainError = new Error("boom");
      errorHandler(plainError, req, res, next);
      expect(next).not.toHaveBeenCalled();

      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string, received number",
        },
      ]);
      errorHandler(zodError, req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it("should write exactly one response per call", () => {
      const error = new AppError(404, "Team not found");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledTimes(1);
    });
  });
});

describe("AppError", () => {
  it("should be an instance of both AppError and Error", () => {
    const error = new AppError(404, "Team not found");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should default isOperational to true", () => {
    expect(new AppError(404, "Team not found").isOperational).toBe(true);
  });

  it("should keep the status code and message as public fields", () => {
    const error = new AppError(422, "Validation failed");

    expect(error.statusCode).toBe(422);
    expect(error.message).toBe("Validation failed");
  });
});
