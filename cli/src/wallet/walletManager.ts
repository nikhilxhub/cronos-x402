import { ethers } from "ethers";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { getWalletPath, getWalletBackupPath } from "./paths.js";
import type { StoredWallet, WalletData } from "./types.js";

const NETWORK_NAME = "Cronos zkEVM Testnet";

/**
 * Check if a wallet file exists
 */
export function hasWallet(path: string = getWalletPath()): boolean {
  return existsSync(path);
}

/**
 * Create a new random wallet and save it to disk
 */
export function createWallet(path: string = getWalletPath()): WalletData {
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();

  // Save to disk
  saveWallet(wallet.privateKey, wallet.address, path);

  return {
    privateKey: wallet.privateKey,
    address: wallet.address
  };
}

/**
 * Import wallet from a private key string
 * Supports both with and without 0x prefix
 */
export function importWalletFromString(
  privateKeyString: string,
  path: string = getWalletPath()
): WalletData {
  // Normalize the private key (add 0x if missing)
  let normalizedKey = privateKeyString.trim();
  if (!normalizedKey.startsWith("0x")) {
    normalizedKey = "0x" + normalizedKey;
  }

  // Validate the private key by creating a wallet
  let wallet: ethers.Wallet;
  try {
    wallet = new ethers.Wallet(normalizedKey);
  } catch (error) {
    throw new Error("Invalid private key format. Please provide a valid 64-character hex string.");
  }

  // Save to disk
  saveWallet(wallet.privateKey, wallet.address, path);

  return {
    privateKey: wallet.privateKey,
    address: wallet.address
  };
}

/**
 * Load wallet from disk
 * Returns the wallet data or null if not found
 */
export function loadWallet(path: string = getWalletPath()): WalletData | null {
  if (!hasWallet(path)) {
    return null;
  }

  try {
    const fileContent = readFileSync(path, "utf8");
    const stored: StoredWallet = JSON.parse(fileContent);

    // Decode the private key from base64
    const privateKey = "0x" + Buffer.from(stored.privateKeyBase64, "base64").toString("hex");

    // Validate by creating a wallet instance
    const wallet = new ethers.Wallet(privateKey);

    // Verify the address matches
    if (wallet.address.toLowerCase() !== stored.address.toLowerCase()) {
      throw new Error("Wallet file corrupted: address mismatch");
    }

    return {
      privateKey: wallet.privateKey,
      address: wallet.address
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw new Error(`Failed to load wallet: ${error.message}`);
  }
}

/**
 * Save wallet to disk
 */
export function saveWallet(
  privateKey: string,
  address: string,
  path: string = getWalletPath()
): void {
  // Remove 0x prefix for encoding
  const keyWithoutPrefix = privateKey.startsWith("0x")
    ? privateKey.slice(2)
    : privateKey;

  const stored: StoredWallet = {
    privateKeyBase64: Buffer.from(keyWithoutPrefix, "hex").toString("base64"),
    address: address,
    createdAt: new Date().toISOString(),
    network: NETWORK_NAME
  };

  writeFileSync(path, JSON.stringify(stored, null, 2), "utf8");
}

/**
 * Create a backup of the current wallet
 */
export function backupWallet(
  sourcePath: string = getWalletPath(),
  backupPath: string = getWalletBackupPath()
): boolean {
  if (!hasWallet(sourcePath)) {
    return false;
  }

  copyFileSync(sourcePath, backupPath);
  return true;
}

/**
 * Delete wallet file (use with caution!)
 */
export function deleteWallet(path: string = getWalletPath()): boolean {
  if (!hasWallet(path)) {
    return false;
  }

  const { unlinkSync } = require("node:fs");
  unlinkSync(path);
  return true;
}

/**
 * Get wallet address without loading full wallet
 * Useful for display purposes
 */
export function getWalletAddress(path: string = getWalletPath()): string | null {
  if (!hasWallet(path)) {
    return null;
  }

  try {
    const fileContent = readFileSync(path, "utf8");
    const stored: StoredWallet = JSON.parse(fileContent);
    return stored.address;
  } catch {
    return null;
  }
}

/**
 * Validate a private key string without saving
 */
export function validatePrivateKey(privateKeyString: string): { valid: boolean; address?: string; error?: string } {
  try {
    let normalizedKey = privateKeyString.trim();
    if (!normalizedKey.startsWith("0x")) {
      normalizedKey = "0x" + normalizedKey;
    }

    const wallet = new ethers.Wallet(normalizedKey);
    return {
      valid: true,
      address: wallet.address
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Invalid private key"
    };
  }
}
