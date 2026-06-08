import { AiWikiSuggestion } from "@/lib/validation/wiki"

export interface AIServiceProvider {
  /**
   * Generates 5 wiki title, slug, and description suggestions based on a topic and description.
   */
  generateWikiNames(topic: string, description: string): Promise<AiWikiSuggestion[]>
}
