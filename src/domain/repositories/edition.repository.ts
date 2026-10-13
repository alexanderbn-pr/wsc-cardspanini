import { Edition } from "../entities/Edition.js";

/**
 * Repository interface for Edition data access (read-only catalog).
 * Editions are seeded on the DB side and never created through the API.
 */
export interface EditionRepository {
  getAll(): Promise<Edition[]>;
}
