import { AIServiceProvider } from "./types"
import { AiWikiSuggestion } from "@/lib/validation/wiki"

export class MockAIProvider implements AIServiceProvider {
  async generateWikiNames(topic: string, description: string): Promise<AiWikiSuggestion[]> {
    // Artificial loading state delay to simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Derive a clean base topic and base slug
    const cleanTopic = topic.trim() || "Knowledge Hub"
    const baseSlug = cleanTopic
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-") || "knowledge-hub"

    // Custom-generated responses to feel alive
    return [
      {
        title: `${cleanTopic} Atlas`,
        slug: `${baseSlug}-atlas`,
        description: `A structured conceptual directory mapping all core branches, paradigms, and subfields of ${cleanTopic}.`,
      },
      {
        title: `${cleanTopic} Handbook`,
        slug: `${baseSlug}-handbook`,
        description: `A comprehensive reference manual and guide outlining foundational workflows, principles, and rules in ${cleanTopic}.`,
      },
      {
        title: `${cleanTopic} Notes`,
        slug: `${baseSlug}-notes`,
        description: `An organized repository compiling study outlines, reference notes, and cheat-sheets in ${cleanTopic}.`,
      },
      {
        title: `${cleanTopic} Compendium`,
        slug: `${baseSlug}-compendium`,
        description: `A detailed, academic reference repository aggregating definitions, structures, and systems of ${cleanTopic}.`,
      },
      {
        title: `The ${cleanTopic} Index`,
        slug: `the-${baseSlug}-index`,
        description: `A cataloged system indexing historical paradigms, modern developments, and essential resources within ${cleanTopic}.`,
      },
    ]
  }
}
