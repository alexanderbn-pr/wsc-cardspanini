import { Collection } from "../entities/Collection.js";
/**
 * Repository interface for Collection data access.
 */
export interface CollectionRepository {
  getAll(): Promise<Collection[]>;
  getById(id: number): Promise<Collection | undefined>;
}
