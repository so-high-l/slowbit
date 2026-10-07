import { build } from "esbuild";
import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await build({
  entryPoints: ["src/worker/index.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
});
await cp("out", "dist/client", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
const config = JSON.parse(await readFile("wrangler.json", "utf8"));
config.main = "./index.js";
config.assets.directory = "../client";
config.d1_databases[0].migrations_dir = "../.openai/drizzle";
await writeFile(
  "dist/server/wrangler.json",
  JSON.stringify(config, null, 2) + "\n",
);
console.log("Built Next.js client + board Worker with D1 migrations.");
