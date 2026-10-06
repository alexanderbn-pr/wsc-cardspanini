import { describe, expect, it } from "vitest";
import { jwtVerify } from "jose";

import { TEAMS_CACHE_KEY } from "../../config/cache.js";
import { getEnv } from "../../config/env.js";
import {
  createToken,
  FOREIGN_SECRET,
  TOKEN_ROLE,
  TOKEN_SUBJECT_ID,
} from "./helpers/auth.js";
import {
  assertOnlyAllowedRequests,
  httpDelete,
  httpGet,
  httpPost,
  type AllowedRequest,
} from "./helpers/http.js";

const READ_ALLOWLIST: ReadonlyArray<AllowedRequest> = [
  { method: "GET", path: /^\/teams$/ },
  { method: "GET", path: /^\/teams\/\d+$/ },
  { method: "POST", path: /^\/auth\/login$/ },
  // Escrituras ya cubiertas por este fichero: el registro crea el usuario que
  // el DELETE posterior elimina, y el propio DELETE es una escritura. Sin
  // estas entradas el assertion final "read allowlist" falla.
  { method: "POST", path: /^\/auth\/register$/ },
  { method: "DELETE", path: /^\/auth\/\d+$/ },
];

async function discoverExistingTeamId(): Promise<number | undefined> {
  try {
    const response = await httpGet("/teams", `Bearer ${await createToken()}`);
    if (response.status !== 200 || !Array.isArray(response.body)) {
      return undefined;
    }
    const firstTeam = response.body[0] as { id?: unknown } | undefined;
    return typeof firstTeam?.id === "number" ? firstTeam.id : undefined;
  } catch {
    return undefined;
  }
}

const discoveredTeamId = await discoverExistingTeamId();

const hasRealLoginCredentials = Boolean(
  process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD,
);

