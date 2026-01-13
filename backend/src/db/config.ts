import dotenv from "dotenv";
dotenv.config();

type ApiKeyRecord = {
  ai_model: string;
  api_key: string;
  owner_cronos: string;
  rate_per_request: number;
};

// Local in-memory key store
// Note: rate_per_request is in wei (1 zkTCRO = 10^18 wei)
const apiKeyMap: Record<string, ApiKeyRecord> = {
  // GPT-4o (0.5 zkTCRO)
  "gpt-4o": {
    ai_model: "gpt-4o",
    api_key: process.env.OPENAI_API_KEY!,
    owner_cronos: process.env.SERVER_WALLET_ADDRESS ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 500000000000000000, // 0.5 zkTCRO
  },
  // GPT-4o-mini (0.15 zkTCRO)
  "gpt-4o-mini": {
    ai_model: "gpt-4o-mini",
    api_key: process.env.OPENAI_API_KEY!,
    owner_cronos: process.env.SERVER_WALLET_ADDRESS ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 150000000000000000, // 0.15 zkTCRO
  },
  // Groq/Llama3 (0.1 zkTCRO)
  "groq": {
    ai_model: "groq",
    api_key: process.env.groq_API_KEY!,
    owner_cronos: process.env.SERVER_WALLET_ADDRESS ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 100000000000000000, // 0.1 zkTCRO
  },
  // Gemini 2.5 Flash (0.2 zkTCRO)
  "gemini-2.5-flash": {
    ai_model: "gemini-2.5-flash",
    api_key: process.env.GOOGLE_API_KEY!,
    owner_cronos: process.env.SERVER_WALLET_ADDRESS ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 200000000000000000, // 0.2 zkTCRO
  },
  // Gemini 2.5 Pro (0.5 zkTCRO)
  "gemini-2.5-pro": {
    ai_model: "gemini-2.5-pro",
    api_key: process.env.GOOGLE_API_KEY!,
    owner_cronos: process.env.SERVER_WALLET_ADDRESS ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 500000000000000000, // 0.5 zkTCRO
  },
  // Gemini 2.0 Flash (0.15 zkTCRO)
  "gemini-2.0-flash": {
    ai_model: "gemini-2.0-flash",
    api_key: process.env.GOOGLE_API_KEY!,
    owner_cronos: process.env.SERVER_WALLET_ADDRESS ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 150000000000000000, // 0.15 zkTCRO
  },
};

export function findApiKeyToModel2(modelKey: string): ApiKeyRecord | null {
  if (!modelKey) return null;
  const record = apiKeyMap[modelKey];
  return record ?? null;
}