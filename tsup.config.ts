import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/app.ts", "src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: !process.env.VERCEL,
  minify: false,
  dts: true,
});