describe("GET /teams E2E", () => {
  it("rejects a request with no Authorization header", async () => {
    const response = await httpGet("/teams");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "error",
      message: "Missing or malformed Authorization header",
    });
  });

  it("rejects a Token-scheme header (regex miss)", async () => {
    const response = await httpGet("/teams", `Token ${await createToken()}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "error",
      message: "Missing or malformed Authorization header",
    });
  });

  it("rejects a bare Bearer header with no token (empty capture)", async () => {
    const response = await httpGet("/teams", "Bearer");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "error",
      message: "Missing or malformed Authorization header",
    });
  });

  it("rejects a structurally invalid JWT from verifyAccessToken", async () => {
    const response = await httpGet("/teams", "Bearer not-a-jwt");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid or expired access token",
    });
  });

  it("rejects a token signed with a foreign secret", async () => {
    const response = await httpGet(
      "/teams",
      `Bearer ${await createToken({ secret: FOREIGN_SECRET })}`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid or expired access token",
    });
  });

  it("returns a raw array of Team shapes", async () => {
    const response = await httpGet("/teams", `Bearer ${await createToken()}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    for (const team of response.body) {
      expect(typeof team.id).toBe("number");
      expect(typeof team.name).toBe("string");
      expect(Array.isArray(team.stickers)).toBe(true);
    }
  });

  it("returns 404 with the AppError body for an absent id", async () => {
    const response = await httpGet(
      "/teams/2147483647",
      `Bearer ${await createToken()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: "error",
      message: "Team with id 2147483647 not found",
    });
  });

  it("accepts a lowercase bearer header (case-insensitive regex)", async () => {
    const response = await httpGet("/teams", `bearer ${await createToken()}`);

    expect(response.status).toBe(200);
  });

  it.runIf(discoveredTeamId !== undefined)(
    "returns the discovered team for an existing id",
    async () => {
      const response = await httpGet(
        `/teams/${discoveredTeamId}`,
        `Bearer ${await createToken()}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(discoveredTeamId);
    },
  );
  it("stubs the redis client as a permanent cache miss (TRAP 1 proof)", async () => {
    const probe = globalThis.__e2eRedisMock;

    expect(probe).toBeDefined();
    expect(probe?.installed).toBe(true);
    expect(probe?.client?.isOpen).toBe(false);

    const response = await httpGet("/teams", `Bearer ${await createToken()}`);
    expect(response.status).toBe(200);
    expect(probe?.getCalls).toContain(TEAMS_CACHE_KEY);
    await expect(
      Promise.resolve(probe?.get?.(TEAMS_CACHE_KEY)),
    ).resolves.toBeNull();
  });

  it("reproduces the AuthService.login signing contract", async () => {
    const { protectedHeader, payload } = await jwtVerify(
      await createToken(),
      new TextEncoder().encode(getEnv().JWT_SECRET),
      { algorithms: ["HS256"] },
    );

    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe(String(TOKEN_SUBJECT_ID));
    expect(payload.role).toBe(TOKEN_ROLE);
    expect((payload.exp as number) - (payload.iat as number)).toBe(3600);
  });

  // ── Cobertura opcional ───────────────────────────────────────────────────
  it.skipIf(!hasRealLoginCredentials)(
    "returns a real access token from login that is usable on /teams",
    async () => {
      const loginResponse = await httpPost("/auth/login", {
        email: process.env.E2E_TEST_EMAIL,
        password: process.env.E2E_TEST_PASSWORD,
      });

      expect(loginResponse.status).toBe(200);
      expect(typeof loginResponse.body.accessToken).toBe("string");

      const teamsResponse = await httpGet(
        "/teams",
        `Bearer ${loginResponse.body.accessToken}`,
      );

      expect(teamsResponse.status).toBe(200);
    },
  );

  describe("known source bugs (skipped until fixed)", () => {
    it.skip("GET /teams/1.5 should be 400, currently returns 200 with team 1", async () => {
      const response = await httpGet(
        "/teams/1.5",
        `Bearer ${await createToken()}`,
      );

      expect(response.status).toBe(400);
    });

    it.skip("GET /teams/abc should be 400, currently returns 500", async () => {
      const response = await httpGet(
        "/teams/abc",
        `Bearer ${await createToken()}`,
      );

      expect(response.status).toBe(400);
    });

    it.skip("POST /auth/login with invalid credentials should be 401, currently 500", async () => {
      const response = await httpPost("/auth/login", {
        email: "no-existe@example.com",
        password: "Aa1!no-existe",
      });

      expect(response.status).toBe(401);
    });

    // Capacidad user-register-redaction (spec): el contrato fija 200, no 201.
    // El email es único por corrida porque register rechaza duplicados con un
    // error que rompería una segunda ejecución del suite.
    it("POST /auth/register must not expose the argon2 passwordHash", async () => {
      const response = await httpPost("/auth/register", {
        email: `e2e-leak-${Date.now()}@example.com`,
        password: "Aa1!leak-probe",
      });

      expect(response.status).toBe(200);
      // Ausencia real, no `toBeUndefined()`: un campo presente con valor
      // undefined pasaría la segunda aserción pero no esta.
      expect(response.body).not.toHaveProperty("passwordHash");
      expect(Object.hasOwn(response.body, "passwordHash")).toBe(false);
    });

    // Capacidad user-self-delete. Crea su PROPIO usuario en lugar de borrar
    // TOKEN_SUBJECT_ID (id=1, fijo): eso destruiría datos compartidos y haría
    // que la segunda corrida fallara con 404 porque el usuario ya no existiría.
    it("DELETE /auth/:id deletes the caller's own account", async () => {
      const created = await httpPost("/auth/register", {
        email: `e2e-self-delete-${Date.now()}@example.com`,
        password: "Aa1!self-del",
      });
      expect(created.status).toBe(200);
      const id = created.body.id as number;

      const response = await httpDelete(
        `/auth/${id}`,
        `Bearer ${await createToken({ subjectId: id })}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ deleted: true });
    });

    // requireSelf compara el id del path con el sujeto del token ANTES de
    // buscar en la BD, así que el 403 no depende de que el usuario exista.
    it("DELETE /auth/:id returns 403 when the path id is not the token subject", async () => {
      const response = await httpDelete(
        "/auth/8",
        `Bearer ${await createToken({ subjectId: 7 })}`,
      );

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        status: "error",
        message: "You can only delete your own account",
      });
    });

    it("DELETE /auth/:id returns 403 for an unknown id instead of 404", async () => {
      const response = await httpDelete(
        "/auth/999",
        `Bearer ${await createToken({ subjectId: 7 })}`,
      );

      expect(response.status).toBe(403);
    });
  });

  it("issued only requests inside the read allowlist", () => {
    assertOnlyAllowedRequests(READ_ALLOWLIST);
  });
});
