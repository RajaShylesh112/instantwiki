import os
import sys
import json
import tempfile
import fitz  # PyMuPDF
import dotenv
from markitdown import MarkItDown
from openai import OpenAI

# 1. Load .env file
# Since extractor.py is in apps/web/lib/python/, the .env file is in apps/web/.env
web_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dotenv_path = os.path.join(web_dir, ".env")
dotenv.load_dotenv(dotenv_path)

def parse_markdown_to_blocks(md_text):
    blocks = []
    lines = md_text.splitlines()
    
    current_block_type = None
    current_block_content = []
    current_level = None
    
    def flush():
        nonlocal current_block_type, current_block_content, current_level
        if not current_block_content:
            return
        content = "\n".join(current_block_content).strip()
        if content:
            block = {
                "type": current_block_type,
                "content": content
            }
            if current_level is not None:
                block["level"] = current_level
            blocks.append(block)
        current_block_content = []
        current_block_type = None
        current_level = None

    i = 0
    while i < len(lines):
        line = lines[i]
        trimmed = line.strip()
        
        # Check for headers
        if trimmed.startswith('#'):
            # Count leading #s
            parts = trimmed.split(' ', 1)
            header_symbols = parts[0]
            if all(char == '#' for char in header_symbols) and len(parts) > 1:
                flush()
                current_block_type = "heading"
                current_level = len(header_symbols)
                current_block_content = [parts[1].strip()]
                flush()
                i += 1
                continue
                
        # Check for tables
        if trimmed.startswith('|'):
            if current_block_type != "table":
                flush()
                current_block_type = "table"
            current_block_content.append(line)
            i += 1
            continue
            
        # Standard text paragraph accumulation
        if not trimmed:
            flush()
        else:
            if current_block_type not in ["text", None]:
                flush()
            current_block_type = "text"
            current_block_content.append(line)
        i += 1
        
    flush()
    return blocks

def extract_content_topic(text):
    """Extract the first meaningful heading or first non-trivial line as the page topic."""
    lines = text.splitlines()
    for line in lines:
        stripped = line.strip()
        # Skip empty lines
        if not stripped:
            continue
        # Skip lines that are just 'Page N' or '## Page N'
        import re
        if re.match(r'^#*\s*Page\s+\d+\s*$', stripped, re.IGNORECASE):
            continue
        # Skip very short lines (1-2 chars, e.g. bullet points)
        if len(stripped) < 3:
            continue
        # Remove leading markdown/bullet chars to get clean topic
        cleaned = re.sub(r'^[#•–▪\*\-\s]+', '', stripped).strip()
        # A good topic: at least 5 chars, under 120 chars
        if 5 <= len(cleaned) <= 120:
            return cleaned
    return None


def extract_pdf_pages_markitdown(pdf_path, markitdown, page_limit=None):
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    pages_to_process = range(min(page_limit, total_pages)) if page_limit is not None else range(total_pages)
    
    pages_data = []
    for page_idx in pages_to_process:
        page_num = page_idx + 1
        page = doc[page_idx]
        
        # Extract a single page and save as temporary PDF to convert it
        page_doc = fitz.open()
        page_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
        
        # Save to a temporary file
        fd, temp_pdf_path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        
        try:
            page_doc.save(temp_pdf_path)
            page_doc.close()
            
            res = markitdown.convert(temp_pdf_path)
            page_text = res.text_content
            
            # Strip any generic "## Page 1" injected by markitdown for single-page exports
            import re
            page_text = re.sub(r'^#+\s*Page\s+1\s*\n?', '', page_text, flags=re.IGNORECASE).strip()
            
            # Extract PyMuPDF text
            fitz_text = page.get_text("text").strip()
            
            # Decide which text source to use
            use_fitz = False
            if len(page_text) < 50 and len(fitz_text) >= 50:
                use_fitz = True
            elif len(page_text) > 0:
                # Calculate alphanumeric and space ratio
                mid_alnum_space = sum(1 for c in page_text if c.isalnum() or c.isspace())
                fitz_alnum_space = sum(1 for c in fitz_text if c.isalnum() or c.isspace())
                
                mid_ratio = mid_alnum_space / len(page_text) if len(page_text) > 0 else 0
                fitz_ratio = fitz_alnum_space / len(fitz_text) if len(fitz_text) > 0 else 0
                
                # If markitdown has a lot of garbled characters (low ratio) compared to fitz, prefer fitz
                if mid_ratio < 0.6 and fitz_ratio > 0.8 and len(fitz_text) > 100:
                    use_fitz = True
                # If fitz text is much longer (markitdown missed major sections)
                elif len(fitz_text) > len(page_text) * 1.5:
                    use_fitz = True
            
            if use_fitz:
                # Clean up fitz text: merge separated bullets/lines
                lines = fitz_text.splitlines()
                cleaned_lines = []
                i = 0
                while i < len(lines):
                    line = lines[i].strip()
                    # Check for common bullet point symbols
                    if line in ["•", "–", "▪", "*", "-"] or (len(line) == 1 and not line.isalnum()):
                        if i + 1 < len(lines):
                            next_line = lines[i+1].strip()
                            cleaned_lines.append(f"{line} {next_line}")
                            i += 2
                            continue
                    cleaned_lines.append(lines[i])
                    i += 1
                page_text = "\n".join(cleaned_lines)
            
            # --- TOPIC DISCOVERY: inject real content topic as heading ---
            # Only add a heading if none already exists at the top
            existing_heading = re.match(r'^#+\s+.+', page_text.lstrip())
            if not existing_heading:
                topic = extract_content_topic(page_text)
                if topic:
                    # Prepend as an H2 heading
                    page_text = f"## {topic}\n\n{page_text}"
            
            # Extract images from this page using fitz (PyMuPDF)
            image_list = page.get_images(full=True)
            seen_xrefs = set()
            img_index = 1
            for img in image_list:
                try:
                    xref = img[0]
                    if xref in seen_xrefs:
                        continue
                    seen_xrefs.add(xref)
                    
                    width = img[2]
                    height = img[3]
                    # Skip tiny images/icons/bullets
                    if width < 50 or height < 50:
                        continue
                        
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    import base64
                    base64_data = base64.b64encode(image_bytes).decode("utf-8")
                    mime_type = f"image/{image_ext}"
                    if image_ext == "jpg":
                        mime_type = "image/jpeg"
                        
                    # Append the image as a base64 markdown reference
                    page_text += f"\n\n![Image page {page_num}, image {img_index}](data:{mime_type};base64,{base64_data})"
                    img_index += 1
                except Exception as img_err:
                    import sys
                    print(f"Warning: Failed to extract image from page {page_num}: {img_err}", file=sys.stderr)
            
            blocks_data = parse_markdown_to_blocks(page_text)
            if not blocks_data:
                blocks_data = [{"type": "text", "content": page_text}]
                
            pages_data.append({
                "page_number": page_num,
                "text": page_text,
                "blocks": blocks_data
            })
        finally:
            if os.path.exists(temp_pdf_path):
                os.unlink(temp_pdf_path)
                
    doc.close()
    return pages_data


