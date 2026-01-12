import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

/**
 * Default directory for storing CronosMinds data
 * ~/.cronosminds/
 */
export function getAppDirectory(): string {
  const dir = join(homedir(), ".cronosminds");

  // Ensure directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return dir;
}

/**
 * Default path for the wallet file
 * ~/.cronosminds/wallet.json
 */
export function getWalletPath(): string {
  return join(getAppDirectory(), "wallet.json");
}

/**
 * Path for wallet backup
 * ~/.cronosminds/wallet.backup.json
 */
export function getWalletBackupPath(): string {
  return join(getAppDirectory(), "wallet.backup.json");
}
