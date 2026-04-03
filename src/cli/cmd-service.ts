import type { Command } from "commander";

export function registerService(program: Command): void {
  const service = program
    .command("service")
    .description("Manage cc-router as a system service (auto-start on boot)");

  service
    .command("install")
    .description("Register cc-router to start automatically on system boot (via PM2)")
    .action(async () => {
      // Fase 5
      console.log("service install — coming in Phase 5");
    });

  service
    .command("uninstall")
    .description("Remove cc-router from system startup")
    .action(async () => {
      // Fase 5
      console.log("service uninstall — coming in Phase 5");
    });

  service
    .command("status")
    .description("Show the system service status")
    .action(async () => {
      // Fase 5
      console.log("service status — coming in Phase 5");
    });
}
