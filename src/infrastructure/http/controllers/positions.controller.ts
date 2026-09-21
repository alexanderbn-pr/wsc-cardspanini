import { Request, Response } from 'express';
import { PositionService } from '../../../services/position.service.js';

export class PositionController {
    constructor(
        private readonly positionService: PositionService
    ) {}

    getAll = async(req: Request, res: Response) => {
        const positions = await this.positionService.getAll();
        res.json(positions);
    }
}
