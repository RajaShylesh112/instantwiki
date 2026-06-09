import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import os from "os"

export interface ExtractedPage {
  page_number: number
  text: string
}

export interface ExtractedImage {
  page_number: number
  filename: string
  width: number
  height: number
  ext: string
  localPath: string
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
  async extractPdf(pdfPath: string): Promise<ExtractedPdfResult> {
    return new Promise((resolve, reject) => {
      // 1. Create a unique temporary directory for extracted images
      const tempDirId = Math.random().toString(36).substring(7)
      const outputImageDir = path.join(os.tmpdir(), `instantwiki-pdf-${tempDirId}`)
      
      const scriptPath = path.join(process.cwd(), "lib", "python", "extractor.py")
      
      // Determine python binary name (standard 'python' or 'python3')
      const pythonCmd = process.platform === "win32" ? "python" : "python3"
      
      const child = spawn(pythonCmd, [scriptPath, pdfPath, outputImageDir])
      
      let stdoutData = ""
      let stderrData = ""
      
      child.stdout.on("data", (data) => {
        stdoutData += data.toString()
      })
      
      child.stderr.on("data", (data) => {
        stderrData += data.toString()
      })
      
      child.on("close", (code) => {
        if (code !== 0) {
          console.error("Python PDF extractor script failed with code", code)
          console.error("Stderr:", stderrData)
          reject(new Error(`PDF extraction failed with code ${code}: ${stderrData || "Unknown error"}`))
          return
        }
        
        try {
          const parsed = JSON.parse(stdoutData.trim())
          if (!parsed.success) {
            reject(new Error(parsed.error || "Failed to extract PDF details."))
            return
          }
          
          // Map local paths back to ExtractedImage instances
          const images: ExtractedImage[] = (parsed.images || []).map((img: any) => ({
            ...img,
            localPath: path.join(outputImageDir, img.filename)
          }))
          
          resolve({
            pages: parsed.pages || [],
            images
          })
        } catch (err) {
          console.error("Failed to parse stdout JSON from Python parser. Raw stdout:", stdoutData)
          reject(new Error("Failed to parse extraction output."))
        }
      })
    })
  },

  /**
   * Cleans up temporary image files
   */
  async cleanupTempDir(images: ExtractedImage[]): Promise<void> {
    if (images.length === 0) return
    try {
      const parentDir = path.dirname(images[0].localPath)
      if (fs.existsSync(parentDir)) {
        fs.rmSync(parentDir, { recursive: true, force: true })
      }
    } catch (err) {
      console.error("Error cleaning up temp directory:", err)
    }
  }
}
