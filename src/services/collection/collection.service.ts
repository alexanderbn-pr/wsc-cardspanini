import { CollectionRepository } from "../../domain/repositories/collection.repository.js";
import { Collection } from "../../domain/entities/Collection.js";
import { AppError } from "../../infrastructure/http/middlewares/errorHandler/errorHandler.js";

export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async getAll(): Promise<Collection[]> {
    return this.collectionRepository.getAll();
  }

  async getById(id: number): Promise<Collection> {
    const collection = await this.collectionRepository.getById(id);

    if (!collection) {
      throw new AppError(404, `Collection with id ${id} not found`);
    }

    return collection;
  }
}
