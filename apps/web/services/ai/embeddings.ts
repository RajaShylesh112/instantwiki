import { createHash } from "crypto"

/**
 * Service to generate text embeddings for pgvector storage.
 */
export const EmbeddingService = {
  /**
   * Generates a 1536-dimensional vector embedding for the input text.
   * Utilizes OpenAI if OPENAI_API_KEY is configured, otherwise falls back to a deterministic sandbox mock.
   */
  async generateEmbedding(text: string): Promise<{ embedding: number[]; model: string }> {
    const githubKey = process.env.GITHUB_AI_API_KEY || process.env.GITHUB_TOKEN
    const openaiKey = process.env.OPENAI_API_KEY
    
    // 1. Try GitHub AI Models first
    if (githubKey && githubKey.trim() !== "" && githubKey !== "YOUR_GITHUB_AI_API_KEY" && githubKey !== "YOUR_GITHUB_TOKEN") {
      try {
        const response = await fetch("https://models.inference.ai.azure.com/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${githubKey}`
          },
          body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small" // 1536 dimensions
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          const embedding = data.data?.[0]?.embedding
          if (embedding && Array.isArray(embedding)) {
            return { embedding, model: "github-text-embedding-3-small" }
          }
        } else {
          console.warn("GitHub AI Models embedding API responded with error status:", response.status)
        }
      } catch (err) {
        console.warn("GitHub AI Models embedding API call failed. Falling back.", err)
      }
    }

    // 2. Fallback to OpenAI second
    if (openaiKey && openaiKey.trim() !== "" && openaiKey !== "YOUR_OPENAI_API_KEY") {
      try {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small" // 1536 dimensions
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          const embedding = data.data?.[0]?.embedding
          if (embedding && Array.isArray(embedding)) {
            return { embedding, model: "text-embedding-3-small" }
          }
        }
      } catch (err) {
        console.warn("OpenAI embedding API call failed. Falling back to deterministic mock.", err)
      }
    }
    
    // Sandbox Mock Fallback: Generate a deterministic 1536 float array
    const embedding = this.generateDeterministicMock(text, 1536)
    return { embedding, model: "sandbox-mock-1536" }
  },

  /**
   * Generates a deterministic array of floats normalized between -1 and 1
   * based on the SHA-256 hash of the input text.
   */
  generateDeterministicMock(text: string, dimensions: number): number[] {
    const hash = createHash("sha256").update(text).digest()
    const vector: number[] = []
    
    for (let i = 0; i < dimensions; i++) {
      // Use bytes from the hash to create a pseudo-random value
      const byteIndex = (i * 3) % hash.length
      const seedVal = hash[byteIndex] + hash[(byteIndex + 1) % hash.length]
      
      // Calculate a value between -1.0 and 1.0
      let val = Math.sin(seedVal + i) * Math.cos(seedVal - i)
      vector.push(val)
    }
    
    // Normalize the vector (unit length) for cosine similarity queries
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector
  }
}
