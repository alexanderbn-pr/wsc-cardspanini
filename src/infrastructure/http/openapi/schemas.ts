import './zod-extend.js';
import { z } from 'zod';

export const StickerResponseSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  number: z.string().openapi({ example: '001' }),
  name: z.string().openapi({ example: 'Lamine Yamal' }),
  positionId: z.number().openapi({ example: 1 }),
  position: z.string().openapi({ example: 'Delantero' }),
  check: z.boolean().openapi({ example: false }),
  quantity: z.number().openapi({ example: 0 }),
}).openapi('StickerResponse');

export const TeamResponseSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  name: z.string().openapi({ example: 'Barcelona' }),
  stickers: z.array(StickerResponseSchema).openapi({ example: [] }),
}).openapi('TeamResponse');

export const ErrorResponseSchema = z.object({
  errors: z.array(z.string()).openapi({ example: ['Invalid request'] }),
}).openapi('ErrorResponse');

export const PositionResponseSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  name: z.string().openapi({ example: 'Delantero' }),
}).openapi('PositionResponse');