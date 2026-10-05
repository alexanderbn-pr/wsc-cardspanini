import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaTeamRepository } from "./team.repository.js";
import { prisma } from "../../../config/prisma.js";
import { WITH_POSITION } from "../sticker.mapper.js";

//Hacemos el mock de las funciones de prisma que se utilizan en el repositorio
vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    team: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("PrismaTeamRepository", () => {
  let repository: PrismaTeamRepository;
  const prismaTeams = [
    {
      id: 1,
      name: "Valencia CF",
      stickers: [],
    },
    {
      id: 2,
      name: "Real Madrid",
      stickers: [],
    },
  ];
  beforeEach(() => {
    //Limpiamos los mocks antes de cada test para evitar interferencias entre tests
    vi.clearAllMocks();
    //Inizializamos el repositorio antes de cada test
    repository = new PrismaTeamRepository();
  });

  describe("getAll", () => {
    it("should return all teams", async () => {
      //Mockeamos la función findMany de prisma para que devuelva un array de equipos
      vi.mocked(prisma.team.findMany).mockResolvedValue(prismaTeams);
      //Llamamos al método getAll del repositorio
      const result = await repository.getAll();
      expect(result).toEqual([
        {
          id: 1,
          name: "Valencia CF",
          stickers: [],
        },
        {
          id: 2,
          name: "Real Madrid",
          stickers: [],
        },
      ]);

      expect(prisma.team.findMany).toHaveBeenCalledWith({
        orderBy: { id: "asc" },
        include: {
          stickers: {
            ...WITH_POSITION,
            orderBy: { id: "asc" },
          },
        },
      });
    });
    it("should throw when all Prisma attempts fail", async () => {
      const error = new Error("Database unavailable");
      vi.mocked(prisma.team.findMany).mockRejectedValue(error);
      //Mockeamos el error continuo
      await expect(repository.getAll()).rejects.toThrow("Database unavailable");
      //Comprobamos que se haya llamado a la función findMany de prisma 4 veces (1 intento inicial + 3 reintentos que es lo que hemos configurado en DB_RETRY_CONFIG)
      expect(prisma.team.findMany).toHaveBeenCalledTimes(4);
    });
  });

  describe("getById", () => {
    it("should return a team", async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue(prismaTeams[0]);
      const result = await repository.getById(1);
      expect(result).toEqual({
        id: 1,
        name: "Valencia CF",
        stickers: [],
      });

      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          stickers: {
            ...WITH_POSITION,
            orderBy: { id: "asc" },
          },
        },
      });
    });

    it("should return undefined when team does not exist", async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue(null);
      const result = await repository.getById(999);
      expect(result).toBeUndefined();

      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          stickers: {
            ...WITH_POSITION,
            orderBy: { id: "asc" },
          },
        },
      });
    });

    it("should retry getById when Prisma fails", async () => {
      const error = new Error("Database unavailable");
      //Añadimos un doble mock para simular un fallo en la primera llamada y un éxito en la segunda llamada
      vi.mocked(prisma.team.findUnique)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(prismaTeams[0]);

      const result = await repository.getById(1);
      expect(result).toEqual({
        id: 1,
        name: "Valencia CF",
        stickers: [],
      });
      expect(prisma.team.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
