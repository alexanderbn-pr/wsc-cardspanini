import { z } from "zod";
import { paginationSchema } from "./PaginationStickerSchema.js";
import "../openapi/zod-extend.js";

export const stickerFiltersSchema = z
  .object({
    id: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
    // `teamId` es el nombre canónico; `idTeam` se mantiene como alias
    // retrocompatible con el nombre del campo en la BD. Antes de este cambio
    // `?teamId=` se descartaba en silencio (Zod strip) y el filtro no aplicaba.
    teamId: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .openapi({ example: 1 }),
    idTeam: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .openapi({ example: 1 }),
    number: z.string().optional().openapi({ example: "001" }),
    name: z.string().optional().openapi({ example: "Lamine Yamal" }),
    positionId: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .openapi({ example: 1 }),
    check: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    quantity: z.coerce.number().int().min(0).optional().openapi({ example: 0 }),
  })
  .merge(paginationSchema)
  // Escenario "Both parameters rejected" del spec: los dos juntos -> 400.
  // El issue va en `teamId` para que aparezca en `fieldErrors.teamId`, que es
  // lo que devuelve el controller; un issue de nivel objeto dejaría `errors: {}`.
  .superRefine((value, ctx) => {
    if (value.teamId !== undefined && value.idTeam !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teamId"],
        message: "Use either teamId or idTeam, not both",
      });
    }
  })
  // Normaliza a UN solo campo `idTeam` (el que espera el tipo de dominio
  // StickerFilters). `teamId` deja de existir en el tipo de salida.
  .transform((value) => {
    const { teamId, ...rest } = value;
    return { ...rest, idTeam: value.idTeam ?? teamId };
  })
  .openapi("StickerFilters");

export type StickerFiltersInput = z.infer<typeof stickerFiltersSchema>;
