# Design: Mirando mi aplicación — Arquitectura Hexagonal

## Technical Approach

Migrate from broken mixed-pattern controllers to consistent hexagonal architecture with manual DI at the composition root (`app.ts`). Create JSON adapter implementing the existing `TeamRepository` port. Fix broken routes by converting static controllers to instance-based DI pattern.

## Architecture Decisions

### Decision: Adapter Location

**Choice**: `src/infrastructure/json-team.repository.ts` (not `src/adapters/`)
**Alternatives considered**: `src/adapters/`, `src/repositories/`
**Rationale**: Follows hexagonal convention — infrastructure contains driven adapters. The `domain/` folder already has `repositories/` for ports, so infrastructure is the natural complement. Also avoids collision with the proposal's `src/adapters/` suggestion since the codebase already uses `src/config/`, `src/data/` naming.

### Decision: Route Pattern

**Choice**: Routes become factory functions receiving pre-wired controller instances
**Alternatives considered**: Keep routes as module-level singletons; use Express Router factory
**Rationale**: Factory functions are the cleanest way to receive dependencies without globals. Each route file exports a function `(controller) => Router` that creates and returns a configured router.

### Decision: Data Type Reconciliation

**Choice**: Adapter normalizes `teams.json` data to match domain interfaces
**Alternatives considered**: Change domain interfaces to match JSON shape
**Rationale**: Domain interfaces are the contract. JSON data has `number` as strings ("6A", "13BIS") and `id` at end of objects. Adapter must map: `string → number` for sticker numbers, assign array-index `id` if missing, handle `check`/`quantity` defaults.

## Data Flow

```
HTTP Request
    │
    ▼
Express Route (factory)
    │ receives controller instance
    ▼
Controller (instance method, DI via constructor)
    │ calls service methods
    ▼
TeamService (application core)
    │ delegates to repository port
    ▼
TeamRepository (interface — domain)
    │ implemented by adapter
    ▼
JsonTeamRepository (reads teams.json)
    │ returns Team[]
    ▼
Response (JSON)
```

## File Changes

### CREATE: `src/infrastructure/json-team.repository.ts`

- **Purpose**: JSON adapter implementing `TeamRepository` port
- **Exports**: `JsonTeamRepository` class
- **Dependencies**: `Team`, `TeamRepository` from domain
- **Notes**:
  - Implements `getAll(): Promise<Team[]>` — reads `teams.json`, normalizes data
  - Implements `getById(id: number): Promise<Team | undefined>` — filters by id
  - Must handle: `number` as string → `number`, missing `check`/`quantity` defaults, `id` assignment from array index if missing
  - Use `import teams from '../data/teams.json' with { type: 'json' }` (ESM import assertion)

### MODIFY: `src/routes/stickers.ts`

- **Purpose**: Fix broken DI wiring
- **Changes**: Export `createStickerRouter(controller: StickerController): Router` factory function
- **Current bug**: Line 6 `StickerController.getId` — accessing instance method as static (TS2339)
- **Fix**: Factory receives pre-instantiated controller, wires `controller.getId` as route handler

### MODIFY: `src/routes/teams.ts`

- **Purpose**: Align with stickers pattern
- **Changes**: Export `createTeamsRouter(controller: TeamController): Router` factory function
- **Current state**: Works because `TeamController` uses static methods — but must change when controller moves to instance DI

### MODIFY: `src/controllers/teams.controller.ts`

- **Purpose**: Convert from static methods to instance DI (match StickerController pattern)
- **Changes**:
  - Remove `static` from `getAll` and `getId`
  - Add constructor: `constructor(private readonly teamService: TeamService)`
  - Remove `import { TeamsModel }` (dead dependency)
  - Add `import { TeamService } from '../services/team.service.js'`
- **Exports**: `TeamController` class (instance methods, same public API shape)

### MODIFY: `src/controllers/stickers.controller.ts`

