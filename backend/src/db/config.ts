import dotenv from "dotenv";
dotenv.config();

type ApiKeyRecord = {
  ai_model: string;
  api_key: string;
  owner_sol: string;
  rate_per_request: number;
};

// Local in-memory key store
const apiKeyMap: Record<string, ApiKeyRecord> = {
  "gpt-3.5-turbo": {
    ai_model: "gpt-3.5-turbo",
    api_key: process.env.OPENAI_API_KEY!,
    owner_sol: process.env.DEFAULT_OWNER ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request:  100000000000000000,
  },
  "groq": {
    ai_model: "groq",
    api_key: process.env.groq_API_KEY!,
    owner_sol: process.env.DEFAULT_OWNER ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 100000000000000000,
  },
  "gemini-2": {
    ai_model: "gemini-2",
    api_key: process.env.GOOGLE_API_KEY2!,
    owner_sol: process.env.DEFAULT_OWNER ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 100000000000000000,
  },
  "gemini-2.5-pro": {
    ai_model: "gemini-2.5-pro",
    api_key: process.env.GOOGLE_API_KEY!,
    owner_sol: process.env.DEFAULT_OWNER ?? "0x270D5381a5C46043995aDB3Dc251af7Bf03a3bEa",
    rate_per_request: 100000000000000000,
  },
};


export function findApiKeyToModel2(modelKey: string): ApiKeyRecord | null {
  if (!modelKey) return null;
  const record = apiKeyMap[modelKey];
  return record ?? null;
}