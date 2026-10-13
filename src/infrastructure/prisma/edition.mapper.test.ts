import { describe, it, expect } from "vitest";
import { mapEdition, type EditionRow } from "./edition.mapper.js";

const row: EditionRow = {
  id: 3n,
  code: "3ED",
  description: "Tercera edición",
  abbreviation: "3ED",
};

describe("mapEdition", () => {
  it("converts an int8 id BigInt to a plain Number", () => {
    const result = mapEdition(row);

    expect(result.id).toBe(3);
    expect(typeof result.id).toBe("number");
  });

  it("keeps nullable description/abbreviation null", () => {
    const result = mapEdition({
      ...row,
      description: null,
      abbreviation: null,
    });

    expect(result.description).toBeNull();
    expect(result.abbreviation).toBeNull();
  });

  it("never leaks a BigInt into the mapped domain entity", () => {
    expect(typeof mapEdition(row).id).not.toBe("bigint");
  });
});
