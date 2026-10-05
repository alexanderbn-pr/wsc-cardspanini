import { SignJWT } from "jose";
import { getEnv } from "../../../config/env.js";

export const TOKEN_SUBJECT_ID = 1;
export const TOKEN_ROLE = "Admin";
export const TOKEN_TTL = "1h";
export const FOREIGN_SECRET = "secreto-externo-que-no-es-el-del-proyecto-e2e";

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
