import { createHash } from "crypto"

/**
 * Helper to fetch with exponential backoff retry for handling rate limits (429)
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 5, initialDelay = 1500): Promise<Response> {
  let delay = initialDelay
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after")
        const parsedRetryAfter = retryAfter ? parseInt(retryAfter) : null
        
        if (parsedRetryAfter !== null && parsedRetryAfter > 10) {
          console.warn(`Rate limit reset is too far in the future (${parsedRetryAfter}s). Skipping retries to fall back immediately.`)
          break
        }
        
        const waitTime = parsedRetryAfter ? parsedRetryAfter * 1000 : delay + Math.random() * 500
        if (waitTime > 10000) {
          console.warn(`Wait time too long (${Math.round(waitTime)}ms). Skipping retries to fall back immediately.`)
          break
        }
        
        console.warn(`Rate limit hit (429). Waiting ${Math.round(waitTime)}ms before retry ${i + 1}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        delay *= 2
        continue
      }
      return response
    } catch (e: any) {
      clearTimeout(timeoutId)
      if (i === maxRetries - 1) throw e
      console.warn(`Fetch attempt failed: ${e.message || e}. Retrying...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2
    }
  }
  return fetch(url, options)
}

/**
 * Service to generate text embeddings for pgvector storage.
 */
export const EmbeddingService = {
  /**
   * Resolves the target dimension dynamically based on environment keys
   */
  getTargetDimension(): number {
    return 1536 // The pgvector table schema is defined as vector(1536).
  },

  getActiveModelName(): string {
    const voyageKey = process.env.VOYAGE_AI_API_KEY || process.env.VOYAGE_API_KEY
    if (voyageKey && voyageKey.trim() !== "" && voyageKey !== "YOUR_VOYAGE_API_KEY") {
      return "voyage-4-large"
    }
    const githubKey = process.env.GITHUB_AI_API_KEY || process.env.GITHUB_TOKEN
    if (githubKey && githubKey.trim() !== "" && githubKey !== "YOUR_GITHUB_AI_API_KEY" && githubKey !== "YOUR_GITHUB_TOKEN") {
      return "github-text-embedding-3-small"
    }
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey && openaiKey.trim() !== "" && openaiKey !== "YOUR_OPENAI_API_KEY") {
      return "text-embedding-3-small"
    }
    return "sandbox-mock-1536"
  },

  /**
   * Generates a vector embedding for the input text.
   * Utilizes Voyage AI if VOYAGE_AI_API_KEY or VOYAGE_API_KEY is configured, otherwise tries GitHub AI Models,
   * OpenAI, and finally falls back to a deterministic sandbox mock.
   */
  async generateEmbedding(text: string): Promise<{ embedding: number[]; model: string }> {
    const voyageKey = process.env.VOYAGE_AI_API_KEY || process.env.VOYAGE_API_KEY
    const githubKey = process.env.GITHUB_AI_API_KEY || process.env.GITHUB_TOKEN
    const openaiKey = process.env.OPENAI_API_KEY
    
    // 1. Try Voyage AI first
    if (voyageKey && voyageKey.trim() !== "" && voyageKey !== "YOUR_VOYAGE_API_KEY") {
      try {
        const response = await fetchWithRetry("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${voyageKey}`
          },
          body: JSON.stringify({
            input: [text],
            model: "voyage-4-large"
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          const embedding = data.data?.[0]?.embedding
          if (embedding && Array.isArray(embedding)) {
            // Pad 1024-dimension Voyage vector to 1536 dimensions to match database schema
            const padded = embedding.concat(new Array(1536 - embedding.length).fill(0))
            return { embedding: padded, model: "voyage-4-large" }
          }
        } else {
          console.warn("Voyage AI embedding API responded with error status:", response.status)
        }
      } catch (err) {
        console.warn("Voyage AI embedding API call failed. Falling back.", err)
      }
    }

    // 2. Try GitHub AI Models second
    if (githubKey && githubKey.trim() !== "" && githubKey !== "YOUR_GITHUB_AI_API_KEY" && githubKey !== "YOUR_GITHUB_TOKEN") {
      try {
        const response = await fetchWithRetry("https://models.inference.ai.azure.com/embeddings", {
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

    // 3. Fallback to OpenAI third
    if (openaiKey && openaiKey.trim() !== "" && openaiKey !== "YOUR_OPENAI_API_KEY") {
      try {
        const response = await fetchWithRetry("https://api.openai.com/v1/embeddings", {
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
    
    // Sandbox Mock Fallback: Generate a deterministic float array based on target dimension
    const targetDim = this.getTargetDimension()
    const embedding = this.generateDeterministicMock(text, targetDim)
    return { embedding, model: `sandbox-mock-${targetDim}` }
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
