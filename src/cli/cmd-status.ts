import type { Command } from "commander";

export function registerStatus(program: Command): void {
  program
    .command("status")
    .description("Live dashboard: account health, request counts, recent routing log")
    .option("--port <port>", "Proxy port to connect to", "3456")
    .option("--json", "Output stats as JSON instead of interactive dashboard")
    .action(async (_opts) => {
      // Fase 4
      console.log("Status dashboard — coming in Phase 4");
    });
}
