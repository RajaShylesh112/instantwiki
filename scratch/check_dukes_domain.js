const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || "https://vecsyzkkqlbrobjjgkgd.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    console.log("Checking wiki 'dukes-domain'...");
    const { data: wikis, error: wikiErr } = await supabase
      .from("wikis")
      .select("*")
      .eq("slug", "dukes-domain");

    if (wikiErr) {
      console.error("Error fetching wikis:", wikiErr);
      return;
    }
    console.log("Wikis found:", wikis);

    if (!wikis || wikis.length === 0) {
      console.log("No wiki found with slug 'dukes-domain'");
      return;
    }

    const wiki = wikis[0];
    const wikiId = wiki.id;

    // Fetch documents
    const { data: documents, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("wiki_id", wikiId);
    console.log("\nDocuments found:", documents);

    // Fetch processing jobs
    const { data: jobs, error: jobErr } = await supabase
      .from("processing_jobs")
      .select("*")
      .eq("wiki_id", wikiId)
      .order("created_at", { ascending: false });
    console.log("\nProcessing Jobs:", jobs);

    // Fetch wiki pages
    const { data: pages, error: pageErr } = await supabase
      .from("wiki_pages")
      .select("*")
      .eq("wiki_id", wikiId);
    console.log("\nWiki Pages count:", pages ? pages.length : 0);
    if (pages) {
      pages.forEach(p => {
        console.log(`- Page ID: ${p.id}, Title: "${p.title}", Slug: "${p.slug}", Status: ${p.generation_status}, Page Type: ${p.page_type}`);
      });
    }
  } catch (err) {
    console.error("Uncaught error:", err);
  }
}

check();
