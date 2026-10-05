import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { TeamController } from "./teams.controller.js";
import type { TeamService } from "../../../../services/team/team.service.js";
import { AppError } from "../../middlewares/errorHandler/errorHandler.js";

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
    it("should return all teams", async () => {
      teamService.getAll.mockResolvedValue(teams);
      const req = {} as Request;
      await controller.getAll(req, res);
      expect(teamService.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(teams);
    });
    it("should return an empty array if no teams exist", async () => {
      teamService.getAll.mockResolvedValue([]);
      const req = {} as Request;
      await controller.getAll(req, res);
      expect(teamService.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getId", () => {
    const team = {
      id: 1,
      name: "Valencia CF",
    };
    it("should return a team by id", async () => {
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
    it("should propagate a 404 AppError when the team is not found", async () => {
      const error = new AppError(404, "Team with id 999 not found");
      teamService.getById.mockRejectedValue(error);
      const req = {
        params: {
          id: "999",
        },
      } as unknown as Request;

      await expect(controller.getId(req, res)).rejects.toMatchObject({
        statusCode: 404,
        message: "Team with id 999 not found",
      });
      expect(teamService.getById).toHaveBeenCalledWith(999);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
