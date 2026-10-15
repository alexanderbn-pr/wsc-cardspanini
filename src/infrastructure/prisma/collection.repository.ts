import { Collection } from "../../domain/entities/Collection.js";
import { CollectionRepository } from "../../domain/repositories/collection.repository.js";
import { prisma } from "../../config/prisma.js";

/**
 * Prisma-based implementation of CollectionRepository.
 * Handles ONLY collection read operations.
 */
export class PrismaCollectionRepository implements CollectionRepository {
  async getAll(): Promise<Collection[]> {
    const collections = await prisma.collections.findMany({
      orderBy: { id: "asc" },
    });

    return collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
    }));
  }

  async getById(id: number): Promise<Collection | undefined> {
    const collection = await prisma.collections.findUnique({
      where: { id },
    });

    if (!collection) return undefined;

    return {
      id: collection.id,
      name: collection.name,
    };
  }
}
