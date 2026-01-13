// Model pricing configuration for CronosMinds
// Prices are in TCRO (Cronos EVM Testnet native token)

export interface ModelConfig {
  name: string;
  costTCRO: number;
  description: string;
  aiModel: string;
}

export const MODEL_PRICING: Record<string, ModelConfig> = {
  // OpenAI Models
  "gpt-4o": {
    name: "GPT-3.5 Turbo",
    costTCRO: 0.5,
    description: "OpenAI's reliable model",
    aiModel: "gpt-4o"
  },
  "gpt-4o-mini": {
    name: "GPT-3.5 Turbo",
    costTCRO: 0.15,
    description: "Fast and affordable OpenAI model",
    aiModel: "gpt-4o-mini"
  },

  // Google Models
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    costTCRO: 0.2,
    description: "Google's fast AI model",
    aiModel: "gemini-2.5-flash"
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    costTCRO: 0.5,
    description: "Google's most capable AI model",
    aiModel: "gemini-2.5-pro"
  },
  "gemini-2.0-flash": {
    name: "Gemini 2.0 Flash",
    costTCRO: 0.15,
    description: "Google's next-gen flash model",
    aiModel: "gemini-2.0-flash"
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
