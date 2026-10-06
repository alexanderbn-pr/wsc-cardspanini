import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { CreateStickerSchema } from "../schemes/CreateStickerSchema.js";
import { UpdateStickerSchema } from "../schemes/UpdateStickerSchema.js";
import { stickerFiltersSchema } from "../schemes/FilterStickerSchema.js";
import { CredentailsSchema } from "../schemes/CredentialsSchema.js";
import {
  TeamResponseSchema,
  StickerResponseSchema,
  ErrorResponseSchema,
  PositionResponseSchema,
  UserResponseSchema,
} from "./schemas.js";

const registry = new OpenAPIRegistry();

// Esquema de seguridad: habilita el boton "Authorize" de Swagger UI.
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// Register path parameters
const TeamIdParam = registry.registerParameter(
  "TeamId",
  z.number().openapi({
    param: { name: "id", in: "path" },
    example: 1,
  }),
);

const StickerIdParam = registry.registerParameter(
  "StickerId",
  z.number().openapi({
    param: { name: "id", in: "path" },
    example: 1,
  }),
);

const UserIdParam = registry.registerParameter(
  "UserId",
  z.number().openapi({
    param: { name: "id", in: "path" },
    example: 1,
  }),
);

// Register paths
registry.registerPath({
  method: "get",
  path: "/teams",
  summary: "Get all teams",
  description: "Returns all teams",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: TeamResponseSchema.array(),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/teams/{id}",
  summary: "Get team by ID",
  description: "Returns a team by its ID",
  request: {
    params: z.object({ id: TeamIdParam }),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Team found",
      content: {
        "application/json": {
          schema: TeamResponseSchema,
        },
      },
    },
    404: {
      description: "Team not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/stickers",
  summary: "Filter stickers",
  description: "Filter stickers with pagination",
  request: {
    query: stickerFiltersSchema,
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: StickerResponseSchema.array(),
        },
      },
    },
    400: {
      description: "Invalid query parameters",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/stickers/{id}",
  summary: "Get stickers by team ID",
  description: "Returns stickers for a specific team",
  request: {
    params: z.object({ id: StickerIdParam }),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Stickers found",
      content: {
        "application/json": {
          schema: StickerResponseSchema.array(),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/stickers/create",
  summary: "Create a sticker",
  description: "Create a new sticker",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateStickerSchema.shape.body,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: "Sticker created",
      content: {
        "application/json": {
          schema: StickerResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/stickers/{id}",
  summary: "Adjust a sticker quantity",
  description:
    "Applies a relative delta to the quantity, floors it at 0 and derives " +
    "`check = quantity >= 1` server-side.",
  request: {
    params: z.object({ id: StickerIdParam }),
    body: {
      content: {
        "application/json": {
          schema: UpdateStickerSchema.shape.body,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Updated sticker",
      content: {
        "application/json": {
          schema: StickerResponseSchema,
        },
      },
    },
    400: {
      description:
        "Invalid body (missing/mistyped delta, or unexpected `check`)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid bearer token",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Sticker not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/auth/{id}",
  summary: "Delete your own account",
  description:
    "Removes the caller's account. The path id must equal the token subject; " +
    "otherwise 403. The legacy GET /auth/delete/{id} route no longer exists.",
  request: {
    params: z.object({ id: UserIdParam }),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Account deleted",
      content: {
        "application/json": {
          schema: z.object({
            deleted: z.boolean().openapi({ example: true }),
          }),
        },
      },
    },
    401: {
      description: "Missing or invalid bearer token",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Path id does not match the token subject",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/register",
  summary: "Register a new user",
  description:
    "Creates a user and returns it WITHOUT a passwordHash key (absent, not " +
    "undefined).",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CredentailsSchema.shape.body,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Created user (no passwordHash key)",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid credentials payload",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/positions",
  summary: "Get all positions",
  description: "Returns all positions",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: PositionResponseSchema.array(),
        },
      },
    },
  },
});

// Generate the document
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "Panini Stickers API",
    description: "API para gestionar equipos y cromos Panini de la Liga este",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3001" }],
});
