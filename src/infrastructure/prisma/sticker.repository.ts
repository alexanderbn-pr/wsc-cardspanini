import { Sticker } from "../../domain/entities/Sticker.js";
import { StickerFilters } from "../../modules/stickers.js"
import { StickerRepository } from "../../domain/repositories/sticker.repository.js";
import { prisma } from "../../config/prisma.js";

/**
 * Prisma-based implementation of StickerRepository.
 * Handles ONLY sticker operations.
 *
 * NOTE: We use raw SQL JOINs instead of Prisma `include` because
 * PrismaPg driver adapter doesn't resolve relations with `include`.
 */
export class PrismaStickerRepository implements StickerRepository {

  async getByTeamId(teamId: number): Promise<Sticker[]> {
    const rows = await prisma.$queryRaw<StickerRow[]>`
      SELECT s.id, s.name, s.number, s."positionId", s.check, s.quantity,
             p.name AS "positionName"
      FROM "Stickers" s
      LEFT JOIN "Position" p ON s."positionId" = p.id
      WHERE s."idTeam" = ${teamId}
      ORDER BY s.id ASC
    `;
    return rows.map(this.mapSticker);
  }

  async create(sticker: Sticker, teamId: number): Promise<Sticker> {
    const created = await prisma.sticker.create({
      data: {
        name: sticker.name,
        number: sticker.number,
        positionId: sticker.positionId,
        check: sticker.check,
        quantity: sticker.quantity,
        idTeam: teamId,
      },
    });

    // Fetch position name separately
    const pos = await prisma.position.findUnique({ where: { id: created.positionId } });

    return {
      id: created.id,
      number: created.number,
      name: created.name,
      positionId: created.positionId,
      position: pos?.name ?? "",
      check: created.check,
      quantity: created.quantity,
    };
  }

  async filterStickers(filters: StickerFilters) : Promise<Sticker[]>{
    const skip = filters.page * filters.limit
    const where: Record<string, any> = {};
    if (filters.id !== undefined) where.id = filters.id;
    if (filters.idTeam !== undefined) where.idTeam = filters.idTeam;
    if (filters.number !== undefined) where.number = filters.number;
    if (filters.name !== undefined) where.name = filters.name;
    if (filters.positionId !== undefined) where.positionId = filters.positionId;
    if (filters.check !== undefined) where.check = filters.check;
    if (filters.quantity !== undefined) where.quantity = filters.quantity;

    const stickers = await prisma.sticker.findMany({
      where,
      skip: skip,
      take: filters.limit,
      orderBy: { id: "asc" },
    });

    // Batch-fetch position names
    const positionIds = [...new Set(stickers.map(s => s.positionId))];
    const positions = await prisma.position.findMany({
      where: { id: { in: positionIds } },
    });
    const posMap = new Map(positions.map(p => [p.id, p.name]));

    return stickers.map(s => ({
      id: Number(s.id),
      number: s.number,
      name: s.name,
      positionId: Number(s.positionId),
      position: posMap.get(s.positionId) ?? "",
      check: s.check,
      quantity: Number(s.quantity),
    }));
  }

  private mapSticker(row: StickerRow): Sticker {
    return {
      id: Number(row.id),
      number: row.number,
      name: row.name,
      positionId: Number(row.positionId),
      position: row.positionName ?? "",
      check: row.check,
      quantity: Number(row.quantity),
    };
  }
}

interface StickerRow {
  id: bigint | number;
  name: string;
  number: string;
  positionId: number;
  check: boolean;
  quantity: number;
  positionName: string | null;
}
