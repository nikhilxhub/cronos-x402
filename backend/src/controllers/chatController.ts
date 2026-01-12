import type { Response } from "express";
import type { PaymentVerifiedRequest } from "../middleware/paymentMiddleware.js";
import { MODEL_PRICING } from "../config/pricing.js";
import { callModel_Api } from "../services/aiService.js";
import { findApiKeyToModel2 } from "../db/config.js";

export async function chatController(
  req: PaymentVerifiedRequest,
  res: Response
) {
  try {
    const { prompt, model } = req.body;
    const txHash = req.paymentTxHash;

    // Get model configuration
    const modelConfig = MODEL_PRICING[model];
    if (!modelConfig) {
      return res.status(400).json({
        error: "Invalid Model",
        message: `Model '${model}' not found`
      });
    }

    console.log(`Processing request for model: ${model}, prompt length: ${prompt.length}`);

    // For MVP: Mock the AI response
    // Comment out real API calls but leave placeholders

    let aiResponse: string;

    // === MOCK RESPONSE (for MVP testing) ===
    const useMock = process.env.USE_MOCK_AI === "true";

    if (useMock) {
      // Mock response for testing without API keys
      aiResponse = `[Mock Response from ${modelConfig.name}]\n\nYour prompt: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"\n\nThis is a simulated response. In production, this would be a real AI response from ${modelConfig.name}.`;
    } else {
      // === REAL AI API CALLS ===
      try {
        // Map our model key to the internal model identifier
        const internalModelKey = modelConfig.aiModel;

        // Get API key for the model
        const apiKeyEntry = await findApiKeyToModel2(internalModelKey);

        if (!apiKeyEntry) {
          // Fallback to mock if no API key configured
          console.warn(`No API key found for model: ${internalModelKey}, using mock response`);
          aiResponse = `[Mock Response from ${modelConfig.name}] - API key not configured\n\nYour prompt: "${prompt}"`;
        } else {
          // Call the actual AI model
          aiResponse = await callModel_Api({
            model: apiKeyEntry.ai_model,
            prompt,
            api_key: apiKeyEntry.api_key
          });
        }
      } catch (aiError: any) {
        console.error("AI API Error:", aiError);
        // Return error but still acknowledge payment was received
        return res.status(500).json({
          error: "AI Service Error",
          message: "Payment was received but AI service failed. Please contact support.",
          txHash,
          details: aiError.message
        });
      }
    }

    // Success response
    return res.json({
      success: true,
      txHash,
      model: modelConfig.name,
      response: aiResponse
    });

  } catch (err: any) {
    console.error("Chat controller error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to process chat request"
    });
  }
}
