import { callBedrockProviderText } from "./utils"

export async function generateAggregatedDocumentSummary(chunks: any[]): Promise<string> {
  if (chunks.length === 0) return "Empty document."
  
  console.log(`[Synthesis Pipeline] Phase 4: Generating individual summaries for representative chunks (total chunks: ${chunks.length})...`)

  // Select up to 8 representative chunks spread evenly to respect rate limits
  const maxChunksToSummarize = 8
  const step = Math.max(1, Math.floor(chunks.length / maxChunksToSummarize))
  const chunksToSummarize = chunks.filter((_, idx) => idx % step === 0).slice(0, maxChunksToSummarize)

  const chunkSummaries: string[] = new Array(chunksToSummarize.length).fill("")
  const concurrency = 2 // Low concurrency to stay under rate limits
  
  for (let i = 0; i < chunksToSummarize.length; i += concurrency) {
    const group = chunksToSummarize.slice(i, i + concurrency)
    const promises = group.map(async (chunk, idx) => {
      const chunkIndex = i + idx
      const prompt = `Summarize this chunk in 2 sentences.
      
      Chunk:
      ${chunk.content}
      
      Summary:`
      
      try {
        const summaryText = await callBedrockProviderText(prompt)
        if (summaryText && summaryText.trim()) {
          chunkSummaries[chunkIndex] = summaryText.trim()
        }
      } catch (err) {
        console.error(`Error generating summary for representative chunk index ${chunkIndex}:`, err)
        // Fallback: use first 2 sentences of the chunk content
        const sentences = chunk.content.split(/[.!?]\s+/)
        chunkSummaries[chunkIndex] = sentences.slice(0, 2).join(". ") + "."
      }
    })
    
    await Promise.all(promises)
    if (i + concurrency < chunksToSummarize.length) {
      await new Promise(resolve => setTimeout(resolve, 1500)) // Throttle to stay safe
    }
  }

  // Filter valid chunk summaries
  const validChunkSummaries = chunkSummaries.filter(s => s && s.trim())
  if (validChunkSummaries.length === 0) {
    return "Summary unavailable."
  }

  console.log(`[Synthesis Pipeline] Phase 5: Generating Master Document Summary by combining ${validChunkSummaries.length} summaries...`)

  // Step 2: Combine all chunk summaries to create the Master Document Summary (Phase 5)
  const combinedSummariesText = validChunkSummaries.join("\n\n")
  const masterPrompt = `Combine all summaries.
  
  Identify:
  - themes
  - concepts
  - chapters
  - relationships
  
  Summaries:
  ${combinedSummariesText}
  
  Master Document Summary:`

  try {
    const masterSummary = await callBedrockProviderText(masterPrompt)
    return masterSummary.trim() || validChunkSummaries.join("\n")
  } catch (err) {
    console.error("Error generating Master Document Summary:", err)
    return validChunkSummaries.join("\n")
  }
}
