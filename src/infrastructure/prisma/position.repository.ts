import { Position } from "../../domain/entities/Position.js";
import { PositionRepository } from "../../domain/repositories/position.repository.js";
import { prisma } from "../../config/prisma.js";

/**
 * Prisma-based implementation of PositionRepository.
 * Handles ONLY position operations.
 */
export class PrismaPositionRepository implements PositionRepository {

  async getAll(): Promise<Position[]> {
    const positions = await prisma.position.findMany({
      orderBy: { id: "asc" },
    });
    return positions.map(this.mapPosition);
  }

  private mapPosition(row: any): Position {
    return {
      id: row.id,
      name: row.name,
    };
  }
}
