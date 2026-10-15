import { z } from "zod";
import "../openapi/zod-extend.js";

/**
 * Zod schema for a Collection response.
 * Fields: id, name, description, createdAt
 * NO teams embedded — lean, collections-only response.
 */
export const collectionSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  completed: z.boolean().optional(),
});

export type CollectionOutput = z.infer<typeof collectionSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
