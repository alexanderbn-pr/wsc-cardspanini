import { Request, Response } from 'express';
import {TeamsModel} from "../models/teams.js";

export class TeamController {
    // Las funciones son staticas para no tener que hacer un new cada vez que se llame a la funcion del controller
    // Son async por patron para un futuro
    static async getAll(req: Request, res: Response) {
        res.json(await TeamsModel.getAll());
    }
    static async getId(req: Request, res: Response) {
        const { id } = req.params;
        const team = await TeamsModel.getById(Number(id));
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }
        res.json(team);
    }
}