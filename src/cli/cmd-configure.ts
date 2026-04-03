import type { Command } from "commander";
import chalk from "chalk";
import { writeClaudeSettings, removeClaudeSettings, readClaudeProxySettings } from "../utils/claude-config.js";
import { PROXY_PORT, CLAUDE_SETTINGS_PATH } from "../config/paths.js";

export function registerConfigure(program: Command): void {
  program
    .command("configure")
    .description("Update ~/.claude/settings.json to point to the proxy (or remove the config)")
    .option("--remove", "Remove cc-router settings from ~/.claude/settings.json")
    .option("--port <port>", "Proxy port to configure", String(PROXY_PORT))
    .option("--show", "Show current Claude Code proxy settings")
    .action((opts: { remove?: boolean; port: string; show?: boolean }) => {
      if (opts.show) {
        const current = readClaudeProxySettings();
        if (current.baseUrl) {
          console.log(chalk.green("  Claude Code is configured to use cc-router:"));
          console.log(`    ANTHROPIC_BASE_URL  = ${chalk.cyan(current.baseUrl)}`);
          console.log(`    ANTHROPIC_AUTH_TOKEN = ${chalk.gray(current.authToken ?? "(not set)")}`);
        } else {
          console.log(chalk.yellow("  Claude Code is NOT configured to use cc-router."));
          console.log(chalk.gray(`  Run: cc-router configure`));
        }
        return;
      }

      if (opts.remove) {
        removeClaudeSettings();
        console.log(chalk.green("✓ Removed cc-router settings from ~/.claude/settings.json"));
        console.log(chalk.gray("  Claude Code will use its default authentication on next launch."));
        return;
      }

      const port = parseInt(opts.port, 10);
      writeClaudeSettings(port);
      console.log(chalk.green(`✓ Updated ${CLAUDE_SETTINGS_PATH}`));
      console.log(chalk.gray(`  ANTHROPIC_BASE_URL  = http://localhost:${port}`));
      console.log(chalk.gray(`  ANTHROPIC_AUTH_TOKEN = proxy-managed`));
    });
}
