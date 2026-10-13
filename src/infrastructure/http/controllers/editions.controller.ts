import { Request, Response } from "express";
import { EditionService } from "../../../services/edition/edition.service.js";

export class EditionController {
  constructor(private readonly editionService: EditionService) {}

  getAll = async (req: Request, res: Response) => {
    const editions = await this.editionService.getAll();
    res.json(editions);
  };
}
