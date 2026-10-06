import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Sticker } from "../../domain/entities/Sticker.js";
import { StickerFilters } from "../../modules/stickers.js";
import { StickerRepository } from "../../domain/repositories/sticker.repository.js";
import { getEnv } from "../../config/env.js";

interface SupabaseStickerRow {
  id: number;
  name: string;
  number: string | null;
  positionId: number | null;
  check: boolean;
  quantity: number;
  idTeam: number;
  Position?: { name: string } | null;
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
      .select("*, Position(name)")
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
        positionId: sticker.positionId,
        check: sticker.check,
        quantity: sticker.quantity,
        idTeam: teamId,
      })
      .select("*, Position(name)")
      .single();

    if (error) {
      throw new Error(`Failed to create sticker: ${error.message}`);
    }

    return this.mapSticker(data);
  }

  async filterStickers(filters: StickerFilters): Promise<Sticker[]> {
    let query = this.client.from("Stickers").select("*, Position(name)");

    if (filters.id !== undefined) query = query.eq("id", filters.id);
    if (filters.idTeam !== undefined)
      query = query.eq("idTeam", filters.idTeam);
    if (filters.number !== undefined)
      query = query.eq("number", filters.number);
    if (filters.name !== undefined) query = query.eq("name", filters.name);
    if (filters.positionId !== undefined)
      query = query.eq("positionId", filters.positionId);
    if (filters.check !== undefined) query = query.eq("check", filters.check);
    if (filters.quantity !== undefined)
      query = query.eq("quantity", filters.quantity);

    query = query.order("id", { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to filter stickers: ${error.message}`);
    }

    return (data ?? []).map(this.mapSticker);
  }

  async findById(id: number): Promise<(Sticker & { idTeam: number }) | null> {
    const { data, error } = await this.client
      .from("Stickers")
      .select("*, Position(name)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch sticker: ${error.message}`);
    }
    if (!data) return null;

    // El mapper de dominio descarta idTeam; aquí se reañade porque el caller
    // necesita invalidar la cache del equipo (mismo motivo que en el adapter Prisma).
    return { ...this.mapSticker(data), idTeam: data.idTeam };
  }

  async update(
    id: number,
    data: { quantity: number; check: boolean },
  ): Promise<Sticker | null> {
    const { data: updated, error } = await this.client
      .from("Stickers")
      .update({ quantity: data.quantity, check: data.check })
      .eq("id", id)
      .select("*, Position(name)")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update sticker: ${error.message}`);
    }
    if (!updated) return null;

    return this.mapSticker(updated);
  }

  private mapSticker(row: SupabaseStickerRow): Sticker {
    return {
      id: row.id,
      number: row.number ?? "",
      name: row.name,
      positionId: row.positionId ?? 0,
      position: row.Position?.name ?? "",
      check: row.check,
      quantity: row.quantity,
    };
  }
}
