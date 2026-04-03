import chalk from "chalk";

function ts(): string {
  return new Date().toISOString().slice(11, 19); // HH:MM:SS
}

export function logRoute(accountId: string, requestCount: number, expiresInMin: number): void {
  console.log(
    chalk.gray(`[${ts()}]`) +
    chalk.green(` → ${accountId}`) +
    chalk.gray(` req#${requestCount}`) +
    chalk.yellow(` exp=${expiresInMin}min`)
  );
}

export function logRefresh(accountId: string, ok: boolean, expiresInMin?: number): void {
  if (ok) {
    console.log(chalk.yellow(`[${ts()}] [REFRESH] ${accountId}: OK — expires in ${expiresInMin}min`));
  } else {
    console.log(chalk.red(`[${ts()}] [REFRESH] ${accountId}: FAILED`));
  }
}

export function logError(accountId: string, status: number, message: string): void {
  const statusStr = status > 0 ? ` HTTP ${status}` : "";
  console.log(chalk.red(`[${ts()}] [ERROR] ${accountId}:${statusStr} ${message}`));
}

export function logStartup(port: number, mode: string, target: string, accountCount: number): void {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════╗
║  CC-Router                                   ║
║  Port   : ${String(port).padEnd(34)}║
║  Mode   : ${mode.padEnd(34)}║
║  Target : ${target.slice(0, 34).padEnd(34)}║
║  Accounts: ${String(accountCount).padEnd(33)}║
╚══════════════════════════════════════════════╝
`));
}
