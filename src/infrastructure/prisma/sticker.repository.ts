import { Prisma } from "@prisma/client";
import { Sticker } from "../../domain/entities/Sticker.js";
import { StickerFilters } from "../../modules/stickers.js";
import { StickerRepository } from "../../domain/repositories/sticker.repository.js";
import { prisma } from "../../config/prisma.js";
import { DB_RETRY_CONFIG, DB_WRITE_RETRY_CONFIG } from "../../config/retry.js";
import { mapSticker, WITH_POSITION } from "./sticker.mapper.js";
import pRetry from "p-retry";

export class PrismaStickerRepository implements StickerRepository {
  async getByTeamId(teamId: number): Promise<Sticker[]> {
    const rows = await pRetry(
      () =>
        prisma.sticker.findMany({
          where: { idTeam: teamId },
          orderBy: { id: "asc" },
          ...WITH_POSITION,
        }),
      DB_RETRY_CONFIG,
    );
    return rows.map(mapSticker);
  }

  async create(sticker: Sticker, teamId: number): Promise<Sticker> {
    const created = await pRetry(
      () =>
        prisma.sticker.create({
          data: {
            name: sticker.name,
            number: sticker.number,
            positionId: sticker.positionId,
            check: sticker.check,
            quantity: sticker.quantity,
            idTeam: teamId,
          },
          ...WITH_POSITION,
        }),
      DB_WRITE_RETRY_CONFIG,
    );

    return mapSticker(created);
  }

  async filterStickers(filters: StickerFilters): Promise<Sticker[]> {
    const skip = filters.page * filters.limit;
    const where: Prisma.StickerWhereInput = {};
    if (filters.id !== undefined) where.id = filters.id;
    if (filters.idTeam !== undefined) where.idTeam = filters.idTeam;
    if (filters.number !== undefined) where.number = filters.number;
    if (filters.name !== undefined) where.name = filters.name;
    if (filters.positionId !== undefined) where.positionId = filters.positionId;
    if (filters.check !== undefined) where.check = filters.check;
    if (filters.quantity !== undefined) where.quantity = filters.quantity;

    const stickers = await pRetry(
      () =>
        prisma.sticker.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: { id: "asc" },
          ...WITH_POSITION,
        }),
      DB_RETRY_CONFIG,
    );

    return stickers.map(mapSticker);
  }

  async findById(id: number): Promise<(Sticker & { idTeam: number }) | null> {
    const row = await pRetry(
      () => prisma.sticker.findFirst({ where: { id }, ...WITH_POSITION }),
      DB_RETRY_CONFIG,
    );
    if (!row) return null;
    return { ...mapSticker(row), idTeam: row.idTeam };
  }

  async update(
    id: number,
    data: { quantity: number; check: boolean },
  ): Promise<Sticker | null> {
    try {
      const updated = await pRetry(
        () =>
          prisma.sticker.update({
            where: { id },
            data: { quantity: data.quantity, check: data.check },
            ...WITH_POSITION,
          }),
        DB_WRITE_RETRY_CONFIG,
      );
      return mapSticker(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }
}
