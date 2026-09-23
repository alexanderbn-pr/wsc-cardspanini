import { z } from "zod";
import { paginationSchema } from "./PaginationStickerSchema.js";
import '../openapi/zod-extend.js';

export const stickerFiltersSchema = z.object({
    id: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
    idTeam: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
    number: z.string().optional().openapi({ example: '001' }),
    name: z.string().optional().openapi({ example: 'Lamine Yamal' }),
    positionId: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
    check: z.enum(["true", "false"]).transform(v => v === "true").optional().openapi({ example: 'true' }),
    quantity: z.coerce.number().int().min(0).optional().openapi({ example: 0 }),
}).merge(paginationSchema).openapi('StickerFilters');

export type StickerFiltersInput = z.infer<typeof stickerFiltersSchema>;
