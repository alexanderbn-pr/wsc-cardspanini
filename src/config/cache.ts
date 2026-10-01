/**
 * Configuracion de cache.
 *
** /

/** Segundos que permanece cacheada la lista completa de equipos. */
export const TEAMS_CACHE_TTL_SECONDS = 30;

/** Segundos que permanece cacheado un equipo individual. */
export const TEAM_CACHE_TTL_SECONDS = 30;

/** Clave de Redis donde se cachea la lista completa de equipos. */
export const TEAMS_CACHE_KEY = "teams";

/** Construye la clave de Redis de un equipo individual. */
export const teamCacheKey = (id: number): string => `team:${id}:`;
