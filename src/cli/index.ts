#!/usr/bin/env node
import { Command } from "commander";
import { registerSetup } from "./cmd-setup.js";
import { registerStart } from "./cmd-start.js";
import { registerStop, registerRevert } from "./cmd-stop.js";
import { registerStatus } from "./cmd-status.js";
import { registerAccounts } from "./cmd-accounts.js";
import { registerService } from "./cmd-service.js";
import { registerConfigure } from "./cmd-configure.js";

const program = new Command();

program
  .name("cc-router")
  .description(
    "Round-robin proxy for Claude Max OAuth tokens.\n" +
    "Distributes Claude Code requests across multiple Claude Max accounts."
  )
  .version("0.1.0")
  .addHelpText("after", `
Examples:
  $ cc-router setup              # First-time wizard: extract tokens + configure Claude Code
  $ cc-router start              # Start proxy on localhost:3456
  $ cc-router start --daemon     # Start in background via PM2
  $ cc-router status             # Live dashboard with account stats
  $ cc-router service install    # Auto-start on system boot
  $ cc-router accounts list      # Show all configured accounts
  $ cc-router revert             # Restore Claude Code to normal (remove proxy config)
`);

registerSetup(program);
registerStart(program);
registerStop(program);
registerRevert(program);
registerStatus(program);
registerAccounts(program);
registerService(program);
registerConfigure(program);

program.parse();