- **Purpose**: Verify interface compatibility (no changes needed)
- **Current state**: Already uses correct DI pattern — `constructor(private readonly teamService: TeamService)` and instance methods (arrow functions)
- **Action**: No modification required — already correct

### MODIFY: `src/app.ts`

- **Purpose**: Add composition root — manual DI wiring
- **Changes**:
  - Import `JsonTeamRepository` from infrastructure
  - Import `TeamService` from services
  - Import controllers
  - Import route factories
  - Wire: adapter → service → controllers → routes
  - Mount wired routes
- **Pattern**:
  ```typescript
  // Composition root
  const teamRepository = new JsonTeamRepository();
  const teamService = new TeamService(teamRepository);
  const teamController = new TeamController(teamService);
  const stickerController = new StickerController(teamService);
  
  app.use('/stickers', createStickerRouter(stickerController));
  app.use('/teams', createTeamsRouter(teamController));
  ```

### DELETE: `src/models/teams.model.ts`

- **Purpose**: Remove dead code — replaced by `JsonTeamRepository`
- **Reason**: Entirely commented out, role superseded by infrastructure adapter

### KEEP: `src/config/database.ts`

- **Purpose**: Keep commented out as Supabase adapter placeholder
- **Reason**: Uncommenting requires Supabase env vars to be configured — out of scope for this change. Leave as-is for future adapter work.

### CREATE: `src/infrastructure/index.ts`

- **Purpose**: Barrel export for infrastructure layer
- **Exports**: `JsonTeamRepository`

## Interfaces / Contracts

```typescript
// Domain port (unchanged)
interface TeamRepository {
  getAll(): Promise<Team[]>;
  getById(id: number): Promise<Team | undefined>;
}

// Route factory signature
function createStickerRouter(controller: StickerController): Router;
function createTeamsRouter(controller: TeamController): Router;

// Controller constructors
class StickerController {
  constructor(private readonly teamService: TeamService) {}
  getId: (req: Request, res: Response) => Promise<void>;
}
class TeamController {
  constructor(private readonly teamService: TeamService) {}
  getAll: (req: Request, res: Response) => Promise<void>;
  getId: (req: Request, res: Response) => Promise<void>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | JsonTeamRepository.getAll(), getById() | Import adapter, call methods, assert on mock teams.json data |
| Integration | Route wiring | supertest: `GET /teams`, `GET /teams/1`, `GET /stickers/1` |
| Regression | Existing health.test.ts, app.test.ts | Run `vitest` — should pass unchanged |

## Migration Order

**Phase 1 — Adapter (no breakage)**
1. Create `src/infrastructure/json-team.repository.ts`
2. Create `src/infrastructure/index.ts`

**Phase 2 — Controllers (fix DI)**
3. Modify `src/controllers/teams.controller.ts` — static → instance DI

**Phase 3 — Routes (fix wiring)**
4. Modify `src/routes/stickers.ts` — factory pattern
5. Modify `src/routes/teams.ts` — factory pattern

**Phase 4 — Composition Root**
6. Modify `src/app.ts` — manual DI wiring

**Phase 5 — Cleanup**
7. Delete `src/models/teams.model.ts`

**Validation**: Run `npm run typecheck` after each phase.

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| `teams.json` `number` as string breaks `Sticker.number: number` | Medium | Adapter must parse/convert; fallback to string if NaN |
| `id` at end of JSON objects confusing | Low | Object property order is irrelevant in JSON; adapter reads by key |
| `app.test.ts` breaks if it mocks old route pattern | Medium | Read test before modifying app.ts; update mocks if needed |
| Static → instance refactor breaks `TeamController` callers | Low | Only `teams.ts` route calls it — both change together |
| ESM import assertion `{ type: 'json' }` unsupported | Low | Node 20 supports it; fallback to `fs.readFileSync` + `JSON.parse` |

## Open Questions

- [ ] Should sticker `number` remain `string` in domain (to support "6A", "13BIS", "UF20")? Current interface says `number` but data has strings.
- [ ] Should `check` and `quantity` get default values in adapter (false, 0) or be optional in domain interface?
