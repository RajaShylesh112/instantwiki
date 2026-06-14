# MarkItDown Microservice

Self-contained Python environment and HTTP microservice for document-to-markdown conversion.

## Architecture

```
services/markitdown/
├── .venv/              # Isolated Python virtual environment
├── packages/
│   ├── markitdown/     # Core markitdown library (editable install)
│   └── markitdown-ocr/ # OCR plugin (editable install)
├── server.py           # FastAPI HTTP server (the service entrypoint)
├── client.ts           # TypeScript client for other app code to import
├── pyproject.toml      # Python project manifest
├── setup.bat           # Windows setup script
└── README.md
```

## Setup

Run the setup script once to install all Python dependencies into the `.venv`:

```cmd
cd apps/web/services/markitdown
setup.bat
```

## Running the Service

```cmd
cd apps/web/services/markitdown
.venv\Scripts\python.exe server.py
```

The server starts on `http://127.0.0.1:5100` by default.  
Override with the `MARKITDOWN_SERVICE_PORT` environment variable.

## API Endpoints

### `GET /health`
Returns `{"status": "ok"}` when the service is running.

### `POST /convert`
Convert a single document to markdown.

**Request body:**
```json
{
  "file_path": "C:/path/to/document.pdf",
  "page_limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "pages": [
    {
      "page_number": 1,
      "text": "# Heading\n\nSome content...",
      "blocks": [
        { "type": "heading", "content": "Heading", "level": 1 },
        { "type": "text", "content": "Some content..." }
      ]
    }
  ],
  "images": []
}
```

### `POST /convert-batch`
Convert multiple documents in a single request.

**Request body:**
```json
{
  "file_paths": ["C:/path/to/doc1.pdf", "C:/path/to/doc2.docx"],
  "page_limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "file_path": "C:/path/to/doc1.pdf",
      "success": true,
      "pages": [...],
      "images": []
    },
    {
      "file_path": "C:/path/to/doc2.docx",
      "success": true,
      "pages": [...],
      "images": []
    }
  ]
}
```

### `POST /convert-bytes`
Convert a document from base64-encoded bytes without filesystem access.

**Request body:**
```json
{
  "file_bytes_base64": "JVBERi0xLjQKJ...",
  "filename": "document.pdf",
  "page_limit": 10
}
```

**Response:** Same as `/convert`

### `GET /formats`
List all supported file formats.

**Response:**
```json
{
  "formats": [
    { "extension": ".pdf", "mime_type": "application/pdf", "description": "PDF documents" },
    { "extension": ".docx", "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "description": "Microsoft Word (DOCX)" }
  ],
  "with_ocr": ["pdf", "docx", "pptx", "xlsx"],
  "requires_llm": "Optional: LLM client enables OCR for images in documents"
}
```

### `GET /info`
Get service version, configuration status, and available endpoints.

**Response:**
```json
{
  "service": "InstantWiki MarkItDown Microservice",
  "version": "1.0.0",
  "markitdown_version": "0.1.6",
  "llm_configured": true,
  "ocr_available": true,
  "endpoints": {
    "health": "GET /health",
    "convert": "POST /convert",
    "convert_batch": "POST /convert-batch",
    "convert_bytes": "POST /convert-bytes",
    "formats": "GET /formats",
    "info": "GET /info",
    "generate_test_docx": "POST /generate-test-docx"
  }
}
```

### `POST /generate-test-docx`
Generate a test DOCX file for integration testing (development/testing only).

**Request body:**
```json
{
  "output_path": "C:/temp/test.docx"
}
```

**Response:**
```json
{
  "success": true,
  "path": "C:/temp/test.docx"
}
```

## Usage from TypeScript

```typescript
import { MarkItDownClient } from "@/services/markitdown/client"

// Check if the service is up
const healthy = await MarkItDownClient.isHealthy()

// Convert a single document
const result = await MarkItDownClient.convert("/path/to/file.pdf", 5)
console.log(result.pages[0].text)

// Convert multiple documents in batch
const batchResult = await MarkItDownClient.convertBatch([
  "/path/to/doc1.pdf",
  "/path/to/doc2.docx"
], 10)
batchResult.results.forEach(r => {
  console.log(`${r.file_path}: ${r.success ? "OK" : r.error}`)
})

// Convert from bytes (e.g., file upload)
const fileBuffer = await fs.readFile("/path/to/file.pdf")
const bytesResult = await MarkItDownClient.convertFromBytes(fileBuffer, "file.pdf")

// Get supported formats
const formats = await MarkItDownClient.getSupportedFormats()
console.log(`Supports ${formats.formats.length} file types`)

// Get service info
const info = await MarkItDownClient.getServiceInfo()
console.log(`Service version: ${info.version}, OCR: ${info.ocr_available}`)
```

The `PdfExtractorService` in `services/pdf-extractor.ts` automatically uses the HTTP service when available.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MARKITDOWN_SERVICE_PORT` | `5100` | Port for the HTTP server |
| `MARKITDOWN_SERVICE_URL` | `http://127.0.0.1:5100` | Full URL (used by TS client) |
| `OPENAI_API_KEY` | — | Optional: enables LLM-based OCR |
| `OPENAI_BASE_URL` | — | Optional: custom OpenAI endpoint |
