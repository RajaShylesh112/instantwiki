import fs from "fs"
import path from "path"
import readline from "readline"
import { getBedrockOpenAIClient } from "@/services/ai/bedrock"

let _synthesisOpenAIClient: any = null;
export function getSynthesisOpenAIClient() {
  if (_synthesisOpenAIClient) return _synthesisOpenAIClient
  _synthesisOpenAIClient = getBedrockOpenAIClient()
  return _synthesisOpenAIClient
}

export function getPricingFilePath(): string {
  const paths = [
    path.join(process.cwd(), 'pricing.json'),
    path.join(process.cwd(), 'apps', 'web', 'pricing.json'),
    path.join(__dirname, 'pricing.json'),
    path.join(__dirname, '..', '..', 'pricing.json')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'pricing.json');
}

export function loadPricingFile(): Record<string, { input: number; output: number }> {
  try {
    const filePath = getPricingFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    // Silent fallback
  }
  return {};
}

export function savePricingFile(pricing: Record<string, { input: number; output: number }>) {
  try {
    const filePath = getPricingFilePath();
    fs.writeFileSync(filePath, JSON.stringify(pricing, null, 2), 'utf8');
  } catch (err) {
    console.warn("[Pricing Config] Failed to save pricing.json:", err);
  }
}

export async function promptUserForRate(modelName: string): Promise<{ input: number; output: number } | null> {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    return null;
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`\n>>> [Pricing Setup] Rate not found for model: "${modelName}"`);
    rl.question(`Enter INPUT rate per million tokens (e.g. 0.15): `, (inputStr) => {
      rl.question(`Enter OUTPUT rate per million tokens (e.g. 0.60): `, (outputStr) => {
        rl.close();
        
        const inputRate = parseFloat(inputStr.trim());
        const outputRate = parseFloat(outputStr.trim());
        
        if (!isNaN(inputRate) && !isNaN(outputRate)) {
          resolve({ input: inputRate / 1000000, output: outputRate / 1000000 });
        } else {
          console.warn("Invalid rates entered. Using 0.");
          resolve({ input: 0, output: 0 });
        }
      });
    });
  });
}

export async function getModelRate(modelName: string): Promise<{ input: number; output: number }> {
  const sanitizedModel = modelName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const envInput = process.env[`RATE_${sanitizedModel}_INPUT`] || process.env.RATE_DEFAULT_INPUT;
  const envOutput = process.env[`RATE_${sanitizedModel}_OUTPUT`] || process.env.RATE_DEFAULT_OUTPUT;
  
  if (envInput && envOutput) {
    return { input: parseFloat(envInput), output: parseFloat(envOutput) };
  }
  
  const pricing = loadPricingFile();
  if (pricing[modelName]) {
    return pricing[modelName];
  }
  
  for (const key of Object.keys(pricing)) {
    if (modelName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(modelName.toLowerCase())) {
      return pricing[key];
    }
  }

  const prompted = await promptUserForRate(modelName);
  if (prompted) {
    pricing[modelName] = prompted;
    savePricingFile(pricing);
    return prompted;
  }

  console.warn(`[Cost Tracker] Rate not found for model: "${modelName}" and terminal is non-interactive. Defaulting to 0.`);
  return { input: 0, output: 0 };
}

