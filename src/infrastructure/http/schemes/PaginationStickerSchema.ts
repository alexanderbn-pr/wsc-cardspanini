import {z} from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(0),
  limit: z.coerce.number().int().positive().max(100).default(20),
});