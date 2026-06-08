import { AIServiceProvider } from "./types"
import { DeepSeekProvider } from "./deepseek"
import { MockAIProvider } from "./wiki-name-generator"

/**
 * Returns the resolved AI Service Provider based on environment variables.
 * Fallbacks to MockAIProvider if no DEEPSEEK_API_KEY is configured.
 */
export function getAIProvider(): { provider: AIServiceProvider; isMocked: boolean } {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (apiKey && apiKey.trim() !== "" && apiKey !== "YOUR_DEEPSEEK_API_KEY") {
    return { provider: new DeepSeekProvider(apiKey), isMocked: false }
  }

  return { provider: new MockAIProvider(), isMocked: true }
}
