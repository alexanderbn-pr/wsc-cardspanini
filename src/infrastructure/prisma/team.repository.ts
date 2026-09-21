import { Team } from "../../domain/entities/Team.js";
import { Sticker } from "../../domain/entities/Sticker.js";
import { TeamRepository } from "../../domain/repositories/team.repository.js";
import { prisma } from "../../config/prisma.js";

interface TeamRow {
  id: bigint | number;
  name: string;
}

interface StickerRow {
  id: bigint | number;
  name: string;
  number: string;
  positionId: number;
  check: boolean;
  quantity: number;
  idTeam: number;
  positionName: string | null;
}

/**
 * Prisma-based implementation of TeamRepository.
 * Handles ONLY team operations.
 *
 * NOTE: We use raw SQL JOINs instead of Prisma `include` because
 * PrismaPg driver adapter doesn't resolve relations with `include`.
 */
export class PrismaTeamRepository implements TeamRepository {

  async getAll(): Promise<Team[]> {
    const teams = await prisma.$queryRaw<TeamRow[]>`
      SELECT id, name FROM "Teams" ORDER BY id ASC
    `;

    if (teams.length === 0) return [];

    const teamIds = teams.map(t => Number(t.id));

    const stickers = await prisma.$queryRaw<StickerRow[]>`
      SELECT s.id, s.name, s.number, s."positionId", s.check, s.quantity, s."idTeam",
             p.name AS "positionName"
      FROM "Stickers" s
      LEFT JOIN "Position" p ON s."positionId" = p.id
      WHERE s."idTeam" = ANY(${teamIds})
      ORDER BY s.id ASC
    `;

    const stickersByTeam = new Map<number, Sticker[]>();
    for (const row of stickers) {
      const teamId = row.idTeam;
      if (!stickersByTeam.has(teamId)) stickersByTeam.set(teamId, []);
      stickersByTeam.get(teamId)!.push(this.mapSticker(row));
    }

    return teams.map(t => ({
      id: Number(t.id),
      name: t.name,
      stickers: stickersByTeam.get(Number(t.id)) ?? [],
    }));
  }

  async getById(id: number): Promise<Team | undefined> {
    const team = await prisma.$queryRaw<TeamRow[]>`
      SELECT id, name FROM "Teams" WHERE id = ${id}
    `;

    if (team.length === 0) return undefined;

    const stickers = await prisma.$queryRaw<StickerRow[]>`
      SELECT s.id, s.name, s.number, s."positionId", s.check, s.quantity, s."idTeam",
             p.name AS "positionName"
      FROM "Stickers" s
      LEFT JOIN "Position" p ON s."positionId" = p.id
      WHERE s."idTeam" = ${id}
      ORDER BY s.id ASC
    `;

    return {
      id: Number(team[0].id),
      name: team[0].name,
      stickers: stickers.map(this.mapSticker),
    };
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
