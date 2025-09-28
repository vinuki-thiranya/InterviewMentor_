import Vapi from "@vapi-ai/web";

// Get the API token from environment variables
const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

// Debug: Log the API key to console (remove this in production)
console.log("VAPI API Key:", vapiToken ? `${vapiToken.substring(0, 8)}...` : "NOT FOUND");

// Validate that the API key exists and has correct format for client-side usage
if (!vapiToken) {
  console.error("VAPI API Key not found in environment variables!");
  throw new Error("VAPI_WEB_TOKEN is required");
}

// Log successful key loading
console.log("✅ VAPI public key loaded successfully");

export const vapi = new Vapi(vapiToken);