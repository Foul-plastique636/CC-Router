export type Platform = "macos" | "linux" | "windows";

export function detectPlatform(): Platform {
  switch (process.platform) {
    case "darwin": return "macos";
    case "win32":  return "windows";
    default:       return "linux";
  }
}

export function isWindows(): boolean {
  return process.platform === "win32";
}

export function isMacos(): boolean {
  return process.platform === "darwin";
}
