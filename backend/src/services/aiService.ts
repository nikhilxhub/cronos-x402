import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

interface CallModelOptions {
  model: string;
  prompt: string;
  api_key: string;
}

export async function callModel_Api(opts: CallModelOptions): Promise<string> {
  const { model, prompt, api_key } = opts;

  console.log(`Calling AI model: ${model}`);

  try {
    switch (model) {
      // OpenAI Models
      case "gpt-4o-mini": {
        const openai = createOpenAI({ apiKey: api_key });
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt
        });
        return text;
      }

      case "gpt-4o": {
        const openai = createOpenAI({ apiKey: api_key });
        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt
        });
        return text;
      }

      // Google Gemini Models
      case "gemini-2.5-pro": {
        const google = createGoogleGenerativeAI({ apiKey: api_key });
        const { text } = await generateText({
          model: google("gemini-2.0-flash"),
          prompt
        });
        return text;
      }

      case "gemini-2": {
        const google = createGoogleGenerativeAI({ apiKey: api_key });
        const { text } = await generateText({
          model: google("gemini-2.0-flash"),
          prompt
        });
        return text;
      }

      // Groq Models
      case "groq": {
        const groq = createGroq({ apiKey: api_key });
        const { text } = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt
        });
        return text;
      }

      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error: any) {
    console.error(`AI Model Error (${model}):`, error.message);
    throw error;
  }
}
