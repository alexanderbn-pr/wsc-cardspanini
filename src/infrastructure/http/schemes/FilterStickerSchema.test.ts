import { describe, it, expect } from "vitest";
import { stickerFiltersSchema } from "./FilterStickerSchema.js";

describe("stickerFiltersSchema — paginación", () => {
  it("acepta page=0 como primera página (regresión: .positive() devolvía 400)", () => {
    const result = stickerFiltersSchema.parse({
      teamId: "2",
      limit: "2",
      page: "0",
    });
    expect(result).toMatchObject({ idTeam: 2, limit: 2, page: 0 });
  });

  it("usa page=0 cuando el parámetro viene ausente", () => {
    // El default 0 también caía en .positive() → cualquier llamada sin
    // page explícito devolvía 400.
    const result = stickerFiltersSchema.parse({ teamId: "2" });
    expect(result.page).toBe(0);
    expect(result.limit).toBe(20);
  });

  it("acepta page>=1 (convención 0-indexed: page=1 es la segunda página)", () => {
    const result = stickerFiltersSchema.parse({ page: "1" });
    expect(result.page).toBe(1);
  });

  it("rechaza page negativa", () => {
    expect(stickerFiltersSchema.safeParse({ page: "-1" }).success).toBe(false);
  });

  it("rechaza page no entera", () => {
    expect(stickerFiltersSchema.safeParse({ page: "0.5" }).success).toBe(false);
  });
});
