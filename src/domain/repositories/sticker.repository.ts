import { Sticker } from "../entities/Sticker.js";
import { StickerFilters } from "src/modules/stickers.js";
/**
 * Repository interface for Sticker data access.
 * Defines WHAT operations are available for stickers,
 * but NOT HOW they are implemented.
 */
export interface StickerRepository {
  getByTeamId(teamId: number): Promise<Sticker[]>;
  filterStickers(filters: StickerFilters): Promise<Sticker[]>;
  create(sticker: Sticker, teamId: number): Promise<Sticker>;
  /**
   * Lookup por id. Devuelve además `idTeam` porque quien invalida el cache
   * `team:${teamId}:stickers` necesita el equipo del sticker, y la entidad
   * `Sticker` no lo expone (decisión E1/E2: read-then-write).
   */
  findById(id: number): Promise<(Sticker & { idTeam: number }) | null>;
  /**
   * Escritura absoluta (no incremental): el caller calcula quantity y check.
   * `null` si el id no existe.
   */
  update(
    id: number,
    data: { quantity: number; check: boolean },
  ): Promise<Sticker | null>;
}
