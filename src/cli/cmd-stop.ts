import type { Command } from "commander";
import { execFile } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import { removeClaudeSettings, readClaudeProxySettings } from "../utils/claude-config.js";
import { isWindows } from "../utils/platform.js";
import { PROXY_PORT } from "../config/paths.js";

const execFileAsync = promisify(execFile);

export function registerStop(program: Command): void {
  program
    .command("stop")
    .description("Stop the proxy and restore Claude Code to normal authentication")
    .option("--keep-config", "Stop the proxy process but keep ~/.claude/settings.json untouched")
    .action(async (opts: { keepConfig?: boolean }) => {
      await stopProxy({ revertConfig: !opts.keepConfig });
    });
}

export function registerRevert(program: Command): void {
  program
    .command("revert")
    .description("Restore Claude Code to its normal authentication (removes proxy config)")
    .action(async () => {
      await stopProxy({ revertConfig: true });
    });
}

// ─── Core logic (shared by stop and revert) ────────────────────────────────

async function stopProxy({ revertConfig }: { revertConfig: boolean }): Promise<void> {
  let anythingDone = false;

  // 1. Stop the proxy process (PM2 if registered, else kill by port)
  const stopped = await tryStopProcess();
  if (stopped) {
    console.log(chalk.green("✓ Proxy process stopped"));
    anythingDone = true;
  } else {
    const running = await isProxyRunning();
    if (running) {
      console.log(chalk.yellow("⚠ Could not stop proxy automatically."));
      console.log(chalk.gray("  If it's running in a terminal, press Ctrl+C there."));
      console.log(chalk.gray(`  Or kill manually: kill $(lsof -ti:${PROXY_PORT})`));
    } else {
      console.log(chalk.gray("  Proxy is not running."));
    }
  }

  // 2. Remove Claude Code proxy settings
  if (revertConfig) {
    const current = readClaudeProxySettings();
    if (current.baseUrl) {
      removeClaudeSettings();
      console.log(chalk.green("✓ Removed proxy settings from ~/.claude/settings.json"));
      console.log(chalk.gray("  Claude Code will use its normal authentication on next launch."));
      anythingDone = true;
    } else {
      console.log(chalk.gray("  ~/.claude/settings.json already has no proxy config."));
    }
  }

  if (!anythingDone) {
    console.log(chalk.gray("\nNothing to do — proxy was not running and config was not set."));
  } else {
    console.log(chalk.green("\n✓ Done. Claude Code is back to normal."));
    console.log(chalk.gray("  To re-enable the proxy:  cc-router start"));
    console.log(chalk.gray("  To reconfigure:          cc-router configure\n"));
  }
}

// ─── Process management ────────────────────────────────────────────────────

async function tryStopProcess(): Promise<boolean> {
  // Try PM2 first (Phase 5 service)
  const pm2Stopped = await tryStopPm2();
  if (pm2Stopped) return true;

  // Fall back to killing by port
  return killByPort(PROXY_PORT);
}

async function tryStopPm2(): Promise<boolean> {
  try {
    await execFileAsync("pm2", ["stop", "cc-router"]);
    return true;
  } catch {
    return false;
  }
}

async function killByPort(port: number): Promise<boolean> {
  try {
    if (isWindows()) {
      // Windows: netstat to find PID, then taskkill
      const { stdout } = await execFileAsync("netstat", ["-ano"]);
      const match = stdout
        .split("\n")
        .find(line => line.includes(`:${port}`) && line.includes("LISTENING"));
      if (!match) return false;
      const pid = match.trim().split(/\s+/).at(-1);
      if (!pid || isNaN(Number(pid))) return false;
      await execFileAsync("taskkill", ["/PID", pid, "/F"]);
      return true;
    } else {
      // macOS / Linux: lsof to find PIDs, then kill
      const { stdout } = await execFileAsync("lsof", ["-ti", `:${port}`]);
      const pids = stdout.trim().split("\n").filter(Boolean);
      if (pids.length === 0) return false;
      // kill each PID — args are array, no shell injection possible
      for (const pid of pids) {
        await execFileAsync("kill", ["-TERM", pid]);
      }
      return true;
    }
  } catch {
    return false;
  }
}

async function isProxyRunning(): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${PROXY_PORT}/cc-router/health`, {
      signal: AbortSignal.timeout(500),
    });
    return res.ok;
  } catch {
    return false;
  }
}
