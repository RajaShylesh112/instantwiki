import { EmbeddingService } from "@/services/ai/embeddings"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"

export async function generateAndInsertEmbeddings(
  jobId: string,
  createdChunks: any[],
  isShortcut: boolean
): Promise<{ success: boolean; canceled?: boolean }> {
  let embeddedCount = 0
  const batchSize = 10
  const embeddingsToInsert: { chunk_id: string; embedding: number[]; embedding_model: string }[] = []

  for (let i = 0; i < createdChunks.length; i += batchSize) {
    if (i % 20 === 0) {
      const activeJob = await WikiGeneratorRepository.getJobById(jobId)
      if (activeJob?.status === "FAILED") {
        console.log("Job aborted. Exiting pipeline during Embedding generation.")
        return { success: false, canceled: true }
      }
    }

    const batch = createdChunks.slice(i, i + batchSize)
    console.log(`[Synthesis Pipeline] Generating embeddings batch ${i / batchSize + 1}...`)
    const results = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const { embedding, model } = await EmbeddingService.generateEmbedding(chunk.embeddingInput)
          return { chunk_id: chunk.id, embedding, embedding_model: model }
        } catch (e) {
          console.error(`Failed to generate embedding for chunk ${chunk.id}:`, e)
          return null
        }
      })
    )

    const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null)
    embeddingsToInsert.push(...validResults)
    embeddedCount += batch.length
    
    const remainingChunks = createdChunks.length - embeddedCount
    const remainingSeconds = isShortcut 
      ? (remainingChunks * 0.02) + 5 
      : (remainingChunks * 0.05) + 12
    await WikiGeneratorRepository.updateJobStep(jobId, "EMBEDDINGS", "PROCESSING", JSON.stringify({
      total_chunks: createdChunks.length,
      embedded_chunks: embeddedCount,
      est_remaining_seconds: Math.round(remainingSeconds)
    })).catch(() => {})

    if (i + batchSize < createdChunks.length) {
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  }

  if (embeddingsToInsert.length > 0) {
    console.log(`[Synthesis Pipeline] Bulk inserting ${embeddingsToInsert.length} embeddings into DB...`)
    await WikiGeneratorRepository.insertEmbeddingsBulk(embeddingsToInsert)
  }

  return { success: true }
}
