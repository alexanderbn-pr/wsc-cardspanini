// Vercel Serverless Function.
//
// Importa el ARTEFACTO CONSTRUIDO, no el código fuente. Si importáramos
// "../src/app.js", el builder de Vercel compilaría y type-checkearía todo
// nuestro src/ con sus propios compilerOptions, que no coinciden con los
// nuestros. Ya lo sufrimos: helmet 8.3.0 resuelve mal sus tipos bajo la
// resolución de Vercel (TS2349) aunque typecheck local pase limpio.
//
// tsup externaliza las dependencias de package.json, así que dist/app.js
// conserva imports bare (express, zod, pino, cors...). Vercel las resuelve desde
// node_modules en runtime — que es lo normal. Lo que importa es que al importar
// el ARTEFACTO y no la fuente, Vercel deja de type-checkeear src/, que es donde
// estaba fallando.
//
// @ts-expect-error dist/ está en .gitignore y tsup no emite declaraciones, así
// que este artefacto no tiene .d.ts. No se puede type-checlear un artefacto
// generado que puede no existir (clon limpio). Sustituir por allowJs solo para
// esto escondería errores reales de tipos en el resto del proyecto.
// Si algún día tsup emite declaraciones (dts: true), esta directiva se
// vuelve "unused" y TypeScript lo avisa — que es justo lo que queremos.
import app from "../dist/app.js";

export default app;
