/**
 * Configuracion de cache.
 *
** /

/** Segundos que permanece cacheada la lista completa de equipos. */
export const TEAMS_CACHE_TTL_SECONDS = 30;

/** Segundos que permanece cacheado un equipo individual. */
export const TEAM_CACHE_TTL_SECONDS = 30;

/** Clave base de Redis donde se cachea la lista completa de equipos. */
export const TEAMS_CACHE_KEY = "teams";

/** Construye la clave de Redis para equipos por colección. */
export const teamCollectionCacheKey = (
  collectionId: number | undefined,
): string =>
  collectionId !== undefined
    ? `teams:collection:${collectionId}`
    : TEAMS_CACHE_KEY;

/** Construye la clave de Redis de un equipo individual. */
export const teamCacheKey = (id: number): string => `team:${id}:`;
