import { z } from "zod";
import "../openapi/zod-extend.js";

/**
 * PATCH /stickers/:id — body con `delta` relativo.
 *
 * `.strict()` es deliberado: el spec exige que un body que incluya `check`
 * devuelva 400, y Zod por defecto descarta las claves extra en silencio.
 *
 * `delta` se limita a enteros porque `quantity` es int4 en la BD; un delta
 * fraccionario no estaría en el contrato pero provocaría un error de Prisma
 * (500) en lugar de un 400. No se restringe a ±1: el spec no lo hace.
 *
 * Se declaran `params` y `query` porque `validate()` reasigna los tres campos
 * al `req` (middlewares/zod.ts:20-22); si no se declaran, `req.params` queda
 * `undefined` y el handler no puede leer `:id`.
 */
export const UpdateStickerSchema = z
  .object({
    body: z
      .object({
        delta: z.number().int().openapi({ example: 1 }),
      })
      .strict()
      .openapi("UpdateStickerBody"),
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
    query: z.object({}).passthrough(),
  })
  .openapi("UpdateSticker");

export type UpdateStickerInput = z.infer<typeof UpdateStickerSchema>;
