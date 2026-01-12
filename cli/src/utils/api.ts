import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.API_URL || "http://localhost:3000";

export interface ChatRequest {
  prompt: string;
  model: string;
}

export interface ChatResponse {
  success: boolean;
  txHash: string;
  model: string;
  response: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  paymentInfo?: {
    receiver: string;
    models: Record<string, any>;
    chainId: number;
    network: string;
    rpcUrl: string;
  };
}

export interface ServerInfo {
  name: string;
  description: string;
  network: {
    name: string;
    chainId: number;
    rpcUrl: string;
    currency: string;
  };
  serverWallet: string;
  models: Record<string, {
    name: string;
    costTCRO: number;
    description: string;
  }>;
}

/**
 * Fetch server info and available models
 */
export async function getServerInfo(): Promise<ServerInfo> {
  const response = await axios.get<ServerInfo>(`${API_BASE_URL}/info`);
  return response.data;
}

/**
 * Send chat request to server with payment hash
 */
export async function sendChatRequest(
  request: ChatRequest,
  paymentHash: string
): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>(
      `${API_BASE_URL}/chat`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
          "x-payment-hash": paymentHash
        },
        timeout: 60000 // 60 second timeout for AI response
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response?.data) {
        throw new Error(
          `${axiosError.response.data.error}: ${axiosError.response.data.message}`
        );
      }
    }
    throw error;
  }
}

/**
 * Check server health
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    return response.data?.ok === true;
  } catch {
    return false;
  }
}
