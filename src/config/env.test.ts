import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const REQUIRED_ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  JWT_SECRET: "test-jwt-secret-at-least-16-chars",
};

let previousEnv: Record<string, string | undefined>;

beforeEach(() => {
  vi.clearAllMocks();
  previousEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  };
  Object.assign(process.env, REQUIRED_ENV);
});

afterEach(() => {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  vi.restoreAllMocks();
});

// loadEnv() no es reentrante (estado de módulo): resetModules + import
// dinámico para que cada caso arranque con el schema sin cachear.
const loadFreshEnv = async () => {
  vi.resetModules();
  return import("./env.js");
};

describe("env JWT_EXPIRES_IN", () => {
  it("defaults to 12h when unset", async () => {
    delete process.env.JWT_EXPIRES_IN;

    const { loadEnv } = await loadFreshEnv();

    expect(loadEnv().JWT_EXPIRES_IN).toBe("12h");
  });

  it("accepts a custom TTL", async () => {
    process.env.JWT_EXPIRES_IN = "24h";

    const { loadEnv } = await loadFreshEnv();

    expect(loadEnv().JWT_EXPIRES_IN).toBe("24h");
  });

  it.each([["60s"], ["12h"], ["7d"]])(
    "accepts boundary value %s",
    async (ttl) => {
      process.env.JWT_EXPIRES_IN = ttl;

      const { loadEnv } = await loadFreshEnv();

      expect(loadEnv().JWT_EXPIRES_IN).toBe(ttl);
    },
  );

  it.each([["banana"], ["12hours!!"]])(
    "fails fast on malformed value %s naming the field",
    async (ttl) => {
      process.env.JWT_EXPIRES_IN = ttl;
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { loadEnv } = await loadFreshEnv();

      expect(() => loadEnv()).toThrowError("Invalid environment variables");
      expect(errorSpy).toHaveBeenCalled();
      const fieldErrors = errorSpy.mock.calls[0][1] as Record<string, unknown>;
      expect(fieldErrors).toHaveProperty("JWT_EXPIRES_IN");
    },
  );
});
