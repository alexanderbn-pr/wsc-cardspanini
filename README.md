# Guía de Arquitectura Hexagonal — wsc-cardsPanini

## ¿Qué es la Arquitectura Hexagonal?

La Arquitectura Hexagonal (también conocida como Puertos y Adaptadores) es un patrón arquitectónico que:

1. **Separa responsabilidades**: La lógica de negocio (dominio) está aislada de los detalles externos (frameworks, bases de datos, APIs)
2. **Define límites claros**: El dominio se comunica a través de interfaces (puertos), no de implementaciones concretas
3. **Habilita la testeabilidad**: Puedes probar la lógica de negocio sin dependencias externas
4. **Soporta flexibilidad**: Intercambiar fuentes de datos (ej: JSON → Base de datos) requiere solo nuevos adaptadores, no cambios en la lógica de negocio

### Conceptos Centrales

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DOMINIO                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Entidades      │  │  Repositorios   │  │  Servicios  │ │
│  │   (Team, Sticker)│  │  (Interfaces)   │  │ (Casos de   │ │
│  │                  │  │                 │  │  Uso)       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                    │                   │         │
└───────────┼────────────────────┼───────────────────┼─────────┘
            │                    │                   │
            ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│               CAPA DE INFRAESTRUCTURA                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Adaptadores (Implementaciones)             │    │
│  │  ┌─────────────────┐  ┌─────────────────────────┐  │    │
│  │  │ JsonTeamRepo    │  │  (Futuro: DatabaseRepo)  │  │    │
│  │  │ (teams.json)    │  │                          │  │    │
│  │  └─────────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                CAPA DE APLICACIÓN                            │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Controllers    │  │  Factories de   │                  │
│  │  (HTTP/Express) │  │  Rutas (DI)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│           RAÍZ DE COMPOSICIÓN (app.ts)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Crear Adaptadores de Infraestructura (Repo)     │    │
│  │  2. Crear Servicios (inyectar Repository)           │    │
│  │  3. Crear Controllers (inyectar Service)            │    │
│  │  4. Crear Rutas (inyectar Controller)               │    │
│  │  5. Montar Rutas en la App Express                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Análisis del Estado Actual

### Antes de la Migración (Roto)

```
src/
├── app.ts                    # Imports estáticos de rutas, sin DI
├── controllers/
│   ├── teams.controller.ts   # Métodos estáticos, importa TeamsModel directamente
│   └── stickers.controller.ts # Patrón DI (TeamService)
├── models/
│   └── teams.model.ts        # COMENTADO (código muerto)
├── routes/
│   ├── teams.ts              # Imports estáticos de controller
│   └── stickers.ts           # Imports estáticos de controller
├── services/
│   └── team.service.ts       # Patrón DI (TeamRepository)
├── domain/
│   ├── entities/
│   │   ├── Team.ts           # Interface
│   │   └── Sticker.ts        # number: number (INCORRECTO - los datos son strings como "6A")
│   └── repositories/
│       └── team.repository.ts # Interface
└── data/
    └── teams.json            # Datos reales (campos number son strings)
```

**Problemas Identificados:**
1. Tipo incorrecto en `Sticker.number` (number vs string en los datos)
2. `TeamsModel` comentado → TeamController no puede funcionar
3. Los métodos estáticos impiden la inyección de dependencias
4. Sin adaptadores de infraestructura → no hay forma de leer datos

### Después de la Migración (Corregido)

```
src/
├── app.ts                    # Raíz de composición con DI wiring
├── infrastructure/
│   └── json-team.repository.ts # NUEVO: Adaptador TeamRepository
├── controllers/
│   ├── teams.controller.ts   # Métodos de instancia con DI
│   └── stickers.controller.ts # Métodos de instancia con DI
├── routes/
│   ├── teams.ts              # Patrón factory (acepta controller)
│   └── stickers.ts           # Patrón factory (acepta controller)
├── services/
│   └── team.service.ts       # Patrón DI (TeamRepository)
├── domain/
│   ├── entities/
│   │   ├── Team.ts           # Interface
│   │   └── Sticker.ts        # number: string (CORRECTO)
│   └── repositories/
│       └── team.repository.ts # Interface
└── data/
    └── teams.json            # Datos reales
```

## Plan de Migración Paso a Paso

### Paso 1: Corregir el Tipo de Entidad de Dominio

**Archivo:** `src/domain/entities/Sticker.ts`

**Cambio:** `number: number` → `number: string`

**POR QUÉ:** Los datos JSON contienen valores como "6A", "13BIS", "UF20" que son strings, no números. El tipo debe coincidir con los datos reales.

```typescript
// ANTES
export interface Sticker {
    number: number;  // ❌ Tipo incorrecto
    // ...
}

// DESPUÉS
export interface Sticker {
    number: string;  // ✅ Coincide con datos JSON
    // ...
}
```

### Paso 2: Crear Adaptador de Infraestructura

**Archivo:** `src/infrastructure/json-team.repository.ts` (NUEVO)

**POR QUÉ:** Necesitamos un adaptador que implemente la interfaz `TeamRepository` y lea desde `teams.json`. Esto puentea la interfaz de dominio con la fuente de datos real.

