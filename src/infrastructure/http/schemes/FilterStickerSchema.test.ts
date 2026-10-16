import { describe, it, expect } from "vitest";
import { stickerFiltersSchema } from "./FilterStickerSchema.js";

describe("stickerFiltersSchema — paginación", () => {
  it("acepta page=0 como primera página (regresión: .positive() devolvía 400)", () => {
    const result = stickerFiltersSchema.parse({
      collectionId: "2",
      teamId: "2",
      limit: "2",
      page: "0",
    });
    expect(result).toMatchObject({
      collectionId: 2,
      idTeam: 2,
      limit: 2,
      page: 0,
    });
  });

  it("usa page=0 cuando el parámetro viene ausente", () => {
    // El default 0 también caía en .positive() → cualquier llamada sin
    // page explícito devolvía 400.
    const result = stickerFiltersSchema.parse({
      collectionId: "2",
      teamId: "2",
    });
    expect(result.page).toBe(0);
    expect(result.limit).toBe(20);
  });

  it("acepta page>=1 (convención 0-indexed: page=1 es la segunda página)", () => {
    const result = stickerFiltersSchema.parse({
      collectionId: "2",
      page: "1",
    });
    expect(result.page).toBe(1);
  });

  it("rechaza page negativa", () => {
    expect(
      stickerFiltersSchema.safeParse({ collectionId: "2", page: "-1" }).success,
    ).toBe(false);
  });

  it("rechaza page no entera", () => {
    expect(
      stickerFiltersSchema.safeParse({ collectionId: "2", page: "0.5" })
        .success,
    ).toBe(false);
  });
});

describe("stickerFiltersSchema — collectionId obligatorio", () => {
  it("acepta un collectionId válido y lo propaga como número", () => {
    const result = stickerFiltersSchema.parse({ collectionId: "2" });
    expect(result).toMatchObject({ collectionId: 2 });
  });

  it("rechaza la ausencia de collectionId con 400 fieldErrors.collectionId", () => {
    const result = stickerFiltersSchema.safeParse({ name: "Messi" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors).toHaveProperty("collectionId");
  });

  it.each(["0", "-3", "abc"])(
    "rechaza collectionId=%s con 400 fieldErrors.collectionId",
    (collectionId) => {
      const result = stickerFiltersSchema.safeParse({ collectionId });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.flatten().fieldErrors).toHaveProperty("collectionId");
    },
  );
});
