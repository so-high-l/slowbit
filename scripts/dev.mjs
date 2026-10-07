import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
const env = {
  ...process.env,
  WRANGLER_SEND_METRICS: "false",
  WATCHPACK_POLLING: process.env.WATCHPACK_POLLING ?? "true",
};
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Setup failed (${code})`)),
    );
  });
if (!existsSync("out/index.html")) {
  await run(["node_modules/next/dist/bin/next", "build", "--webpack"]);
}
await run([
  "node_modules/wrangler/bin/wrangler.js",
  "d1",
  "migrations",
  "apply",
  "DB",
  "--local",
  "--persist-to",
  ".wrangler/state",
]);
const children = [
  spawn(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "dev",
      "--local",
      "--port",
      "4190",
      "--persist-to",
      ".wrangler/state",
    ],
    { stdio: "inherit", env },
  ),
  spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--webpack",
      "--hostname",
      "0.0.0.0",
    ],
    { stdio: "inherit", env },
  ),
];
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) child.on("exit", stop);
