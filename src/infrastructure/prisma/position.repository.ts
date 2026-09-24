import { Position } from "../../domain/entities/Position.js";
import { PositionRepository } from "../../domain/repositories/position.repository.js";
import { prisma } from "../../config/prisma.js";
import { DB_RETRY_CONFIG } from "../../config/retry.js";
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
        DB_RETRY_CONFIG,
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
