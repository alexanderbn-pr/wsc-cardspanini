import { z } from "zod";
import { paginationSchema } from "./PaginationStickerSchema.js";

export const stickerFiltersSchema = z.object({
    id: z.coerce.number().int().positive().optional(),
    idTeam: z.coerce.number().int().positive().optional(),
    number: z.string().optional(),
    name: z.string().optional(),
    position: z.string().optional(),
    check: z.enum(["true", "false"]).transform(v => v === "true").optional(),
    quantity: z.coerce.number().int().min(0).optional(),
}).merge(paginationSchema);

export type StickerFiltersInput = z.infer<typeof stickerFiltersSchema>;
