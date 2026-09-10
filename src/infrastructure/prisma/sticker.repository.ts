import { Sticker } from "../../domain/entities/Sticker.js";
import { StickerRepository } from "../../domain/repositories/sticker.repository.js";
import { prisma } from "../../config/prisma.js";

/**
 * Prisma-based implementation of StickerRepository.
 * Handles ONLY sticker operations.
 */
export class PrismaStickerRepository implements StickerRepository {

  async getByTeamId(teamId: number): Promise<Sticker[]> {
    const stickers = await prisma.sticker.findMany({
      where: { idTeam: teamId },
      orderBy: { id: "asc" },
    });
    return stickers.map(this.mapSticker);
  }

  async create(sticker: Sticker, teamId: number): Promise<Sticker> {
    const created = await prisma.sticker.create({
      data: {
        name: sticker.name,
        number: sticker.number,
        position: sticker.position,
        check: sticker.check,
        quantity: sticker.quantity,
        idTeam: teamId,
      },
    });
    return this.mapSticker(created);
  }

  private mapSticker(row: any): Sticker {
    return {
      id: row.id,
      number: row.number,
      name: row.name,
      position: row.position,
      check: row.check,
      quantity: row.quantity,
    };
  }
}
