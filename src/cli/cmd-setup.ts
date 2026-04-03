import type { Command } from "commander";
import { select, input, confirm, password } from "@inquirer/prompts";
import chalk from "chalk";
import { detectPlatform, isMacos } from "../utils/platform.js";
import {
  extractFromKeychain,
  extractFromCredentialsFile,
  formatExpiry,
  redactToken,
} from "../utils/token-extractor.js";
import { validateToken } from "../utils/token-validator.js";
import { writeClaudeSettings } from "../utils/claude-config.js";
import { saveAccounts, } from "../proxy/token-refresher.js";
import { loadAccounts, accountsFileExists } from "../config/manager.js";
import { PROXY_PORT } from "../config/paths.js";
import type { Account, OAuthTokens } from "../proxy/types.js";

// ─── Public registration ──────────────────────────────────────────────────────

export function registerSetup(program: Command): void {
  program
    .command("setup")
    .description("Interactive wizard: extract tokens and configure Claude Code automatically")
    .option("--add", "Add a new account to an existing configuration (skip intro questions)")
    .action(async (opts: { add?: boolean }) => {
      await runSetupWizard({ addMode: opts.add ?? false });
    });
}

// ─── Shared single-account setup (also used by `accounts add`) ───────────────

export async function setupSingleAccount(index: number): Promise<Account | null> {
  const platform = detectPlatform();

  // Build the list of extraction choices based on platform
  type ExtractionMethod = "keychain" | "credentials" | "manual";

  const choices: { name: string; value: ExtractionMethod }[] = [];
  if (isMacos()) {
    choices.push({ name: "Extract automatically from macOS Keychain  (recommended)", value: "keychain" });
  }
  choices.push({ name: "Read from ~/.claude/.credentials.json", value: "credentials" });
  choices.push({ name: "Paste tokens manually", value: "manual" });

  const method = await select<ExtractionMethod>({
    message: "How do you want to add the tokens?",
    choices,
  });

  let tokens: OAuthTokens | null = null;

  if (method === "keychain") {
    process.stdout.write(chalk.gray("  Extracting from Keychain... "));
    tokens = await extractFromKeychain();
    if (tokens) {
      console.log(chalk.green("✓"));
      console.log(chalk.gray(`  Token: ${redactToken(tokens.accessToken)}`));
      console.log(chalk.gray(`  Expiry: ${formatExpiry(tokens.expiresAt)}`));
    } else {
      console.log(chalk.red("✗"));
      console.log(chalk.yellow("  Could not find credentials in Keychain."));
      console.log(chalk.gray("  Make sure Claude Code is logged in: run `claude login` first."));
      const retry = await confirm({ message: "Try another extraction method?", default: true });
      if (!retry) return null;
      return setupSingleAccount(index);
    }
  }

  if (method === "credentials") {
    tokens = extractFromCredentialsFile();
    if (tokens) {
      console.log(chalk.green(`  ✓ Found credentials in ~/.claude/.credentials.json`));
      console.log(chalk.gray(`    Token: ${redactToken(tokens.accessToken)}`));
      console.log(chalk.gray(`    Expiry: ${formatExpiry(tokens.expiresAt)}`));
    } else {
      console.log(chalk.red("  ✗ ~/.claude/.credentials.json not found or unreadable."));
      console.log(chalk.gray("  Make sure Claude Code is installed and you've run `claude login`."));
      const retry = await confirm({ message: "Paste tokens manually instead?", default: true });
      if (!retry) return null;
      tokens = await promptManualTokens();
    }
  }

  if (method === "manual") {
    tokens = await promptManualTokens();
  }

  if (!tokens) return null;

  // Ask for account ID
  const defaultId = `max-account-${index}`;
  const accountId = await input({
    message: "Account ID (press Enter to accept default):",
    default: defaultId,
    validate: (v) => /^[a-zA-Z0-9_-]+$/.test(v) || "Only letters, numbers, _ and - allowed",
  });

  // Validate tokens against Anthropic API
  process.stdout.write(chalk.gray("  Validating tokens against Anthropic... "));
  const validation = await validateToken(tokens.accessToken);

  if (validation.valid) {
    console.log(chalk.green("✓ Valid"));
  } else {
    console.log(chalk.red("✗ Invalid"));
    console.log(chalk.yellow(`  Reason: ${validation.reason}`));
    console.log(chalk.gray("  The token will be saved but may not work until refreshed."));
    const keepAnyway = await confirm({
      message: "Save this account anyway?",
      default: false,
    });
    if (!keepAnyway) return null;
  }

  return {
    id: accountId,
    tokens,
    healthy: validation.valid,
    busy: false,
    requestCount: 0,
    errorCount: 0,
    lastUsed: 0,
    lastRefresh: 0,
    consecutiveErrors: 0,
  };
}

// ─── Full wizard ──────────────────────────────────────────────────────────────

