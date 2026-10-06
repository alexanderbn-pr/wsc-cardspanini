import { expect } from "vitest";
import request from "supertest";
import app from "../../../app.js";

export type AllowedRequest = {
  method: string;
  path: RegExp;
};

export const issuedRequests: Array<{ method: string; path: string }> = [];

export function recordRequest(method: string, path: string): void {
  issuedRequests.push({ method, path });
}

export function resetIssuedRequests(): void {
  issuedRequests.length = 0;
}

export function httpGet(path: string, authorization?: string) {
  recordRequest("GET", path);
  const pending = request(app).get(path);
  if (authorization !== undefined) {
    pending.set("Authorization", authorization);
  }
  return pending;
}

export function httpPost(path: string, body: object, authorization?: string) {
  recordRequest("POST", path);
  const pending = request(app).post(path).send(body);
  if (authorization !== undefined) {
    pending.set("Authorization", authorization);
  }
  return pending;
}

export function httpDelete(path: string, authorization?: string) {
  recordRequest("DELETE", path);
  const pending = request(app).delete(path);
  if (authorization !== undefined) {
    pending.set("Authorization", authorization);
  }
  return pending;
}

export function assertOnlyAllowedRequests(
  allowlist: ReadonlyArray<AllowedRequest>,
): void {
  expect(issuedRequests.length).toBeGreaterThan(0);

  const offending = issuedRequests.filter(
    ({ method, path }) =>
      !allowlist.some(
        (allowed) => allowed.method === method && allowed.path.test(path),
      ),
  );

  expect(offending).toEqual([]);
}
