import {z} from 'zod'
import '../openapi/zod-extend.js';

export const CreateStickerSchema = z.object({
  body: z.object({
    sticker: z.object({
        number: z.string().openapi({ example: '001' }),
        name: z.string().openapi({ example: 'Lamine Yamal' }),
        positionId: z.number().int().positive().openapi({ example: 1 }),
        // Valor por defecto
        quantity: z.number().default(0).openapi({ example: 0 }),
        check: z.boolean().default(false).openapi({ example: false }),
    }).openapi('CreateStickerBody'),
    idTeam: z.number().openapi({ example: 1 })
  }).openapi('CreateStickerRequest'),
}).openapi('CreateSticker');