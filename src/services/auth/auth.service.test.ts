import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  type Mocked,
} from "vitest";
import { AuthService } from "./auth.service.js";
import { SignJWT, jwtVerify } from "jose";

import { AuthRepository } from "../../domain/repositories/auth.repository.js";
import { User } from "../../domain/entities/User.js";
import { loadEnv, getEnv } from "../../config/env.js";
import { ttlToSeconds } from "../../tests/e2e/helpers/auth.js";
import { AppError } from "../../infrastructure/http/middlewares/errorHandler/errorHandler.js";

const JWT_SECRET = "test-jwt-secret-at-least-16-chars";
const OTHER_SECRET = "other-jwt-secret-at-least-16-chars";

const encode = (secret: string) => new TextEncoder().encode(secret);

const signToken = (
  claims: Record<string, unknown>,
  { secret = JWT_SECRET, subject }: { secret?: string; subject?: string } = {},
) => {
  const jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getEnv().JWT_EXPIRES_IN);
  return (subject === undefined ? jwt : jwt.setSubject(subject)).sign(
    encode(secret),
  );
};

describe("AuthService", () => {
  const createMocks = () => ({
    repository: {
      register: vi.fn<AuthRepository["register"]>(),
      findByEmail: vi.fn<AuthRepository["findByEmail"]>(),
      findById: vi.fn<AuthRepository["findById"]>(),
      delete: vi.fn<AuthRepository["delete"]>(),
    } satisfies Mocked<AuthRepository>,
  });
  let repository: ReturnType<typeof createMocks>["repository"];
  let service: AuthService;

  beforeAll(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.JWT_SECRET = JWT_SECRET;
    loadEnv();
  });

  beforeEach(() => {
    const mocks = createMocks();

    repository = mocks.repository;

    service = new AuthService(repository);
  });

  describe("register", () => {
    const created: User = {
      id: 1,
      email: "nuevo@wsc.local",
      passwordHash: "irrelevant",
      role: "Admin",
    };

    it("hashes the password and stores the user with the Admin role", async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.register.mockResolvedValue(created);

      const result = await service.register({
        email: "nuevo@wsc.local",
        password: "s3cret",
      });

      expect(result).toEqual({
        id: created.id,
        email: created.email,
        role: created.role,
      });
      expect(repository.register).toHaveBeenCalledExactlyOnceWith({
        email: "nuevo@wsc.local",
        passwordHash: expect.stringMatching(/^\$argon2/),
        role: "Admin",
      });

      const { passwordHash } = repository.register.mock.calls[0][0];
      expect(passwordHash).not.toBe("s3cret");
    });

    // E5: la redacción se proyecta en el service. Se verifica AUSENCIA real
    // (not.toHaveProperty) y no `toBeUndefined()`, que pasaria con un campo
    // presente cuyo valor fuera undefined.
    it("never exposes passwordHash on the returned user", async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.register.mockResolvedValue(created);

      const result = await service.register({
        email: "nuevo@wsc.local",
        password: "s3cret",
      });

      expect(result).not.toHaveProperty("passwordHash");
      expect(Object.hasOwn(result, "passwordHash")).toBe(false);
    });

    it("produces a hash that verifies against the plaintext password", async () => {
      const { verify } = await import("argon2");
      repository.findByEmail.mockResolvedValue(null);
      repository.register.mockResolvedValue(created);

      await service.register({ email: "nuevo@wsc.local", password: "s3cret" });

      const { passwordHash } = repository.register.mock.calls[0][0];
      await expect(verify(passwordHash, "s3cret")).resolves.toBe(true);
    });

    it("throws a plain Error when the email is already registered", async () => {
      repository.findByEmail.mockResolvedValue(created);

      await expect(
        service.register({
          email: "nuevo@wsc.local",
          password: "s3cret",
        }),
      ).rejects.toThrowError("User already exists");

      const error = await service
        .register({
          email: "nuevo@wsc.local",
          password: "s3cret",
        })
        .catch((err: unknown) => err);

      expect(error).not.toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBeUndefined();
      expect(repository.register).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    const user: User = {
      id: 1,
      email: "nuevo@wsc.local",
      passwordHash: "hash",
      role: "Admin",
    };

    it("deletes the user when it exists", async () => {
      repository.findById.mockResolvedValue(user);

      await expect(service.delete(1)).resolves.toBeUndefined();

      expect(repository.delete).toHaveBeenCalledExactlyOnceWith(1);
    });

    it("throws AppError 404 when the user does not exist", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toMatchObject({
        statusCode: 404,
        message: "User not exist",
      });
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it("propagates a repository deletion failure", async () => {
      repository.findById.mockResolvedValue(user);
      repository.delete.mockRejectedValue(new Error("Foreign key violation"));

      await expect(service.delete(1)).rejects.toThrowError(
        "Foreign key violation",
      );
    });
  });

  describe("login", () => {
    const userWithPassword = async (password: string): Promise<User> => {
      const { hash } = await import("argon2");
      return {
        id: 7,
        email: "portero@wsc.local",
        passwordHash: await hash(password),
        role: "Admin",
      };
    };

    it("returns the user without the password hash and a signed access token", async () => {
      repository.findByEmail.mockResolvedValue(
        await userWithPassword("s3cret"),
      );

      const result = await service.login({
        email: "portero@wsc.local",
        password: "s3cret",
      });

      expect(result.user).toEqual({
        id: 7,
        email: "portero@wsc.local",
        role: "Admin",
      });
      expect(typeof result.accessToken).toBe("string");
      expect(result.accessToken.length).toBeGreaterThan(0);
    });

    it("never exposes passwordHash on the returned user", async () => {
      repository.findByEmail.mockResolvedValue(
        await userWithPassword("s3cret"),
      );

      const result = await service.login({
        email: "portero@wsc.local",
        password: "s3cret",
      });

      expect(result.user).not.toHaveProperty("passwordHash");
    });

    it("round-trips the issued token through verifyAccessToken", async () => {
      repository.findByEmail.mockResolvedValue(
        await userWithPassword("s3cret"),
      );

      const { accessToken } = await service.login({
        email: "portero@wsc.local",
        password: "s3cret",
      });

      await expect(service.verifyAccessToken(accessToken)).resolves.toEqual({
        id: 7,
        role: "Admin",
      });
    });

    it("issues a token whose lifetime matches the configured TTL", async () => {
      repository.findByEmail.mockResolvedValue(
        await userWithPassword("s3cret"),
      );

      const { accessToken } = await service.login({
        email: "portero@wsc.local",
        password: "s3cret",
      });

      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(JWT_SECRET),
        { algorithms: ["HS256"] },
      );
      const configuredTtl = getEnv().JWT_EXPIRES_IN;
      // Guard de default: con JWT_EXPIRES_IN sin definir la sesión es 12h.
      if (!process.env.JWT_EXPIRES_IN) {
        expect(configuredTtl).toBe("12h");
      }
      expect((payload.exp as number) - (payload.iat as number)).toBe(
        ttlToSeconds(configuredTtl),
      );
    });

    it("honours a custom TTL (24h becomes 86400s)", async () => {
      vi.resetModules();
      process.env.JWT_EXPIRES_IN = "24h";
      const { loadEnv: loadFreshEnv } = await import("../../config/env.js");
      loadFreshEnv();
      const { AuthService: FreshAuthService } =
        await import("./auth.service.js");
      const freshRepository = createMocks().repository;
      freshRepository.findByEmail.mockResolvedValue(
        await userWithPassword("s3cret"),
      );
      try {
        const { accessToken } = await new FreshAuthService(
          freshRepository,
        ).login({
          email: "portero@wsc.local",
          password: "s3cret",
        });

        const { payload } = await jwtVerify(
          accessToken,
          new TextEncoder().encode(JWT_SECRET),
          { algorithms: ["HS256"] },
        );
        expect((payload.exp as number) - (payload.iat as number)).toBe(86400);
      } finally {
        delete process.env.JWT_EXPIRES_IN;
      }
    });

    it("throws a plain Error when the email is not registered", async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: "nuevo@wsc.local",
          password: "s3cret",
        }),
      ).rejects.toThrowError("Invalid credentials");
    });

    it("throws a plain Error when the password does not match", async () => {
      repository.findByEmail.mockResolvedValue(
        await userWithPassword("otra-clave-distinta"),
      );

      await expect(
        service.login({
          email: "portero@wsc.local",
          password: "s3cret",
        }),
      ).rejects.toThrowError("Invalid credentials");
    });
  });

  describe("verifyAccessToken", () => {
    it("returns the identity carried by a valid token", async () => {
      const token = await signToken({ role: "Admin" }, { subject: "42" });

      await expect(service.verifyAccessToken(token)).resolves.toEqual({
        id: 42,
        role: "Admin",
      });
    });

    it("throws 401 for a token signed with a different secret", async () => {
      // sub is present so the only reason verification fails is the key.
      const token = await signToken(
        { role: "Admin" },
        { secret: OTHER_SECRET, subject: "42" },
      );

      await expect(service.verifyAccessToken(token)).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid or expired access token",
      });
    });

    it("throws 401 for a structurally invalid token", async () => {
      await expect(
        service.verifyAccessToken("not-a-jwt"),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid or expired access token",
      });
    });

    it("throws 401 when the token carries no sub claim", async () => {
      const token = await signToken({ role: "Admin" });

      await expect(service.verifyAccessToken(token)).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid or expired access token",
      });
    });

    it("throws 401 when sub is not a safe positive integer", async () => {
      const token = await signToken({ role: "Admin" }, { subject: "0" });

      await expect(service.verifyAccessToken(token)).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid or expired access token",
      });
    });

    it("coerces a non-string role claim to an empty string", async () => {
      const token = await signToken({ role: 123 }, { subject: "5" });

      await expect(service.verifyAccessToken(token)).resolves.toEqual({
        id: 5,
        role: "",
      });
    });
  });
});
