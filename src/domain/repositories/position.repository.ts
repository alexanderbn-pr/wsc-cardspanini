import { Position } from "../entities/Position.js";

export interface PositionRepository {
    getAll(): Promise<Position[]>;
}
