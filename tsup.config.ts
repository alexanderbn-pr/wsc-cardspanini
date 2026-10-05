import { defineConfig } from "tsup";

export default defineConfig({
  // Dos entries, DOS artefactos. Antes solo se emitía dist/app.js, así que
  // package.json (main/start) y docker/Dockerfile:31 apuntaban a
  // dist/index.js — un archivo que NUNCA existió. Docker estaba roto.
  //   dist/app.js   → serverless function de Vercel (api/index.ts)
  //   dist/index.js → npm start y Docker (este sí llama a listen())
  entry: ["src/app.ts", "src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
});
