import { Position } from "../../domain/entities/Position.js";
import { PositionRepository } from "../../domain/repositories/position.repository.js";
import { prisma } from "../../config/prisma.js";
import pRetry from "p-retry";

/**
 * Prisma-based implementation of PositionRepository.
 * Handles ONLY position operations.
 */
export class PrismaPositionRepository implements PositionRepository {

async getAll(): Promise<Position[]> {
    const positions = await pRetry(
        () =>
            prisma.position.findMany({
                orderBy: { id: "asc" },
            }),
        {
            retries: 3,
            minTimeout: 500,
            factor: 2,
            maxTimeout: 5000,
        }
    );
    return positions.map(this.mapPosition);
}

  private mapPosition(row: any): Position {
    return {
      id: row.id,
      name: row.name,
    };
  }
}
