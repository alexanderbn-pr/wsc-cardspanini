import { Sticker } from "../../domain/entities/Sticker.js";
import { StickerFilters } from "../../modules/stickers.js"
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

  async filterStickers(filters: StickerFilters) : Promise<Sticker[]>{
    const skip = filters.page * filters.limit
    const where: Record<string, any> = {};
    if (filters.id !== undefined) where.id = filters.id;
    if (filters.idTeam !== undefined) where.idTeam = filters.idTeam;
    if (filters.number !== undefined) where.number = filters.number;
    if (filters.name !== undefined) where.name = filters.name;
    if (filters.position !== undefined) where.position = filters.position;
    if (filters.check !== undefined) where.check = filters.check;
    if (filters.quantity !== undefined) where.quantity = filters.quantity;
    const stickers = await prisma.sticker.findMany({
      where,
      skip: skip,
      take: filters.limit,
      orderBy: { id: "asc" },
    });
    return stickers.map(this.mapSticker);
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