export async function extractCostFromResponse(modelName: string, responseObj: any, headers?: any): Promise<number> {
  if (headers) {
    const getHeader = (name: string) => {
      if (typeof headers.get === 'function') {
        return headers.get(name);
      }
      return headers[name] || headers[name.toLowerCase()];
    };

    const costHeaders = [
      'x-api-cost',
      'x-mantle-cost',
      'x-credits-charged',
      'x-request-cost',
      'x-price',
      'x-cost',
      'x-total-cost',
      'x-openai-cost',
      'x-ms-billing-cost'
    ];

    for (const h of costHeaders) {
      const val = getHeader(h);
      if (val) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) return parsed;
      }
    }

    const inputRateHeader = getHeader('x-price-input') || getHeader('x-rate-input') || getHeader('x-input-rate') || getHeader('x-price-input-million') || getHeader('x-rate-input-million');
    const outputRateHeader = getHeader('x-price-output') || getHeader('x-rate-output') || getHeader('x-output-rate') || getHeader('x-price-output-million') || getHeader('x-rate-output-million');

    if (inputRateHeader && outputRateHeader && responseObj?.usage) {
      const promptTokens = responseObj.usage.prompt_tokens || 0;
      const completionTokens = responseObj.usage.completion_tokens || 0;
      
      let inputRate = parseFloat(inputRateHeader);
      let outputRate = parseFloat(outputRateHeader);
      
      if (inputRateHeader.includes('million') || inputRate > 0.001) {
        inputRate = inputRate / 1000000;
      }
      if (outputRateHeader.includes('million') || outputRate > 0.001) {
        outputRate = outputRate / 1000000;
      }

      if (!isNaN(inputRate) && !isNaN(outputRate)) {
        return (promptTokens * inputRate) + (completionTokens * outputRate);
      }
    }
  }

  if (responseObj) {
    const bodyCost = responseObj.cost ?? 
                     responseObj.price ?? 
                     responseObj.usage?.cost ?? 
                     responseObj.usage?.price;
    if (bodyCost !== undefined && bodyCost !== null) {
      const parsed = typeof bodyCost === 'number' ? bodyCost : parseFloat(bodyCost);
      if (!isNaN(parsed)) return parsed;
    }
  }

  if (responseObj?.usage) {
    const promptTokens = responseObj.usage.prompt_tokens || 0;
    const completionTokens = responseObj.usage.completion_tokens || 0;
    const rate = await getModelRate(modelName);
    return (promptTokens * rate.input) + (completionTokens * rate.output);
  }

  return 0;
}

class CostTrackerImpl {
  private totalCost = 0;
  private totalCalls = 0;
  private totalTokens = 0;
  private detailLogs: string[] = [];

  reset() {
    this.totalCost = 0;
    this.totalCalls = 0;
    this.totalTokens = 0;
    this.detailLogs = [];
  }

  async trackResponse(model: string, responseObj: any, headers?: any) {
    this.totalCalls++;
    const promptTokens = responseObj?.usage?.prompt_tokens || 0;
    const completionTokens = responseObj?.usage?.completion_tokens || 0;
    const totalTokens = responseObj?.usage?.total_tokens || (promptTokens + completionTokens);
    this.totalTokens += totalTokens;

    const cost = await extractCostFromResponse(model, responseObj, headers);
    this.totalCost += cost;

    this.detailLogs.push(
      `- ${model} | Cost: $${cost.toFixed(6)} | Tokens: ${totalTokens} (Prompt: ${promptTokens}, Completion: ${completionTokens})`
    );
  }

  getSummary() {
    return {
      totalCost: this.totalCost,
      totalCalls: this.totalCalls,
      totalTokens: this.totalTokens,
      logs: this.detailLogs
    };
  }

  formatSummary(): string {
    return `
======================================================
               GENERATION COST REPORT                 
======================================================
  Total Calls: ${this.totalCalls}
  Total Tokens: ${this.totalTokens.toLocaleString()}
  
  Details:
${this.detailLogs.length > 0 ? this.detailLogs.map(l => "  " + l).join('\n') : "  - No calls tracked"}

------------------------------------------------------
  TOTAL GENERATION COST: $${this.totalCost.toFixed(6)}
======================================================
`;
  }
}

export const CostTracker = new CostTrackerImpl();

