const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PdfExtractorService = {
  async extractPdf(pdfPath, pageLimit) {
    return new Promise((resolve, reject) => {
      let scriptPath = path.join(process.cwd(), "lib", "python", "extractor.py")
      if (!fs.existsSync(scriptPath)) {
        const fallbackPath = path.join(process.cwd(), "apps", "web", "lib", "python", "extractor.py")
        if (fs.existsSync(fallbackPath)) {
          scriptPath = fallbackPath
        }
      }
      
      let rootDir = process.cwd()
      let venvDir = ""
      
      if (fs.existsSync(path.join(rootDir, "services", "markitdown", ".venv"))) {
        venvDir = path.join(rootDir, "services", "markitdown", ".venv")
      } else if (fs.existsSync(path.join(rootDir, "apps", "web", "services", "markitdown", ".venv"))) {
        venvDir = path.join(rootDir, "apps", "web", "services", "markitdown", ".venv")
      } else if (fs.existsSync(path.join(rootDir, "..", "..", "apps", "web", "services", "markitdown", ".venv"))) {
        venvDir = path.resolve(rootDir, "..", "..", "apps", "web", "services", "markitdown", ".venv")
      }
      
      let pythonCmd = process.platform === "win32" ? "python" : "python3"
      if (venvDir && fs.existsSync(venvDir)) {
        pythonCmd = process.platform === "win32"
          ? path.join(venvDir, "Scripts", "python.exe")
          : path.join(venvDir, "bin", "python")
      }
      
      console.log("Using pythonCmd:", pythonCmd);
      console.log("Using scriptPath:", scriptPath);
      console.log("Venv exists:", fs.existsSync(venvDir), "at:", venvDir);
      
      const args = [scriptPath, pdfPath, "dummy-dir"]
      if (pageLimit !== undefined) {
        args.push(String(pageLimit))
      }
      
      const child = spawn(pythonCmd, args)
      
      let stdoutData = ""
      let stderrData = ""
      
      const timeoutId = setTimeout(() => {
        console.error("Python PDF extractor process timed out. Terminating...")
        child.kill()
        reject(new Error("PDF extraction timed out after 60 seconds."))
      }, 60000)

      child.stdout.on("data", (data) => {
        stdoutData += data.toString()
      })
      
      child.stderr.on("data", (data) => {
        stderrData += data.toString()
      })
      
      child.on("error", (err) => {
        clearTimeout(timeoutId)
        console.error("Failed to start Python child process:", err)
        reject(err)
      })

      child.on("close", (code) => {
        clearTimeout(timeoutId)
        if (code !== 0) {
          console.error("Python PDF extractor script failed with code", code)
          console.error("Stderr:", stderrData)
          reject(new Error(`PDF extraction failed with code ${code}: ${stderrData || "Unknown error"}`))
          return
        }
        
        try {
          const firstBrace = stdoutData.indexOf("{")
          const lastBrace = stdoutData.lastIndexOf("}")
          
          if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
            console.error("No JSON object found in stdout. Raw stdout:", stdoutData)
            reject(new Error("No JSON object found in extraction output."))
            return
          }
          
          const jsonStr = stdoutData.substring(firstBrace, lastBrace + 1)
          const parsed = JSON.parse(jsonStr)
          
          if (!parsed.success) {
            reject(new Error(parsed.error || "Failed to extract PDF details."))
            return
          }
          
          resolve({
            pages: parsed.pages || [],
            images: []
          })
        } catch (err) {
          console.error("Failed to parse stdout JSON from Python parser. Raw stdout:", stdoutData)
          reject(new Error("Failed to parse extraction output."))
        }
      })
    })
  }
};

const samplePdf = "C:\\Users\\rsmgo\\Downloads\\264600a853.pdf";
PdfExtractorService.extractPdf(samplePdf)
  .then(res => {
    console.log("Success! Number of pages:", res.pages.length);
    console.log("First page text snippet:", res.pages[0]?.text?.substring(0, 200));
  })
  .catch(err => {
    console.error("Error running extractor service:", err);
  });
