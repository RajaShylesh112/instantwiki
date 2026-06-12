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
    const wikis = await makeRequest("wikis");
    const bikeWiki = wikis.find(w => w.slug.includes("bike"));
    if (!bikeWiki) {
      console.log("No bike bench wiki found.");
      return;
    }
    console.log(`Checking Wiki: ${bikeWiki.title} (${bikeWiki.id})`);

    console.log("\nFetching processing jobs...");
    const jobs = await makeRequest("processing_jobs", "*", `&wiki_id=eq.${bikeWiki.id}&order=started_at.desc`);
    console.log(`Found ${jobs.length} jobs:`);
    jobs.forEach(j => {
      console.log(`- Job ID: ${j.id}, Status: ${j.status}, Step: ${j.current_step}, Error: ${j.error}, Started At: ${j.started_at}, Finished At: ${j.finished_at}`);
    });

    console.log("\nFetching wiki pages...");
    const pages = await makeRequest("wiki_pages", "*", `&wiki_id=eq.${bikeWiki.id}`);
    console.log(`Found ${pages.length} pages:`);
    pages.forEach(p => {
      console.log(`- Page ID: ${p.id}, Title: ${p.title}, Slug: ${p.slug}, Status: ${p.generation_status}`);
    });
  } catch (err) {
    console.error("Error checking jobs/pages:", err);
  }
}

check();
