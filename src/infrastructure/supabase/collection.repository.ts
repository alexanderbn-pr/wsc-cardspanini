import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Collection } from "../../domain/entities/Collection.js";
import { CollectionRepository } from "../../domain/repositories/collection.repository.js";
import { getEnv } from "../../config/env.js";

interface SupabaseCollectionRow {
  id: number;
  name: string;
  completed: boolean;
}

/**
 * Supabase-based implementation of CollectionRepository.
 * Handles ONLY collection read operations.
 */
export class SupabaseCollectionRepository implements CollectionRepository {
  private client: SupabaseClient;

  constructor() {
    const env = getEnv();
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  async getAll(): Promise<Collection[]> {
    const { data, error } = await this.client
      .from("Collections")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: SupabaseCollectionRow) => ({
      id: row.id,
      name: row.name,
      completed: row.completed,
    }));
  }

  async getById(id: number): Promise<Collection | undefined> {
    const { data, error } = await this.client
      .from("Collections")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return undefined;
      throw new Error(`Failed to fetch collection: ${error.message}`);
    }

    if (!data) return undefined;

    return {
      id: data.id,
      name: data.name,
      completed: data.completed,
    };
  }
}
