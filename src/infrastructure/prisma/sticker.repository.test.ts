import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaStickerRepository } from "./sticker.repository.js";
import { prisma } from "../../config/prisma.js";

// Seguimos el patron de team.repository.test.ts: mock del cliente Prisma en
// el borde del modulo, sin BD real.
vi.mock("../../config/prisma.js", () => ({
  prisma: {
    sticker: {
      findMany: vi.fn(),
    },
  },
}));

describe("PrismaStickerRepository — filterStickers scope por colección", () => {
  let repository: PrismaStickerRepository;

  // Fila Prisma con posicion incluida (lo que pide WITH_POSITION).
  const row = (id: number, idTeam: number) => ({
    id,
    name: "Messi",
    number: "8BIS",
    positionId: 1,
    position: { id: 1, name: "Delantero" },
    check: false,
    quantity: 1,
    idTeam,
    editionId: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaStickerRepository();
  });

  it("no cruza colecciones: mismo number en 2 colecciones devuelve solo la pedida", async () => {
    // La BD solo devuelve la fila de la coleccion 2; el repositorio debe
    // haber pedido where.team = { collectionId: 2 } AND number.
    vi.mocked(prisma.sticker.findMany).mockResolvedValue([row(2, 5)]);

    const result = await repository.filterStickers({
      collectionId: 2,
      number: "8BIS",
      page: 0,
      limit: 20,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 2, number: "8BIS" });
    expect(prisma.sticker.findMany).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: { team: { collectionId: 2 }, number: "8BIS" },
        skip: 0,
        take: 20,
      }),
    );
  });

  it("combina collectionId con idTeam por AND", async () => {
    vi.mocked(prisma.sticker.findMany).mockResolvedValue([]);

    await repository.filterStickers({
      collectionId: 2,
      idTeam: 5,
      page: 1,
      limit: 10,
    });

    expect(prisma.sticker.findMany).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: { team: { collectionId: 2 }, idTeam: 5 },
        skip: 10,
        take: 10,
      }),
    );
  });

  it("excluye equipos con collectionId null (match exacto de relacion)", async () => {
    vi.mocked(prisma.sticker.findMany).mockResolvedValue([]);

    await repository.filterStickers({
      collectionId: 2,
      page: 0,
      limit: 20,
    });

    const where = { team: { collectionId: 2 } };
    expect(prisma.sticker.findMany).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ where }),
    );
    // Match exacto (sin OR ni null-tolerancia): los equipos con
    // collectionId = null nunca igualan { collectionId: 2 }.
  });
});
