/**
 * Runs the API server and the Vite dev server together (cross-platform).
 *
 *   npm run dev:all
 */

import { spawn } from "child_process";
import { platform } from "os";

const npmCmd = platform() === "win32" ? "npm.cmd" : "npm";

const procs = [
  spawn(npmCmd, ["run", "server"], { stdio: "inherit", shell: false }),
  spawn(npmCmd, ["run", "dev"], { stdio: "inherit", shell: false }),
];

for (const proc of procs) {
  proc.on("exit", (code) => {
    for (const other of procs) other.kill();
    process.exit(code ?? 0);
  });
}

const shutdown = () => {
  for (const proc of procs) proc.kill();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
