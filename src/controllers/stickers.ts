import { Request, Response } from 'express';
import { DEFAULTS } from "@/config/config.js";
import { TeamsModel } from "@/models/teams.js";
export class StickerController {
    static async getId(req: Request, res: Response) {
       const { id } = req.params;
       const {limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.OFFSET_PAGINATION, position} = req.query;
       const stickers = await TeamsModel.getStickersByTeamId(Number(id) , position as string, Number(limit), Number(offset));
       if (!stickers) {
            return res.status(404).json({ error: "Stickers not found" });
        }
       res.json(stickers);
    }  
}