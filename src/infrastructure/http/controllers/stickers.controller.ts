import { Request, Response } from 'express';
import { DEFAULTS } from "../../../config/config.js";
import { TeamService } from "../../../services/team.service.js";
export class StickerController {
    constructor(
        private readonly teamService: TeamService
    ) {}
    getId = async(req: Request, res: Response) => {
       const { id } = req.params;
       const {limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.OFFSET_PAGINATION, position} = req.query;
       const stickers = await this.teamService.getStickersByTeamId(Number(id) , position as string, Number(limit), Number(offset));
       if (!stickers) {
            return res.status(404).json({ error: "Stickers not found" });
        }
       res.json(stickers);
    }
    create = async(req: Request, res: Response) =>{
        const { sticker, idTeam} = req.body;
        await this.teamService.createSticker(sticker, idTeam)
    }  
}