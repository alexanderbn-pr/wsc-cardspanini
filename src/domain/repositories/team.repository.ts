import { Team } from "../entities/Team.js";

/**
 * Repository interface for Team data access.
 */
export interface TeamRepository {
  getAll(collectionId?: number): Promise<Team[]>;
  getById(id: number): Promise<Team | undefined>;
}