export async function callBedrockProviderJson(prompt: string, retries = 3, delay = 1500): Promise<any> {
  const client = getSynthesisOpenAIClient()
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let response: any
      let headers: any
      
      try {
        const responseWithHeaders = await client.chat.completions.create({
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
        }).withResponse()
        
        response = responseWithHeaders.data
        headers = responseWithHeaders.response.headers
      } catch (err) {
        response = await client.chat.completions.create({
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
        })
      }
      
      await CostTracker.trackResponse("openai.gpt-oss-120b", response, headers)
      
      const contentText = response.choices[0]?.message?.content
      if (!contentText) {
        throw new Error("Empty message content returned by Bedrock OpenAI.")
      }

      let parsed: any
      try {
        parsed = JSON.parse(contentText.trim())
      } catch (jsonErr) {
        const match = contentText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
          parsed = JSON.parse(match[1].trim())
        } else {
          throw jsonErr
        }
      }
      return parsed
    } catch (err: any) {
      console.warn(`[OpenAI Bedrock JSON Error] Attempt ${attempt} failed: ${err.message || err}`)
      
      const isAuthError = err.status === 401 || err.message?.includes("expired") || err.message?.includes("security token")
      if (attempt === retries || isAuthError) {
        const githubKey = process.env.GITHUB_AI_API_KEY || process.env.GITHUB_TOKEN
        if (githubKey && githubKey.trim() !== "" && githubKey !== "YOUR_GITHUB_AI_API_KEY" && githubKey !== "YOUR_GITHUB_TOKEN") {
          console.warn("[Synthesis Pipeline] Bedrock JSON failed. Falling back to GitHub AI Models (gpt-4o-mini)...")
          try {
            const fallbackClient = new (await import("openai")).default({
              apiKey: githubKey,
              baseURL: "https://models.inference.ai.azure.com"
            })
            
            let response: any
            let headers: any
            
            try {
              const responseWithHeaders = await fallbackClient.chat.completions.create({
                model: "gpt-4o-mini",
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
                response_format: { type: "json_object" }
              }).withResponse()
              
              response = responseWithHeaders.data
              headers = responseWithHeaders.response.headers
            } catch (err) {
              response = await fallbackClient.chat.completions.create({
                model: "gpt-4o-mini",
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
                response_format: { type: "json_object" }
              })
            }
            
            await CostTracker.trackResponse("gpt-4o-mini", response, headers)
            
            const contentText = response.choices[0]?.message?.content
            if (contentText) {
              return JSON.parse(contentText.trim())
            }
          } catch (fallbackErr: any) {
            console.error("[Synthesis Pipeline] GitHub AI Models JSON fallback also failed:", fallbackErr.message || fallbackErr)
          }
        }
        
        if (attempt === retries) throw err
      }
      
      console.warn(`Retrying Bedrock JSON in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2
    }
  }
}

export async function callBedrockProviderText(prompt: string, retries = 3, delay = 1500): Promise<string> {
  const client = getSynthesisOpenAIClient()
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let response: any
      let headers: any
      
      try {
        const responseWithHeaders = await client.chat.completions.create({
          model: "openai.gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are a professional documentation assistant. Respond with the requested summary text directly.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.5,
        }).withResponse()
        
        response = responseWithHeaders.data
        headers = responseWithHeaders.response.headers
      } catch (err) {
        response = await client.chat.completions.create({
          model: "openai.gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are a professional documentation assistant. Respond with the requested summary text directly.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.5,
        })
      }
      
      await CostTracker.trackResponse("openai.gpt-oss-120b", response, headers)
      
      const contentText = response.choices[0]?.message?.content || ""
      return contentText.trim()
    } catch (err: any) {
      console.warn(`[OpenAI Bedrock Text Error] Attempt ${attempt} failed: ${err.message || err}`)
      
      const isAuthError = err.status === 401 || err.message?.includes("expired") || err.message?.includes("security token")
      if (attempt === retries || isAuthError) {
        const githubKey = process.env.GITHUB_AI_API_KEY || process.env.GITHUB_TOKEN
        if (githubKey && githubKey.trim() !== "" && githubKey !== "YOUR_GITHUB_AI_API_KEY" && githubKey !== "YOUR_GITHUB_TOKEN") {
          console.warn("[Synthesis Pipeline] Bedrock Text failed. Falling back to GitHub AI Models (gpt-4o-mini)...")
          try {
            const fallbackClient = new (await import("openai")).default({
              apiKey: githubKey,
              baseURL: "https://models.inference.ai.azure.com"
            })
            
            let response: any
            let headers: any
            
            try {
              const responseWithHeaders = await fallbackClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: "You are a professional documentation assistant. Respond with the requested summary text directly.",
                  },
                  {
                    role: "user",
                    content: prompt,
                  },
                ],
                temperature: 0.5,
              }).withResponse()
              
              response = responseWithHeaders.data
              headers = responseWithHeaders.response.headers
            } catch (err) {
              response = await fallbackClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: "You are a professional documentation assistant. Respond with the requested summary text directly.",
                  },
                  {
                    role: "user",
                    content: prompt,
                  },
                ],
                temperature: 0.5,
              })
            }
            
            await CostTracker.trackResponse("gpt-4o-mini", response, headers)
            
            const contentText = response.choices[0]?.message?.content || ""
            return contentText.trim()
          } catch (fallbackErr: any) {
            console.error("[OpenAI Bedrock Text Fallback] GitHub AI Models also failed:", fallbackErr.message || fallbackErr)
          }
        }
        
        if (attempt === retries) throw err
      }
      
      console.warn(`Retrying Bedrock Text in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2
    }
  }
  return ""
}

