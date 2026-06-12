const apiKey = "sk-e100c70f2a2c4b2d989f6f2750e268c7";
const wikiTitle = "Duke's Domain";
const wikiDesc = "An academic resource that rates bikes based on speed, durability, and cost-efficiency using standardized metrics.";
const chunkSnippets = "";

const topicPrompt = `Analyze the following snippets extracted from the uploaded wiki documents:

${chunkSnippets}

Discover exactly 4-6 main educational topics or conceptual chapters that should form a structured wiki site.

CRITICAL CONSTRAINTS:
1. The discovered topics MUST be directly derived from the uploaded snippets context.
2. Strictly adhere to the domain of the snippets. For example, if the snippets are about engines, the discovered topics must reflect that domain.

For each discovered topic, provide:
1. A creative title (e.g. "Introduction to Topic").
2. A URL-safe slug (alphanumeric and hyphens only, e.g. "introduction-to-topic").
3. A 1-sentence academic summary description.
4. A page_type ('ROOT' for the primary introductory page, 'TOPIC' or 'SUBTOPIC' for detailed pages).
5. A confidence score between 0.8 and 1.0.

Return your response in this exact JSON format. No markdown, no preambles:
{
  "topics": [
    {
      "title": "Topic Title",
      "slug": "topic-slug",
      "summary": "Short summary description.",
      "page_type": "TOPIC",
      "confidence_score": 0.95
    }
  ]
}`;

async function testCall() {
  try {
    console.log("Calling DeepSeek API...");
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that outputs only valid JSON matching the requested schema. Do not include markdown wraps."
          },
          {
            role: "user",
            content: topicPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const rawData = await response.json();
    console.log("Response:", rawData.choices?.[0]?.message?.content);
  } catch (err) {
    console.error("Error:", err);
  }
}

testCall();
