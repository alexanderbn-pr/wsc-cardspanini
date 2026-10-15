import { Team } from "../../../domain/entities/Team.js";
import { TeamRepository } from "../../../domain/repositories/team.repository.js";
import { prisma } from "../../../config/prisma.js";
import { DB_RETRY_CONFIG } from "../../../config/retry.js";
import { mapSticker, WITH_POSITION } from "../sticker.mapper.js";
import pRetry from "p-retry";

/**
 * Prisma-based implementation of TeamRepository.
 * Handles ONLY team operations.
 */
export class PrismaTeamRepository implements TeamRepository {
  async getAll(collectionId?: number): Promise<Team[]> {
    const teams = await pRetry(
      () =>
        prisma.team.findMany({
          orderBy: { id: "asc" },
          where: collectionId ? { collectionId: collectionId } : undefined,
          include: {
            stickers: { ...WITH_POSITION, orderBy: { id: "asc" } },
          },
        }),
      DB_RETRY_CONFIG,
    );

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      collectionId: team.collectionId,
      stickers: team.stickers.map(mapSticker),
    }));
  }

  async getById(id: number): Promise<Team | undefined> {
    const team = await pRetry(
      () =>
        prisma.team.findUnique({
          where: { id },
          include: {
            stickers: { ...WITH_POSITION, orderBy: { id: "asc" } },
          },
        }),
      DB_RETRY_CONFIG,
    );

    if (!team) return undefined;

    return {
      id: team.id,
      name: team.name,
      collectionId: team.collectionId,
      stickers: team.stickers.map(mapSticker),
    };
  }
}
