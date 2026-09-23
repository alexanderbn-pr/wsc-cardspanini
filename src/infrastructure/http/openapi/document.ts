import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateStickerSchema } from '../schemes/CreateStickerSchema.js';
import { stickerFiltersSchema } from '../schemes/FilterStickerSchema.js';
import { TeamResponseSchema, StickerResponseSchema, ErrorResponseSchema, PositionResponseSchema } from './schemas.js';

const registry = new OpenAPIRegistry();

// Register path parameters
const TeamIdParam = registry.registerParameter(
  'TeamId',
  z.number().openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  })
);

const StickerIdParam = registry.registerParameter(
  'StickerId',
  z.number().openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  })
);

// Register paths
registry.registerPath({
  method: 'get',
  path: '/teams',
  summary: 'Get all teams',
  description: 'Returns all teams',
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: TeamResponseSchema.array(),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/teams/{id}',
  summary: 'Get team by ID',
  description: 'Returns a team by its ID',
  request: {
    params: z.object({ id: TeamIdParam }),
  },
  responses: {
    200: {
      description: 'Team found',
      content: {
        'application/json': {
          schema: TeamResponseSchema,
        },
      },
    },
    404: {
      description: 'Team not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/stickers',
  summary: 'Filter stickers',
  description: 'Filter stickers with pagination',
  request: {
    query: stickerFiltersSchema,
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: StickerResponseSchema.array(),
        },
      },
    },
    400: {
      description: 'Invalid query parameters',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/stickers/{id}',
  summary: 'Get stickers by team ID',
  description: 'Returns stickers for a specific team',
  request: {
    params: z.object({ id: StickerIdParam }),
  },
  responses: {
    200: {
      description: 'Stickers found',
      content: {
        'application/json': {
          schema: StickerResponseSchema.array(),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/stickers/create',
  summary: 'Create a sticker',
  description: 'Create a new sticker',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateStickerSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Sticker created',
      content: {
        'application/json': {
          schema: StickerResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/positions',
  summary: 'Get all positions',
  description: 'Returns all positions',
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: PositionResponseSchema.array(),
        },
      },
    },
  },
});

// Generate the document
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'Panini Stickers API',
    description: 'API para gestionar equipos y cromos Panini de la Liga este',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3001' }],
});