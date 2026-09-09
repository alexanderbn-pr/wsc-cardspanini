import { Team } from "../entities/Team.js";

/**
 * Repository interface for Team data access.
 * Defines WHAT operations are available for teams,
 * but NOT HOW they are implemented.
 *
 * Any data source (JSON, Supabase, PostgreSQL, etc.)
 * must implement this interface to be used with TeamService.
 */
export interface TeamRepository {
  getAll(): Promise<Team[]>;
  getById(id: number): Promise<Team | undefined>;
}
