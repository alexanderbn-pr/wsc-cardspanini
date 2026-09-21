import {z} from 'zod'

export const CreateStickerSchema = z.object({
  body: z.object({
    sticker: z.object({
        number: z.string(),
        name: z.string(),
        positionId: z.number().int().positive(),
        // Valor por defecto
        quantity: z.number().default(0),
        check: z.boolean().default(false),
    }),
    idTeam: z.number()
  }),
})