import "dotenv/config";
import { defineConfig } from "prisma/config";

// NO uses env("DATABASE_URL") aquí. Ese helper LANZA al cargar el config si la
// variable no existe, y el config se carga en CUALQUIER comando de prisma,
// incluido `prisma generate` durante el build de Vercel. Eso obligaba a que
// el build dependiera de un secreto de producción: sin DATABASE_URL en el
// panel, Vercel fallaba antes de generar nada, con un error que no tiene nada
// que ver con lo que generate necesita.
//
// generate solo lee el schema; nunca abre conexión. Por eso una URL vacía es
// inofensiva. El fail-fast de verdad sigue existiendo: src/config/env.ts valida
// DATABASE_URL con zod al arrancar la app, que es donde sí importa.
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
  schema: "prisma/schema.prisma",
});
