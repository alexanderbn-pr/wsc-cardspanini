import { z } from "zod";
import { paginationSchema } from "./PaginationStickerSchema.js";
import "../openapi/zod-extend.js";

export const stickerFiltersSchema = z
  .object({
    collectionId: z.coerce.number().int().positive().openapi({ example: 2 }),
    id: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
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
    editionId: z.coerce.number().int().optional().openapi({ example: 2 }),
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
