const supabaseUrl = process.env.SUPABASE_URL || "https://vecsyzkkqlbrobjjgkgd.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function makeRequest(table) {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*`;
  const response = await fetch(url, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  });
  return response.json();
}

async function run() {
  try {
    const wikis = await makeRequest("wikis");
    console.log("Wikis in DB:", wikis);
  } catch (e) {
    console.error(e);
  }
}

run();
