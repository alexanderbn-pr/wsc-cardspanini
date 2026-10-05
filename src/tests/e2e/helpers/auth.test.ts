
import { describe, expect, it } from "vitest";
import { jwtVerify } from "jose";

import { getEnv, loadEnv } from "../../../config/env.js";
import { AuthService } from "../../../services/auth/auth.service.js";
import type { AuthRepository } from "../../../domain/repositories/auth.repository.js";
import {
  createToken,
  FOREIGN_SECRET,
  TOKEN_ROLE,
  TOKEN_SUBJECT_ID,
  TOKEN_TTL,
} from "./auth.js";

loadEnv();

function verifier(): AuthService {
  return new AuthService({} as AuthRepository);
}

describe("createToken signing contract", () => {
  it("reproduces the AuthService.login signing contract by default", async () => {
    const { payload, protectedHeader } = await jwtVerify(
      await createToken(),
      new TextEncoder().encode(getEnv().JWT_SECRET),
      { algorithms: ["HS256"] },
    );

    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe(String(TOKEN_SUBJECT_ID));
    expect(payload.role).toBe(TOKEN_ROLE);
    expect((payload.exp as number) - (payload.iat as number)).toBe(
      Number.parseInt(TOKEN_TTL, 10) * 3600,
    );
  });

  it("is accepted by the real AuthService.verifyAccessToken", async () => {
    await expect(
      verifier().verifyAccessToken(await createToken()),
    ).resolves.toEqual({ id: TOKEN_SUBJECT_ID, role: TOKEN_ROLE });
  });
});

describe("createToken options", () => {
  it("encodes an explicit subjectId and role into the payload", async () => {
    const { payload } = await jwtVerify(
      await createToken({ subjectId: 7, role: "User" }),
      new TextEncoder().encode(getEnv().JWT_SECRET),
      { algorithms: ["HS256"] },
    );

    expect(payload.sub).toBe("7");
    expect(payload.role).toBe("User");

    await expect(
      verifier().verifyAccessToken(
        await createToken({ subjectId: 7, role: "User" }),
      ),
    ).resolves.toEqual({ id: 7, role: "User" });
  });

  it("omitting every option reproduces the pre-extraction behaviour", async () => {
    const implicit = await createToken();
    const explicit = await createToken({
      secret: getEnv().JWT_SECRET,
      subjectId: TOKEN_SUBJECT_ID,
      role: TOKEN_ROLE,
    });

    const claims = async (token: string) => {
      const { payload, protectedHeader } = await jwtVerify(
        token,
        new TextEncoder().encode(getEnv().JWT_SECRET),
        { algorithms: ["HS256"] },
      );
      return { ...payload, alg: protectedHeader.alg };
    };

    expect(await claims(implicit)).toEqual(await claims(explicit));
  });

  it("a token signed with a foreign secret is rejected by the real verifier", async () => {
    const forged = await createToken({ secret: FOREIGN_SECRET });
    await expect(
      jwtVerify(forged, new TextEncoder().encode(getEnv().JWT_SECRET), {
        algorithms: ["HS256"],
      }),
    ).rejects.toThrow();
    await expect(verifier().verifyAccessToken(forged)).rejects.toThrow();
  });
});

describe("createToken subjectId safety contract", () => {
  it.each([
    ["a non-integer", 1.5],
    ["zero", 0],
    ["a negative id", -1],
    ["an unsafe integer", Number.MAX_SAFE_INTEGER + 2],
  ])("rejects %s as a subjectId", async (_label, subjectId) => {
    await expect(
      verifier().verifyAccessToken(await createToken({ subjectId })),
    ).rejects.toThrow();
  });
});
