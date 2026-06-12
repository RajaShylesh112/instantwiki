const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const supabaseUrl = process.env.SUPABASE_URL || "https://vecsyzkkqlbrobjjgkgd.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const storagePath = "global/0c76447c1a9f348a80430f1567bd1afb333182b858edd42b2a3f10a075b3780c/2019-OffRoad-Challenge-125-Duke.pdf";

async function downloadAndExtract() {
  try {
    const url = `${supabaseUrl}/storage/v1/object/documents/${storagePath}`;
    const response = await fetch(url, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const tempPdfPath = path.join(__dirname, "test-temp.pdf");
    fs.writeFileSync(tempPdfPath, buffer);

    const outputImageDir = path.join(os.tmpdir(), "test-extracted-images");
    const scriptPath = path.join(__dirname, "..", "apps", "web", "lib", "python", "extractor.py");

    const child = spawn("python", [scriptPath, tempPdfPath, outputImageDir]);

    let stdoutData = "";
    child.stdout.on("data", (data) => { stdoutData += data.toString(); });

    child.on("close", (code) => {
      try { fs.unlinkSync(tempPdfPath); } catch (e) {}
      if (code !== 0) return;

      try {
        const parsed = JSON.parse(stdoutData.trim());
        console.log("Pages text lengths:");
        parsed.pages.forEach(p => {
          console.log(`- Page ${p.page_number}: ${p.text.trim().length} chars`);
          if (p.text.trim().length > 0) {
            console.log(`  Preview: "${p.text.trim().substring(0, 100)}"`);
          }
        });
      } catch (e) {
        console.error(e);
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

downloadAndExtract();
