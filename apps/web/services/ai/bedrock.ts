import OpenAI from "openai";
import { AIServiceProvider } from "./types";
import { AiWikiSuggestion, aiNameSuggestionsSchema } from "@/lib/validation/wiki";

/**
 * Creates and configures an OpenAI client instance targeting the Bedrock Mantle gateway.
 */
export function getBedrockOpenAIClient(): OpenAI {
  const apiKey = process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || "https://bedrock-mantle.us-east-1.api.aws/v1";
  if (!apiKey) {
    throw new Error("No OPENAI_API_KEY or AWS_BEARER_TOKEN_BEDROCK configured.");
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });
}

export class BedrockProvider implements AIServiceProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_BASE_URL || "https://bedrock-mantle.us-east-1.api.aws/v1",
    });
  }

  async generateWikiNames(topic: string, description: string): Promise<AiWikiSuggestion[]> {
    const prompt = `You are a professional documentation architect. Generate exactly 5 structured wiki website ideas based on the following input:

Input Topic: "${topic}"
Input Description: "${description || "None provided"}"

Provide 5 options, each containing a creative name title (max 50 chars), a URL-safe lowercase slug (alphanumeric and hyphens only, e.g. "machine-learning"), and a short academic description (max 200 chars).

You MUST respond with a JSON object in this exact schema:
{
  "names": [
    {
      "title": "Title Here",
      "slug": "slug-here",
      "description": "Short description here"
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: "openai.gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that outputs only valid JSON matching the requested schema. No markdown backticks, no chat preamble.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const contentText = response.choices[0]?.message?.content;
      if (!contentText) {
        throw new Error("Empty message content returned by OpenAI API.");
      }

      // Robustly extract JSON (in case model outputs markdown-wrapped JSON)
      let parsed: any;
      try {
        parsed = JSON.parse(contentText.trim());
      } catch (jsonErr) {
        const match = contentText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          parsed = JSON.parse(match[1].trim());
        } else {
          throw jsonErr;
        }
      }

      const validated = aiNameSuggestionsSchema.parse(parsed);
      return validated.names;
    } catch (err) {
      console.error("OpenAI Bedrock generateWikiNames error:", err);
      throw new Error(`AI generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
