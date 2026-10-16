import type { StickerFilters } from "../../modules/stickers.js";

//Funcion para montar la key de la cache de los filtros
export const getStickerFilterCacheKey = (filters: StickerFilters): string => {
  const { collectionId, ...rest } = filters;
  const params = Object.entries(rest)
    .filter(([, value]) => value !== undefined)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join(":");

  return params.length > 0
    ? `stickers:filter:${collectionId}:${params}`
    : `stickers:filter:${collectionId}`;
};
