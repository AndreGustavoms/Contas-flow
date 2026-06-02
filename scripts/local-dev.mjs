import { spawn } from "node:child_process";

const api = spawn(process.execPath, ["server/index.mjs"], {
  env: { ...process.env, PORT: process.env.PORT ?? "8787" },
  stdio: "inherit",
});

const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5175"],
  {
    env: { ...process.env },
    stdio: "inherit",
  },
);

function stop() {
  api.kill();
  vite.kill();
}

process.on("SIGINT", () => {
  stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});

api.on("exit", (code) => {
  vite.kill();
  process.exit(code ?? 0);
});

vite.on("exit", (code) => {
  api.kill();
  process.exit(code ?? 0);
});
