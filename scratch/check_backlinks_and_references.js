const fs = require('fs');
const path = require('path');

// Parse .env manually
const envPath = path.join(__dirname, '../apps/web/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

async function makeRequest(table, select = "*", filter = "") {
  const url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}${filter}`;
  const response = await fetch(url, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} on ${table}`);
  }
  return response.json();
}

async function run() {
  try {
    console.log("Fetching wiki pages...");
    const pages = await makeRequest("wiki_pages", "id,title,slug");
    const pageMap = {};
    pages.forEach(p => {
      pageMap[p.id] = p;
    });

    console.log("\nFetching all page_links...");
    const links = await makeRequest("page_links", "source_page_id,target_page_id,link_type");
    console.log(`Found ${links.length} total links in page_links table:`);
    links.forEach(l => {
      const src = pageMap[l.source_page_id]?.title || l.source_page_id;
      const tgt = pageMap[l.target_page_id]?.title || l.target_page_id;
      console.log(`- [${l.link_type}] ${src} -> ${tgt}`);
    });

    console.log("\nFetching page_chunk_references counts per page...");
    const refs = await makeRequest("page_chunk_references", "page_id,chunk_id");
    
    const countMap = {};
    refs.forEach(r => {
      if (!countMap[r.page_id]) {
        countMap[r.page_id] = 0;
      }
      countMap[r.page_id] += 1;
    });

    console.log("Chunk references per page:");
    for (const [pageId, count] of Object.entries(countMap)) {
      const title = pageMap[pageId]?.title || pageId;
      console.log(`- ${title}: ${count} chunks referenced`);
    }

  } catch (err) {
    console.error("Error checking links/references:", err);
  }
}

run();
