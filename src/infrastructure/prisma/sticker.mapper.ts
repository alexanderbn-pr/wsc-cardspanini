import type { Prisma } from "@prisma/client";
import { Sticker } from "../../domain/entities/Sticker.js";

/**
 * Payload de Prisma para un Sticker con su posición incluida.
 * El tipo lo deriva el propio cliente, así que no puede desincronizarse
 * del schema como sí pasaba con las interfaces `StickerRow` manuales.
 */
export type StickerWithPosition = Prisma.StickerGetPayload<{
  include: { position: true };
}>;

/** Argumentos de include compartidos para cargar la posición de un sticker. */
export const WITH_POSITION = { include: { position: true } } as const;

/**
 * Proyecta un Sticker de Prisma a la entidad de dominio.
 *
 * El dominio expone `position` como string plano, mientras Prisma devuelve la
 * entidad relacionada. Una posición ausente se degrada a "" en lugar de null.
 *
 * `editionId` es int8 en la DB real, así que Prisma lo entrega como BigInt;
 * se convierte a Number aquí — único punto de fuga — antes de `res.json()`,
 * que lanzaría si recibiera un BigInt.
 */
export function mapSticker(sticker: StickerWithPosition): Sticker {
  return {
    id: sticker.id,
    number: sticker.number,
    name: sticker.name,
    positionId: sticker.positionId,
    position: sticker.position?.name ?? "",
    check: sticker.check,
    quantity: sticker.quantity,
    editionId: sticker.editionId === null ? null : Number(sticker.editionId),
  };
}
