import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import os from "os"

export interface ExtractedBlock {
  type: "text" | "heading" | "table"
  content: string
  level?: number
  table_data?: {
    headers: string[]
    rows: any[][]
    markdown: string
  }
}

export interface ExtractedPage {
  page_number: number
  text: string
  blocks?: ExtractedBlock[]
}

export interface ExtractedImage {
  page_number: number
  filename: string
  width: number
  height: number
  ext: string
  localPath: string
  caption?: string | null
}

export interface ExtractedPdfResult {
  pages: ExtractedPage[]
  images: ExtractedImage[]
}

export const PdfExtractorService = {
  /**
   * Run the python parser script on a PDF file path.
   * Returns text page-by-page and saved image assets.
   */
  async extractPdf(pdfPath: string, pageLimit?: number): Promise<ExtractedPdfResult> {
    return new Promise((resolve, reject) => {
      let scriptPath = path.join(process.cwd(), "lib", "python", "extractor.py")
      if (!fs.existsSync(scriptPath)) {
        const fallbackPath = path.join(process.cwd(), "apps", "web", "lib", "python", "extractor.py")
        if (fs.existsSync(fallbackPath)) {
          scriptPath = fallbackPath
        }
      }
      
      // Determine python binary path in our relocated markitdown virtual environment
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
        const scriptsPath = path.join(venvDir, "Scripts", "python.exe")
        const binPath = path.join(venvDir, "bin", "python")
        if (fs.existsSync(scriptsPath)) {
          pythonCmd = scriptsPath
        } else if (fs.existsSync(binPath)) {
          pythonCmd = binPath
        } else {
          pythonCmd = process.platform === "win32"
            ? scriptsPath
            : binPath
        }
      }
      
      // Pass a dummy output_image_dir argument since the simplified extractor script expects 3 args
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
}