export function rerankChunks(chunks: any[], pageTitle: string, keywords: string[]): any[] {
  const titleWords = pageTitle
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2 && !["the", "and", "for", "with", "from", "that", "this"].includes(w))

  const scored = chunks.map(chunk => {
    const similarity = chunk.similarity || 0.0
    const contentLower = chunk.content.toLowerCase()
    const headingLower = (chunk.heading || "").toLowerCase()
    const sectionLower = (chunk.section || "").toLowerCase()
    const titleLower = pageTitle.toLowerCase()

    // 1. Heading Match (0.2 weight)
    let headingMatch = 0.0
    if (headingLower && (titleLower.includes(headingLower) || headingLower.includes(titleLower))) {
      headingMatch = 1.0
    } else if (sectionLower && (titleLower.includes(sectionLower) || sectionLower.includes(titleLower))) {
      headingMatch = 0.5
    }

    // 2. Keyword Match (0.1 weight)
    let keywordMatch = 0.0
    if (keywords.length > 0) {
      let matches = 0
      for (const kw of keywords) {
        if (kw && contentLower.includes(kw.toLowerCase())) {
          matches++
        }
      }
      keywordMatch = Math.min(1.0, matches / Math.max(1, keywords.length))
    }

    // Combined Math: final_score = 0.7 * similarity + 0.2 * headingMatch + 0.1 * keywordMatch
    const finalScore = 0.7 * similarity + 0.2 * headingMatch + 0.1 * keywordMatch

    return { ...chunk, rerankScore: finalScore }
  })

  scored.sort((a, b) => b.rerankScore - a.rerankScore)
  return scored
}

export function generateMockWikiPage(title: string, pageType: string, parentTitle?: string, chunks?: any[]) {
  if (chunks && chunks.length > 0) {
    const overviewText = chunks[0]?.content || ""
    const explanationText = chunks.slice(1, Math.min(4, chunks.length)).map(c => c.content).join("\n\n")
    const examplesText = chunks.slice(4, Math.min(7, chunks.length)).map(c => c.content).join("\n\n")
    
    if (pageType === "ROOT") {
      return {
        summary: `Comprehensive introductory overview covering ${title}.`,
        body: `### Overview\n${overviewText}\n\n### Detailed Analysis\n${explanationText}`
      }
    } else if (pageType === "TOPIC") {
      return {
        summary: `Detailed handbook guide covering ${title}.`,
        body: `### Overview\n${overviewText}\n\n### Detailed Explanation\n${explanationText || "Further details from source documents."}\n\n### Key Concepts & Examples\n${examplesText || "Case studies and references from source documents."}`
      }
    } else {
      return {
        summary: `Detailed explanation of ${title}.`,
        body: `### Detailed Explanation\n${overviewText}\n\n${explanationText}\n\n### Examples & Case Studies\n${examplesText}`
      }
    }
  }

  if (pageType === "ROOT") {
    return {
      summary: `Comprehensive introductory overview article for the workspace: ${title}.`,
      body: `### Overview\nThis overview documents the core systems, architecture, and principles of **${title}**, serving as the primary hub page of the wiki.`
    }
  } else if (pageType === "TOPIC") {
    return {
      summary: `Detailed handbook guide and technical breakdown covering ${title}.`,
      body: `### Overview\nThis section covers the core performance metrics of **${title}**.\n\n### Key Concepts\n- **Term definitions**: Outlining the primary definitions of **${title}**.\n\n### Detailed Explanation\nTechnical step-by-step description of system mechanics.\n\n### Examples\nSpecific case studies and tests mapped under the domain.`
    }
  } else {
    return {
      summary: `Detailed technical explanation of ${title}.`,
      body: `### Detailed Explanation\nAn exhaustive technical breakdown of **${title}**.\n\n### Examples\nPractical examples and calculations of the subtopic.`
    }
  }
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage))
    }, ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}