async function runSetupWizard({ addMode }: { addMode: boolean }): Promise<void> {
  const platform = detectPlatform();
  const hasExisting = accountsFileExists();

  printBanner();
  console.log(chalk.gray(`Platform: ${platform}\n`));

  // If accounts already exist and we're not in add-mode, ask what to do
  if (hasExisting && !addMode) {
    const existing = loadAccounts();
    console.log(chalk.yellow(`  Found ${existing.length} existing account(s).\n`));
    const action = await select({
      message: "What do you want to do?",
      choices: [
        { name: "Add more accounts to the existing configuration", value: "add" },
        { name: "Start fresh (replace all accounts)", value: "replace" },
        { name: "Cancel", value: "cancel" },
      ],
    });
    if (action === "cancel") {
      console.log(chalk.gray("\nCancelled.\n"));
      return;
    }
    if (action === "replace") {
      const sure = await confirm({
        message: chalk.red("This will delete all existing accounts. Are you sure?"),
        default: false,
      });
      if (!sure) { console.log(chalk.gray("\nCancelled.\n")); return; }
    }
    // If 'add', we'll merge below
  }

  // Guide for multi-account setup
  if (!addMode && isMacos()) {
    console.log(chalk.cyan("  Tip: to add multiple accounts, you need to:"));
    console.log(chalk.gray("  1. Log in to Claude Code with account 1 (already done if you use CC normally)"));
    console.log(chalk.gray("  2. Extract tokens → log out → log in with account 2 → extract → repeat\n"));
  }

  let numAccounts = 1;
  if (!addMode) {
    const { number } = await import("@inquirer/prompts");
    numAccounts = await number({
      message: "How many accounts do you want to configure now?",
      default: 1,
      min: 1,
      max: 20,
    }) ?? 1;
  }

  const newAccounts: Account[] = [];

  for (let i = 0; i < numAccounts; i++) {
    const label = numAccounts > 1 ? `${i + 1}/${numAccounts}` : "";
    console.log(chalk.bold(`\n${"━".repeat(40)}\n  Account ${label}\n${"━".repeat(40)}\n`));

    // If on macOS and this isn't the first account, remind user to switch accounts
    if (i > 0 && isMacos()) {
      console.log(chalk.yellow(
        `  Before extracting account ${i + 1}:\n` +
        `  1. Run: ${chalk.white("claude logout")}\n` +
        `  2. Run: ${chalk.white("claude login")}  (log in with your next Max account)\n`
      ));
      await confirm({ message: "Ready?", default: true });
    }

    const account = await setupSingleAccount(i + 1 + (hasExisting ? loadAccounts().length : 0));
    if (account) {
      newAccounts.push(account);
      console.log(chalk.green(`\n  ✓ Account "${account.id}" ready.\n`));
    } else {
      console.log(chalk.yellow(`  ↷ Skipped account ${i + 1}.\n`));
    }
  }

  if (newAccounts.length === 0) {
    console.log(chalk.red("\n✗ No accounts configured. Run cc-router setup again.\n"));
    return;
  }

  // Merge with existing accounts (by ID — new entries win on conflict)
  const existing = hasExisting && !addMode ? [] : (hasExisting ? loadAccounts() : []);
  const existingIds = new Set(existing.map(a => a.id));
  const merged = [
    ...existing.filter(a => !newAccounts.some(n => n.id === a.id)),
    ...newAccounts,
  ];

  console.log(chalk.bold(`\n${"━".repeat(40)}\n  Saving configuration\n${"━".repeat(40)}\n`));

  // Save accounts.json (atomic write)
  saveAccounts(merged);
  console.log(chalk.green(`  ✓ Saved ${merged.length} account(s) to ~/.cc-router/accounts.json`));

  // Write ~/.claude/settings.json
  writeClaudeSettings(PROXY_PORT);
  console.log(chalk.green(`  ✓ Updated ~/.claude/settings.json`));
  console.log(chalk.gray(`      ANTHROPIC_BASE_URL = http://localhost:${PROXY_PORT}`));
  console.log(chalk.gray(`      ANTHROPIC_AUTH_TOKEN = proxy-managed`));

  printNextSteps(merged.length);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function promptManualTokens(): Promise<OAuthTokens | null> {
  console.log(chalk.gray(
    "\n  You can find your tokens by running:\n" +
    "    macOS:         security find-generic-password -s 'Claude Code-credentials' -w\n" +
    "    Linux/Windows: cat ~/.claude/.credentials.json\n"
  ));

  const accessToken = await password({
    message: "Paste accessToken (sk-ant-oat01-...):",
    mask: "•",
    validate: (v) =>
      v.startsWith("sk-ant-oat01-") || v.startsWith("sk-ant-")
        ? true
        : "Must start with sk-ant-oat01-",
  });

  const refreshToken = await password({
    message: "Paste refreshToken (sk-ant-ort01-...):",
    mask: "•",
    validate: (v) =>
      v.startsWith("sk-ant-ort01-") || v.startsWith("sk-ant-")
        ? true
        : "Must start with sk-ant-ort01-",
  });

  // expiresAt is optional — default to 8h from now
  const useDefaultExpiry = await confirm({
    message: "Use default expiry (8 hours from now)?",
    default: true,
  });

  const expiresAt = useDefaultExpiry
    ? Date.now() + 8 * 60 * 60 * 1000
    : new Date(await input({
        message: "Paste expiresAt (ISO date or ms timestamp):",
      })).getTime();

  return {
    accessToken,
    refreshToken,
    expiresAt,
    scopes: ["user:inference", "user:profile"],
  };
}

function printBanner(): void {
  console.log(chalk.cyan(
    "\n╔══════════════════════════════════════════╗\n" +
    "║  CC-Router — Setup                       ║\n" +
    "╚══════════════════════════════════════════╝\n"
  ));
}

function printNextSteps(accountCount: number): void {
  console.log(chalk.bold(`\n${"━".repeat(40)}\n  Done — ${accountCount} account(s) configured\n${"━".repeat(40)}\n`));
  console.log(`  Start proxy:       ${chalk.cyan("cc-router start")}`);
  console.log(`  Auto-start:        ${chalk.cyan("cc-router service install")}`);
  console.log(`  Live dashboard:    ${chalk.cyan("cc-router status")}`);
  console.log(`  Add more accounts: ${chalk.cyan("cc-router setup --add")}\n`);
}