```typescript
import { Team } from "../domain/entities/Team.js";
import { TeamRepository } from "../domain/repositories/team.repository.js";
import teamsData from "../data/teams.json" with { type: "json" };

export class JsonTeamRepository implements TeamRepository {
    async getAll(): Promise<Team[]> {
        return teamsData.teams as Team[];
    }

    async getById(id: number): Promise<Team | undefined> {
        return teamsData.teams.find(t => t.id === id) as Team | undefined;
    }
}
```

### Paso 3: Refactorizar Controllers a Métodos de Instancia

**Archivo:** `src/controllers/teams.controller.ts`

**POR QUÉ:** Los métodos estáticos impiden la inyección de dependencias. Los métodos de instancia con arrow functions permiten pasar servicios a través del constructor.

```typescript
// ANTES (Métodos estáticos - no se pueden inyectar dependencias)
export class TeamController {
    static async getAll(req: Request, res: Response) {
        res.json(await TeamsModel.getAll());  // ❌ Dependencia directa del modelo
    }
}

// DESPUÉS (Métodos de instancia con DI)
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    getAll = async (req: Request, res: Response) => {
        const teams = await this.teamService.getAll();  // ✅ Servicio inyectado
        res.json(teams);
    }
}
```

### Paso 4: Convertir Rutas a Patrón Factory

**Archivo:** `src/routes/teams.ts`

**POR QUÉ:** Las rutas necesitan recibir instancias de controller en lugar de importar clases estáticas. Las funciones factory habilitan la inyección de dependencias.

```typescript
// ANTES (Imports estáticos)
const router = Router();
router.get("/", TeamController.getAll);  // ❌ Método estático

// DESPUÉS (Patrón factory)
export default function createTeamsRouter(controller: TeamController): Router {
    const router = Router();
    router.get("/", controller.getAll);  // ✅ Método de instancia
    return router;
}
```

### Paso 5: Conectar Dependencias en la Raíz de Composición

**Archivo:** `src/app.ts`

**POR QUÉ:** La raíz de composición es donde se crean y conectan todas las dependencias. Este es el único lugar que conoce las implementaciones concretas.

```typescript
// Raíz de Composición - Conectar todas las dependencias
const teamRepository = new JsonTeamRepository();      // Infraestructura
const teamService = new TeamService(teamRepository);  // Servicio
const teamController = new TeamController(teamService); // Controller
const teamsRouter = createTeamsRouter(teamController); // Rutas

app.use('/teams', teamsRouter);  // Montar
```

## Flujo de Dependencias

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE DEPENDENCIAS                      │
│                                                              │
│  teams.json                                                  │
│      │                                                       │
│      ▼                                                       │
│  JsonTeamRepository (implementa TeamRepository)              │
│      │                                                       │
│      ▼                                                       │
│  TeamService (usa TeamRepository)                            │
│      │                                                       │
│      ├──► TeamController (usa TeamService)                   │
│      │        │                                              │
│      │        ▼                                              │
│      │    createTeamsRouter (recibe TeamController)          │
│      │        │                                              │
│      │        ▼                                              │
│      │    app.use('/teams', teamsRouter)                     │
│      │                                                       │
│      └──► StickerController (usa TeamService)                │
│               │                                              │
│               ▼                                              │
│           createStickersRouter (recibe StickerController)    │
│               │                                              │
│               ▼                                              │
│           app.use('/stickers', stickersRouter)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Estrategia de Pruebas

Con la arquitectura hexagonal, las pruebas se vuelven mucho más fáciles:

### Pruebas Unitarias (Capa de Dominio)

```typescript
// Mock de la interfaz del repositorio
const mockRepository: TeamRepository = {
    getAll: async () => mockTeams,
    getById: async (id) => mockTeams.find(t => t.id === id)
};

// Probar el servicio de forma aislada
const service = new TeamService(mockRepository);
const teams = await service.getAll();
```

### Pruebas de Integración (Capa de Infraestructura)

```typescript
// Probar que JsonTeamRepository lee el JSON real
const repo = new JsonTeamRepository();
const teams = await repo.getAll();
expect(teams).toHaveLength(25);  // Todos los equipos cargados
```

### Pruebas E2E (Capa de Aplicación)

```typescript
// Probar el ciclo completo de una petición
const response = await request(app).get('/teams');
expect(response.status).toBe(200);
```

## Conceptos Clave

1. **La Seguridad de Tipos Importa**: El tipo `Sticker.number` era incorrecto (number vs string). Siempre verifica que los tipos coincidan con los datos reales.

2. **Las Interfaces Habilitan Flexibilidad**: La interfaz `TeamRepository` permite intercambiar implementaciones sin cambiar la lógica de negocio.

3. **Patrón de Raíz de Composición**: Toda la conexión de dependencias ocurre en un solo lugar (`app.ts`), haciendo la arquitectura explícita y mantenible.

4. **Patrón Factory para Rutas**: Convertir controllers estáticos a instancias requiere funciones factory para las rutas.

5. **Separación de Infraestructura**: `JsonTeamRepository` es un adaptador que puentea las interfaces de dominio con las fuentes de datos.

## Mejoras Futuras

- Agregar capa de validación (schemas Zod) en los controllers
- Agregar adaptador de caché (Redis) implementando una interfaz CacheRepository
- Agregar adaptador de base de datos (PostgreSQL) implementando TeamRepository
- Agregar documentación de API (OpenAPI/Swagger)
- Agregar adaptador de logging
