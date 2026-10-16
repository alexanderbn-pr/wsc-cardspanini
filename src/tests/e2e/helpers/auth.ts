import { SignJWT } from "jose";
import { getEnv } from "../../../config/env.js";

export const TOKEN_SUBJECT_ID = 1;
export const TOKEN_ROLE = "Admin";
export const TOKEN_TTL = process.env.JWT_EXPIRES_IN ?? "12h";
export const FOREIGN_SECRET = "secreto-externo-que-no-es-el-del-proyecto-e2e";

const TTL_UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};


export function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) {
    throw new Error(
      `Unsupported TTL format: "${ttl}" (expected <number><s|m|h|d>)`,
    );
  }
  return Number(match[1]) * TTL_UNIT_SECONDS[match[2]];
}

export type CreateTokenOptions = {
  secret?: string;
  subjectId?: number;
  role?: string;
};

export async function createToken(options: CreateTokenOptions = {}) {
  const {
    secret = getEnv().JWT_SECRET,
    subjectId = TOKEN_SUBJECT_ID,
    role = TOKEN_ROLE,
  } = options;

  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subjectId.toString())
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(new TextEncoder().encode(secret));
}
