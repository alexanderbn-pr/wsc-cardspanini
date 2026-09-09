import { Sticker } from "../entities/Sticker.js";

/**
 * Repository interface for Sticker data access.
 * Defines WHAT operations are available for stickers,
 * but NOT HOW they are implemented.
 */
export interface StickerRepository {
  getByTeamId(teamId: number): Promise<Sticker[]>;
  create(sticker: Sticker, teamId: number): Promise<Sticker>;
}
