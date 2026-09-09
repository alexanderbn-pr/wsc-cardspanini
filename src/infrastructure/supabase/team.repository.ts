import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Team } from "../../domain/entities/Team.js";
import { Sticker } from "../../domain/entities/Sticker.js";
import { TeamRepository } from "../../domain/repositories/team.repository.js";
import { getEnv } from "../../config/env.js";

interface SupabaseStickerRow {
  id: number;
  name: string;
  number: string | null;
  position: string | null;
  check: boolean;
  quantity: number;
  idTeam: number;
}

interface SupabaseTeamRow {
  id: number;
  name: string;
}

/**
 * Supabase-based implementation of TeamRepository.
 * Handles ONLY team operations.
 */
export class SupabaseTeamRepository implements TeamRepository {
  private client: SupabaseClient;

  constructor() {
    const env = getEnv();
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  async getAll(): Promise<Team[]> {
    const { data: teams, error: teamsError } = await this.client
      .from("Teams")
      .select("*")
      .order("id", { ascending: true });

    if (teamsError) {
      throw new Error(`Failed to fetch teams: ${teamsError.message}`);
    }

    if (!teams || teams.length === 0) {
      return [];
    }

    const { data: stickers, error: stickersError } = await this.client
      .from("Stickers")
      .select("*")
      .order("id", { ascending: true });

    if (stickersError) {
      throw new Error(`Failed to fetch stickers: ${stickersError.message}`);
    }

    const stickersByTeam = this.groupStickersByTeam(stickers ?? []);

    return teams.map((team: SupabaseTeamRow) => ({
      id: team.id,
      name: team.name,
      stickers: stickersByTeam[team.id] ?? [],
    }));
  }

  async getById(id: number): Promise<Team | undefined> {
    const { data: team, error: teamError } = await this.client
      .from("Teams")
      .select("*")
      .eq("id", id)
      .single();

    if (teamError) {
      if (teamError.code === "PGRST116") return undefined;
      throw new Error(`Failed to fetch team: ${teamError.message}`);
    }

    const { data: stickers, error: stickersError } = await this.client
      .from("Stickers")
      .select("*")
      .eq("idTeam", id)
      .order("id", { ascending: true });

    if (stickersError) {
      throw new Error(`Failed to fetch stickers: ${stickersError.message}`);
    }

    return {
      id: team.id,
      name: team.name,
      stickers: (stickers ?? []).map(this.mapSticker),
    };
  }

  /**
   * Shared helper: groups sticker rows by idTeam.
   * Used by both getAll() and getById().
   */
  private groupStickersByTeam(
    stickers: SupabaseStickerRow[]
  ): Record<number, Sticker[]> {
    const grouped: Record<number, Sticker[]> = {};
    for (const row of stickers) {
      const teamId = row.idTeam;
      if (!grouped[teamId]) {
        grouped[teamId] = [];
      }
      grouped[teamId].push(this.mapSticker(row));
    }
    return grouped;
  }

  private mapSticker(row: SupabaseStickerRow): Sticker {
    return {
      id: row.id,
      number: row.number ?? "",
      name: row.name,
      position: row.position ?? "",
      check: row.check,
      quantity: row.quantity,
    };
  }
}
