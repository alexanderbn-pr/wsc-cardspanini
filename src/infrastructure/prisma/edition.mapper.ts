import type { Prisma } from "@prisma/client";
import { Edition } from "../../domain/entities/Edition.js";

/**
 * Fila de Prisma para una Edition (sin relaciones). El tipo lo deriva el
 * propio cliente, así que no puede desincronizarse del schema.
 */
export type EditionRow = Prisma.EditionGetPayload<{
  select: { id: true; code: true; description: true; abbreviation: true };
}>;

/**
 * Proyecta una Edition de Prisma a la entidad de dominio.
 *
 * `Edition.id` es int8 en la DB real, así que Prisma lo entrega como BigInt;
 * se convierte a Number aquí — único punto de fuga — antes de `res.json()`,
 * que lanzaría si recibiera un BigInt.
 */
export function mapEdition(row: EditionRow): Edition {
  return {
    id: Number(row.id),
    code: row.code,
    description: row.description,
    abbreviation: row.abbreviation,
  };
}
