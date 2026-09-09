
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

export class SupabaseTeamRepository implements TeamRepository {
  private client: SupabaseClient;

  constructor() {
    const env = getEnv();
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  async getAll(): Promise<Team[]> {
    // 1. Fetch all teams
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

    // 2. Fetch all stickers in one query
    const { data: stickers, error: stickersError } = await this.client
      .from("Stickers")
      .select("*")
      .order("id", { ascending: true });

    if (stickersError) {
      throw new Error(`Failed to fetch stickers: ${stickersError.message}`);
    }

    // 3. Group stickers by idTeam and map to domain entities
    const stickersByTeam = this.groupStickersByTeam(stickers ?? []);

    return teams.map((team: SupabaseTeamRow) => ({
      id: team.id,
      name: team.name,
      stickers: stickersByTeam[team.id] ?? [],
    }));
  }

  async getById(id: number): Promise<Team | undefined> {
    // Fetch single team
    const { data: team, error: teamError } = await this.client
      .from("Teams")
      .select("*")
      .eq("id", id)
      .single();

    if (teamError) {
      if (teamError.code === "PGRST116") return undefined; // Not found
      throw new Error(`Failed to fetch team: ${teamError.message}`);
    }

    // Fetch stickers for this team
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

  async create(sticker: Sticker, id: number): Promise<Team | undefined> {
    // Insert the sticker with the team reference
    const { error } = await this.client.from("Stickers").insert({
      name: sticker.name,
      number: sticker.number,
      position: sticker.position,
      check: sticker.check,
      quantity: sticker.quantity,
      idTeam: id,
    });

    if (error) {
      throw new Error(`Failed to create sticker: ${error.message}`);
    }

    // Return the updated team
    return this.getById(id);
  }

  /**
   * Groups sticker rows by idTeam and maps each to a domain Sticker.
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
