import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../src/app.js";

const JS_MIME = /(text|application)\/javascript/;
const HTML_BODY_MARKERS = [
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "swagger-ui.css",
];

function bodyText(response: request.Response): string {
  if (typeof response.text === "string" && response.text.length > 0) {
    return response.text;
  }
  const body: unknown = response.body;
  if (Buffer.isBuffer(body)) {
    return body.toString("utf8");
  }
  if (typeof body === "string") {
    return body;
  }
  return "";
}

describe("Swagger UI static assets", () => {
  it("serves the JS bundle with a JavaScript MIME type and a non-HTML body", async () => {
    const response = await request(app).get("/api/docs/swagger-ui-bundle.js");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(JS_MIME);

    const body = bodyText(response);
    expect(body.length).toBeGreaterThan(0);
    expect(body.startsWith("<")).toBe(false);
    expect(body).not.toContain("<!DOCTYPE html>");
  });

  it("serves the standalone preset with a JavaScript MIME type", async () => {
    const response = await request(app).get(
      "/api/docs/swagger-ui-standalone-preset.js",
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(JS_MIME);
  });

  it("serves the stylesheet with text/css", async () => {
    const response = await request(app).get("/api/docs/swagger-ui.css");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/css");
  });

  it("serves the favicon with image/png", async () => {
    const response = await request(app).get("/api/docs/favicon-32x32.png");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
  });
});

describe("Swagger UI HTML page", () => {
  it("falls through to the Swagger UI HTML page for unknown assets (not 5xx)", async () => {
    const response = await request(app).get(
      "/api/docs/asset-that-does-not-exist.js",
    );

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
    expect(response.headers["content-type"]).toContain("text/html");
  });

  it("serves the HTML page at /api/docs/ referencing the bundled assets", async () => {
    const response = await request(app).get("/api/docs/");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");

    const body = bodyText(response);
    for (const marker of HTML_BODY_MARKERS) {
      expect(body).toContain(marker);
    }
    // The root must be swaggerUi.setup()'s page (this API's document),
    // NOT swagger-ui-dist's default index.html (petstore initializer).
    expect(body).toContain("swagger-ui-init.js");
    expect(body).not.toContain("swagger-initializer.js");
  });
});

describe("OpenAPI document endpoint", () => {
  it("serves the OpenAPI document as JSON", async () => {
    const response = await request(app).get("/api/openapi.json");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toHaveProperty("openapi");
    expect(response.body).toHaveProperty("paths");
  });
});

describe("No regression to existing routes", () => {
  it("keeps GET /api/health unchanged", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
  });

  it("keeps GET /teams without auth unchanged (401 JSON)", async () => {
    const response = await request(app).get("/teams");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "error",
      message: "Missing or malformed Authorization header",
    });
  });
});
