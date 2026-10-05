import { z } from "zod";

// NO añadas `import "dotenv/config"` en este archivo.
//
// src/app.ts:2 importa loadEnv() desde aquí, así que este módulo está en el
// grafo del artefacto que consume Vercel (dist/app.js). Poner dotenv aquí
// acopla el arranque de producción a la lectura de ficheros y, peor, ata el
// bootstrap de los tests a un módulo de configuración de producción.
//
// El artefacto de Vercel NO necesita leer ficheros: sus variables llegan por
// el dashboard. Dónde SÍ debe estar dotenv:
//   src/index.ts            → servidor local y Docker (lee el .env de verdad)
//   src/tests/e2e/setup.ts  → tests; setupFiles corre antes de cualquier import
//
// Ojo: loadEnv() NO es reentrante (más abajo, `if (!env)`). Si algún día se
// llama desde un sitio que no sea el primero en cargar, el fallo es silencioso.

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function loadEnv(): Env {
  if (!env) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors,
      );
      throw new Error("Invalid environment variables");
    }
    env = parsed.data;
  }
  return env;
}

export function getEnv(): Env {
  if (!env) {
    throw new Error("Environment not loaded. Call loadEnv() first.");
  }
  return env;
}
