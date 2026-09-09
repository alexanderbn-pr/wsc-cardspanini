import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Sticker } from "../../domain/entities/Sticker.js";
import { StickerRepository } from "../../domain/repositories/sticker.repository.js";
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

/**
 * Supabase-based implementation of StickerRepository.
 * Handles ONLY sticker operations.
 */
export class SupabaseStickerRepository implements StickerRepository {
  private client: SupabaseClient;

  constructor() {
    const env = getEnv();
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  async getByTeamId(teamId: number): Promise<Sticker[]> {
    const { data, error } = await this.client
      .from("Stickers")
      .select("*")
      .eq("idTeam", teamId)
      .order("id", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch stickers: ${error.message}`);
    }

    return (data ?? []).map(this.mapSticker);
  }

  async create(sticker: Sticker, teamId: number): Promise<Sticker> {
    const { data, error } = await this.client
      .from("Stickers")
      .insert({
        name: sticker.name,
        number: sticker.number,
        position: sticker.position,
        check: sticker.check,
        quantity: sticker.quantity,
        idTeam: teamId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sticker: ${error.message}`);
    }

    return this.mapSticker(data);
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
