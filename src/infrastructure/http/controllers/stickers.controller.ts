import { Request, Response } from 'express';
import { DEFAULTS } from "../../../config/config.js";
import { StickerService } from "../../../services/sticker.service.js";

export class StickerController {
    constructor(
        private readonly stickerService: StickerService
    ) {}

    getId = async(req: Request, res: Response) => {
        const { id } = req.params;
        const { limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.OFFSET_PAGINATION, position } = req.query;
        const stickers = await this.stickerService.getByTeamId(
            Number(id),
            position as string,
            Number(limit),
            Number(offset)
        );
        res.json(stickers);
    }

    create = async(req: Request, res: Response) => {
        const { sticker, idTeam } = req.body;
        const newSticker = await this.stickerService.create(sticker, idTeam);
        res.status(201).json(newSticker);
    }
}
