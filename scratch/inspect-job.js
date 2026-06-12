const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectJob() {
  const jobId = "d6380197-fc80-4bde-83f6-de4203b01dce";
  console.log(`Inspecting job: ${jobId}`);

  const { data: job, error: jobErr } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobErr) {
    console.error("Error fetching job:", jobErr);
  } else {
    console.log("Job data:", job);
  }

  // Also let's check recent jobs
  const { data: recentJobs, error: recentErr } = await supabase
    .from('processing_jobs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5);

  if (recentErr) {
    console.error("Error fetching recent jobs:", recentErr);
  } else {
    console.log("Recent jobs:", recentJobs);
  }
}

inspectJob();
