import { Request, Response } from 'express';
import { DEFAULTS } from "../../../config/config.js";
import { StickerService } from "../../../services/sticker.service.js";
import { stickerFiltersSchema } from "../schemes/FilterStickerSchema.js";

export class StickerController {
    constructor(
        private readonly stickerService: StickerService
    ) {}

    getId = async(req: Request, res: Response) => {
        const { id } = req.params;
        const { limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.OFFSET_PAGINATION, positionId } = req.query;
        const stickers = await this.stickerService.getByTeamId(
            Number(id),
            Number(positionId),
            Number(limit),
            Number(offset)
        );
        res.json(stickers);
    }

    filterStickers = async(req: Request, res: Response) => {
        const parsed = stickerFiltersSchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        }
        const stickers = await this.stickerService.filterStickers(parsed.data);
        res.json(stickers);
    }

    create = async(req: Request, res: Response) => {
        const { sticker, idTeam } = req.body;
        const newSticker = await this.stickerService.create(sticker, idTeam);
        res.status(201).json(newSticker);
    }
}
