import { describe, it, expect } from "vitest";
import { mapSticker, type StickerWithPosition } from "./sticker.mapper.js";

const base: StickerWithPosition = {
  id: 1,
  name: "Lamine Yamal",
  number: "001",
  positionId: 3,
  check: false,
  quantity: 0,
  idTeam: 4,
  editionId: 3n,
  position: { id: 3, name: "Delantero" },
};

describe("mapSticker", () => {
  it("converts an int8 editionId BigInt to a plain Number", () => {
    const result = mapSticker(base);

    expect(result.editionId).toBe(3);
    expect(typeof result.editionId).toBe("number");
  });

  it("keeps a null editionId as null, never undefined or 0", () => {
    const result = mapSticker({ ...base, editionId: null });

    expect(result.editionId).toBeNull();
  });

  it("never leaks a BigInt into the mapped domain entity", () => {
    expect(typeof mapSticker(base).editionId).not.toBe("bigint");
  });
});
