const supabaseUrl = process.env.SUPABASE_URL || "https://vecsyzkkqlbrobjjgkgd.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function check() {
  try {
    console.log("Fetching all wiki pages...");
    const pages = await makeRequest("wiki_pages");
    console.log(`Total wiki pages in DB: ${pages.length}`);
    pages.forEach(p => {
      console.log(`- Page ID: ${p.id}, Wiki ID: ${p.wiki_id}, Title: ${p.title}, Slug: ${p.slug}, Status: ${p.generation_status}`);
    });
  } catch (err) {
    console.error("Error checking db:", err);
  }
}

check();
