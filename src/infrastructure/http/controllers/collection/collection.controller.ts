import { Request, Response } from "express";
import { CollectionService } from "../../../../services/collection/collection.service.js";

export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  getAll = async (req: Request, res: Response) => {
    const collections = await this.collectionService.getAll();
    res.json(collections);
  };

  getId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const collection = await this.collectionService.getById(Number(id));
    res.json(collection);
  };
}
