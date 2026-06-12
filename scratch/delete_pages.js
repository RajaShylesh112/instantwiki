const supabaseUrl = process.env.SUPABASE_URL || "https://vecsyzkkqlbrobjjgkgd.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function makeRequest(table, method = "GET", filter = "", body = null) {
  const url = `${supabaseUrl}/rest/v1/${table}?${filter}`;
  const options = {
    method,
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} on ${table}`);
  }
  if (method === "DELETE" || response.status === 204) {
    return { success: true };
  }
  return response.json();
}

async function run() {
  try {
    const wikis = await makeRequest("wikis");
    const bikeWiki = wikis.find(w => w.slug.includes("bike"));
    if (!bikeWiki) {
      console.log("No bike bench wiki found.");
      return;
    }
    console.log(`Found BikeBench wiki ID: ${bikeWiki.id}. Deleting all associated wiki pages...`);
    const deleteResult = await makeRequest("wiki_pages", "DELETE", `wiki_id=eq.${bikeWiki.id}`);
    console.log("Deletion result:", deleteResult);
    
    // Verify pages list
    const pages = await makeRequest("wiki_pages");
    console.log(`Verified remaining pages in DB: ${pages.length}`);
  } catch (err) {
    console.error("Error running script:", err);
  }
}

run();
