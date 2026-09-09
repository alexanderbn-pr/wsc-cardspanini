import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: z.ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten(),
      });
    }

    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;

    next();
  };