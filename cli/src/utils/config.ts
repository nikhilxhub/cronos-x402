import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from multiple possible locations
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try loading from root project directory first, then cli directory
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export interface AppConfig {
  serverWalletAddress: string | null;
  apiUrl: string;
}

export function getConfig(): AppConfig {
  return {
    serverWalletAddress: process.env.SERVER_WALLET_ADDRESS || null,
    apiUrl: process.env.API_URL || "http://localhost:3000"
  };
}

export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.serverWalletAddress) {
    errors.push("SERVER_WALLET_ADDRESS is not set in .env file");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
