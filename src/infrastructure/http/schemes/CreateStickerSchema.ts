import {z} from 'zod'

export const CreateStickerSchema = z.object({
  body: z.object({
    sticker: z.object({
        number: z.string(),
        name: z.string(),
        position: z.string(),
        // Valor por defecto
        quantity: z.number().default(0),
        check: z.boolean().default(false),
    }),
    idTeam: z.number()
  }),
})