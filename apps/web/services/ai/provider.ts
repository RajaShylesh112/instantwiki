import { AIServiceProvider } from "./types"
import { BedrockProvider } from "./bedrock"
import { MistralProvider } from "./mistral"
import { MockAIProvider } from "./wiki-name-generator"

/**
 * Returns the resolved AI Service Provider based on environment variables.
 * Fallbacks to MistralProvider, then to MockAIProvider.
 */
export function getAIProvider(): { provider: AIServiceProvider; isMocked: boolean } {
  const awsBearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK
  if (awsBearerToken && awsBearerToken.trim() !== "" && awsBearerToken !== "YOUR_AWS_BEARER_TOKEN_BEDROCK") {
    return { provider: new BedrockProvider(awsBearerToken), isMocked: false }
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey && openaiKey.trim() !== "" && openaiKey !== "YOUR_OPENAI_API_KEY") {
    return { provider: new BedrockProvider(openaiKey), isMocked: false }
  }

  const bedrockKey = process.env.BEDROCK_AI_API_KEY
  if (bedrockKey && bedrockKey.trim() !== "" && bedrockKey !== "YOUR_BEDROCK_AI_API_KEY") {
    return { provider: new BedrockProvider(bedrockKey), isMocked: false }
  }

  const mistralKey = process.env.MISTRAL_AI_API_KEY
  if (mistralKey && mistralKey.trim() !== "" && mistralKey !== "YOUR_MISTRAL_AI_API_KEY") {
    return { provider: new MistralProvider(mistralKey), isMocked: false }
  }

  return { provider: new MockAIProvider(), isMocked: true }
}
