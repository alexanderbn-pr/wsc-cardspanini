import type { StickerFilters } from "../../modules/stickers.js";


//Funcion para montar la key de la cache de los filtros
export const getStickerFilterCacheKey = (
    filters: StickerFilters
): string => {

    const params = Object.entries(filters)
        .filter(([, value]) => value !== undefined)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join(":");

    return `stickers:filter:${params}`;
};