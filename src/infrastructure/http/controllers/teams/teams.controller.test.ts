import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { TeamController } from "./teams.controller.js";
import type { TeamService } from "../../../../services/team/team.service.js";

describe("TeamController", () => {
  let teamService: {
    getAll: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };

  let controller: TeamController;
  let res: Response;

  beforeEach(() => {
    teamService = {
      getAll: vi.fn(),
      getById: vi.fn(),
    };

    controller = new TeamController(teamService as unknown as TeamService);
    res = {
      json: vi.fn(),
    } as unknown as Response;
  });

  describe("getAll", () => {
    it("should return all teams", async () => {
      const teams = [
        {
          id: 1,
          name: "Valencia CF",
        },
        {
          id: 2,
          name: "Valencia Mestalla",
        },
      ];

      teamService.getAll.mockResolvedValue(teams);
      const req = {} as Request;
      await controller.getAll(req, res);
      expect(teamService.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(teams);
    });
  });

  describe("getId", () => {
    it("should return a team by id", async () => {
      const team = {
        id: 1,
        name: "Valencia CF",
      };
      teamService.getById.mockResolvedValue(team);
      const req = {
        params: {
          id: "1",
        },
      } as unknown as Request;
      await controller.getId(req, res);
      expect(teamService.getById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(team);
    });
  });
});
