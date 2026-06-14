import { AIServiceProvider } from "./types"
import { AiWikiSuggestion, aiNameSuggestionsSchema } from "@/lib/validation/wiki"

export class MistralProvider implements AIServiceProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
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
}`

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
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
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`Mistral API responded with HTTP status ${response.status}`)
      }

      const rawData = await response.json()
      const content = rawData.choices?.[0]?.message?.content
      if (!content) {
        throw new Error("Empty message content returned by Mistral API.")
      }

      // Parse and validate using Zod
      const parsed = JSON.parse(content)
      const validated = aiNameSuggestionsSchema.parse(parsed)
      
      return validated.names
    } catch (err) {
      console.error("Mistral generateWikiNames error:", err)
      throw new Error(`AI generation failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
