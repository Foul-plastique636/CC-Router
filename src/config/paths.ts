import os from "os";
import path from "path";

export const CONFIG_DIR = path.join(os.homedir(), ".cc-router");
export const ACCOUNTS_PATH = path.join(CONFIG_DIR, "accounts.json");
export const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
export const PROXY_PORT = 3456;
export const LITELLM_PORT = 4000;
