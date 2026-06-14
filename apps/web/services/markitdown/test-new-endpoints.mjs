/**
 * Test script for the new MarkItDown service endpoints
 */

const BASE_URL = "http://127.0.0.1:5100"

async function testEndpoint(name, url, options = {}) {
  console.log(`\n[TEST] ${name}`)
  console.log(`  URL: ${url}`)
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    console.log(`  Status: ${response.status} ${response.ok ? "✓" : "✗"}`)
    console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 500))
    return { success: response.ok, data }
  } catch (err) {
    console.log(`  Error: ${err.message}`)
    return { success: false, error: err.message }
  }
}

async function main() {
  console.log("=".repeat(60))
  console.log("Testing New MarkItDown Service Endpoints")
  console.log("=".repeat(60))

  // Test /health
  await testEndpoint(
    "Health Check",
    `${BASE_URL}/health`,
    { method: "GET" }
  )

  // Test /info
  await testEndpoint(
    "Service Info",
    `${BASE_URL}/info`,
    { method: "GET" }
  )

  // Test /formats
  await testEndpoint(
    "Supported Formats",
    `${BASE_URL}/formats`,
    { method: "GET" }
  )

  console.log("\n" + "=".repeat(60))
  console.log("All endpoint tests completed!")
  console.log("=".repeat(60))
}

main().catch(console.error)
