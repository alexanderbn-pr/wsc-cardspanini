import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Position } from "../../domain/entities/Position.js";
import { PositionRepository } from "../../domain/repositories/position.repository.js";
import { getEnv } from "../../config/env.js";

interface SupabasePositionRow {
  id: number;
  name: string;
}

/**
 * Supabase-based implementation of PositionRepository.
 * Handles ONLY position operations.
 */
export class SupabasePositionRepository implements PositionRepository {
  private client: SupabaseClient;

  constructor() {
    const env = getEnv();
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  async getAll(): Promise<Position[]> {
    const { data, error } = await this.client
      .from("Positions")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }

    return (data ?? []).map(this.mapPosition);
  }

  private mapPosition(row: SupabasePositionRow): Position {
    return {
      id: row.id,
      name: row.name,
    };
  }
}
