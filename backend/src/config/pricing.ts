// Model pricing configuration for CronosMinds
// Prices are in zkTCRO (Cronos zkEVM Testnet native token)

export interface ModelConfig {
  name: string;
  costTCRO: number;
  description: string;
  aiModel: string;
}

export const MODEL_PRICING: Record<string, ModelConfig> = {
  // OpenAI Models
  "gpt-4o": {
    name: "GPT-4o",
    costTCRO: 0.5,
    description: "OpenAI's latest multimodal model",
    aiModel: "gpt-4o"
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    costTCRO: 0.15,
    description: "Fast and affordable OpenAI model",
    aiModel: "gpt-4o-mini"
  },

  // Google Models
  "gemini-pro": {
    name: "Gemini 2.0 Flash",
    costTCRO: 0.2,
    description: "Google's fast AI model",
    aiModel: "gemini-2.5-pro"
  },

  // Groq Models
  "groq": {
    name: "Llama 3.3 70B",
    costTCRO: 0.1,
    description: "Ultra-fast Llama 3 via Groq",
    aiModel: "groq"
  }
};

// Helper to get model by key
export function getModelConfig(modelKey: string): ModelConfig | null {
  return MODEL_PRICING[modelKey] || null;
}

// Get all available model keys
export function getAvailableModels(): string[] {
  return Object.keys(MODEL_PRICING);
}
