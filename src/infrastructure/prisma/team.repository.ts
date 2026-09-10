import { Team } from "../../domain/entities/Team.js";
import { TeamRepository } from "../../domain/repositories/team.repository.js";
import { prisma } from "../../config/prisma.js";

/**
 * Prisma-based implementation of TeamRepository.
 * Handles ONLY team operations.
 */
export class PrismaTeamRepository implements TeamRepository {

  async getAll(): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      include: { stickers: true },
      orderBy: { id: "asc" },
    });
    return teams.map(this.mapTeam);
  }

  async getById(id: number): Promise<Team | undefined> {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { stickers: true },
    });
    return team ? this.mapTeam(team) : undefined;
  }

  private mapTeam(prismaTeam: any): Team {
    return {
      id: prismaTeam.id,
      name: prismaTeam.name,
      stickers: prismaTeam.stickers.map((s: any) => ({
        id: s.id,
        number: s.number,
        name: s.name,
        position: s.position,
        check: s.check,
        quantity: s.quantity,
      })),
    };
  }
}
