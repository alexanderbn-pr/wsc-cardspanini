import { Edition } from "../../domain/entities/Edition.js";
import { EditionRepository } from "../../domain/repositories/edition.repository.js";
import { prisma } from "../../config/prisma.js";
import { DB_RETRY_CONFIG } from "../../config/retry.js";
import { mapEdition } from "./edition.mapper.js";
import pRetry from "p-retry";

/**
 * Prisma-based implementation of EditionRepository.
 * Reads the catalog ordered by id ascending; `mapEdition` converts the int8
 * `id` to a Number so the JSON response never throws on a BigInt.
 */
export class PrismaEditionRepository implements EditionRepository {
  async getAll(): Promise<Edition[]> {
    const editions = await pRetry(
      () =>
        prisma.edition.findMany({
          orderBy: { id: "asc" },
        }),
      DB_RETRY_CONFIG,
    );
    return editions.map(mapEdition);
  }
}
