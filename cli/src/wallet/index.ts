// Wallet management exports
export {
  hasWallet,
  createWallet,
  importWalletFromString,
  loadWallet,
  saveWallet,
  backupWallet,
  deleteWallet,
  getWalletAddress,
  validatePrivateKey
} from "./walletManager.js";

// Path utilities
export {
  getAppDirectory,
  getWalletPath,
  getWalletBackupPath
} from "./paths.js";

// Types
export type { StoredWallet, WalletData } from "./types.js";
