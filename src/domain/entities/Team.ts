import { Sticker } from "./Sticker.js";

export interface Team {
  id: number;
  name: string;
  collectionId: number | null;
  stickers: Sticker[];
}