def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python extractor.py <file_path> <output_image_dir> [page_limit]"
        }))
        sys.exit(1)
        
    file_path = sys.argv[1]
    output_image_dir = sys.argv[2]
    page_limit = None
    if len(sys.argv) >= 4:
        try:
            page_limit = int(sys.argv[3])
        except ValueError:
            pass
            
    # 2. Configure MarkItDown with LLM if keys are present
    openai_key = os.environ.get("OPENAI_API_KEY")
    openai_base = os.environ.get("OPENAI_BASE_URL")
    
    client = None
    # We use the bedrock-compatible gpt-oss-120b model if available
    llm_model = "openai.gpt-oss-120b"
    
    if openai_key and openai_key.strip() and openai_key != "YOUR_OPENAI_API_KEY":
        try:
            # We set a short timeout for verification
            test_client = OpenAI(
                api_key=openai_key,
                base_url=openai_base if openai_base else None,
                timeout=3.0
            )
            # Make a fast, minimal completion request to verify the key and endpoint are working
            test_client.chat.completions.create(
                model=llm_model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1
            )
            # If we reach here, the client works!
            client = test_client
            print("Successfully verified LLM client for MarkItDown", file=sys.stderr)
        except Exception as e:
            print(f"Warning: OpenAI/Bedrock client verification failed ({e}). MarkItDown will run in offline mode.", file=sys.stderr)
            client = None
            
    try:
        # Initialize MarkItDown.
        # If client is configured, we pass it for image processing/descriptions/OCR.
        if client:
            markitdown = MarkItDown(llm_client=client, llm_model=llm_model, enable_plugins=True)
        else:
            markitdown = MarkItDown(enable_plugins=True)
            
        # Determine file type
        ext = os.path.splitext(file_path)[1].lower()
        
        pages_data = []
        try:
            if ext == ".pdf":
                # For PDFs, convert page-by-page so we keep page number mapping
                pages_data = extract_pdf_pages_markitdown(file_path, markitdown, page_limit)
            else:
                # For other formats (DOCX, HTML, PPTX, XLSX, etc.), convert the whole file
                res = markitdown.convert(file_path)
                md_text = res.text_content
                blocks_data = parse_markdown_to_blocks(md_text)
                if not blocks_data:
                    blocks_data = [{"type": "text", "content": md_text}]
                    
                pages_data = [{
                    "page_number": 1,
                    "text": md_text,
                    "blocks": blocks_data
                }]
        except Exception as conversion_err:
            # If it failed using the LLM client (e.g. expired key, timeout), fallback to offline mode
            if client:
                print(f"Warning: MarkItDown with LLM failed ({conversion_err}). Retrying without LLM...", file=sys.stderr)
                markitdown_fallback = MarkItDown(enable_plugins=True)
                if ext == ".pdf":
                    pages_data = extract_pdf_pages_markitdown(file_path, markitdown_fallback, page_limit)
                else:
                    res = markitdown_fallback.convert(file_path)
                    md_text = res.text_content
                    blocks_data = parse_markdown_to_blocks(md_text)
                    if not blocks_data:
                        blocks_data = [{"type": "text", "content": md_text}]
                        
                    pages_data = [{
                        "page_number": 1,
                        "text": md_text,
                        "blocks": blocks_data
                    }]
            else:
                raise conversion_err
            
        result = {
            "success": True,
            "pages": pages_data,
            "images": []
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
