import {z} from 'zod'
import '../openapi/zod-extend.js';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(0).openapi({ example: 0 }),
  limit: z.coerce.number().int().positive().max(100).default(20).openapi({ example: 20 }),
}).openapi('Pagination');