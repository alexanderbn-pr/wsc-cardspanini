import {z} from 'zod'

export const CreateStickerSchema = z.object({
  body: z.object({
    sticker: z.object({
        number: z.string(),
        name: z.string(),
        position: z.string(),
    }),
    idTeam: z.number()
  }),
})