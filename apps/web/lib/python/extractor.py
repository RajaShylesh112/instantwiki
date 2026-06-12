import os
import sys
import json
import fitz  # PyMuPDF

def is_overlap(bbox1, bbox2):
    x0_1, y0_1, x1_1, y1_1 = bbox1
    x0_2, y0_2, x1_2, y1_2 = bbox2
    
    # Calculate intersection
    x0_i = max(x0_1, x0_2)
    y0_i = max(y0_1, y0_2)
    x1_i = min(x1_1, x1_2)
    y1_i = min(y1_1, y1_2)
    
    if x0_i < x1_i and y0_i < y1_i:
        intersect_area = (x1_i - x0_i) * (y1_i - y0_i)
        bbox1_area = (x1_1 - x0_1) * (y1_1 - y0_1)
        if bbox1_area > 0 and (intersect_area / bbox1_area) > 0.5:
            return True
    return False

def make_markdown_table(headers, rows):
    if not headers and not rows:
        return ""
    if not headers and rows:
        headers = [f"Column {i+1}" for i in range(len(rows[0]))]
    
    headers = [str(h).replace("\n", " ").strip() for h in headers]
    clean_rows = []
    for r in rows:
        clean_rows.append([str(cell).replace("\n", " ").strip() if cell is not None else "" for cell in r])
        
    cols_count = len(headers)
    markdown = "| " + " | ".join(headers) + " |\n"
    markdown += "| " + " | ".join(["---"] * cols_count) + " |\n"
    for r in clean_rows:
        if len(r) < cols_count:
            r = r + [""] * (cols_count - len(r))
        elif len(r) > cols_count:
            r = r[:cols_count]
        markdown += "| " + " | ".join(r) + " |\n"
    return markdown

def extract_pdf_data(pdf_path, output_image_dir, page_limit=None):
    try:
        doc = fitz.open(pdf_path)
        pages_data = []
        
        total_pages = len(doc)
        pages_to_process = range(min(page_limit, total_pages)) if page_limit is not None else range(total_pages)
        
        for page_idx in pages_to_process:
            page_num = page_idx + 1
            page = doc[page_idx]
            
            blocks_data = []
            
            # 1. Find and extract tables
            tables = page.find_tables()
            extracted_tables = []
            
            for t_idx, table in enumerate(tables):
                headers = table.header.names if table.header else []
                rows = table.extract()
                
                # Filter out headers if they are inside the rows to prevent duplication
                if rows and len(rows) > 0 and rows[0] == headers:
                    rows = rows[1:]
                    
                markdown = make_markdown_table(headers, rows)
                
                extracted_tables.append({
                    "bbox": table.bbox,
                    "headers": headers,
                    "rows": rows,
                    "markdown": markdown
                })
                
                blocks_data.append({
                    "type": "table",
                    "content": markdown,
                    "table_data": {
                        "headers": headers,
                        "rows": rows,
                        "markdown": markdown
                    }
                })
            
            # 2. Extract text blocks and classify headings
            page_dict = page.get_text("dict")
            text_blocks_raw = []
            
            for block in page_dict.get("blocks", []):
                if block.get("type") == 0:  # Text block
                    # Check overlap with any table
                    in_table = False
                    for ext_table in extracted_tables:
                        if is_overlap(block["bbox"], ext_table["bbox"]):
                            in_table = True
                            break
                    if in_table:
                        continue
                        
                    block_text = ""
                    spans = []
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            spans.append(span)
                            block_text += span["text"] + " "
                    
                    block_text = block_text.strip()
                    if block_text:
                        text_blocks_raw.append({
                            "bbox": block["bbox"],
                            "text": block_text,
                            "spans": spans
                        })
            
            # OCR Fallback: If standard extraction yields no text, attempt OCR
            if not text_blocks_raw:
                try:
                    tp = page.get_textpage_ocr(flags=0, dpi=150, full=True)
                    ocr_text = tp.extractText().strip()
                    if ocr_text:
                        # Split by double newline to simulate blocks
                        for paragraph in ocr_text.split("\n\n"):
                            p_text = paragraph.strip()
                            if p_text:
                                text_blocks_raw.append({
                                    "bbox": (0, 0, 0, 0),
                                    "text": p_text,
                                    "spans": []
                                })
                except Exception:
                    # OCR failed (e.g. Tesseract is not installed)
                    pass
            
            # Process text blocks for blocks_data
            for tb in text_blocks_raw:
                spans = tb["spans"]
                max_size = max([s["size"] for s in spans]) if spans else 0
                is_bold = any(s["flags"] & 16 for s in spans) if spans else False
                
                # Heading detection heuristic
                if max_size > 14.0 or (max_size > 11.5 and is_bold):
                    level = 3
                    if max_size > 20.0:
                        level = 1
                    elif max_size > 15.0:
                        level = 2
                    
                    blocks_data.append({
                        "type": "heading",
                        "content": tb["text"],
                        "level": level
                    })
                else:
                    blocks_data.append({
                        "type": "text",
                        "content": tb["text"]
                    })
                
            # Combine all blocks into a single markdown string
            combined_text = ""
            for block in blocks_data:
                combined_text += block["content"] + "\n\n"
            
            pages_data.append({
                "page_number": page_num,
                "text": combined_text.strip(),
                "blocks": blocks_data
            })
            
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
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python extractor.py <pdf_path> <output_image_dir> [page_limit]"
        }))
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    output_image_dir = sys.argv[2]
    page_limit = None
    if len(sys.argv) >= 4:
        try:
            page_limit = int(sys.argv[3])
        except ValueError:
            pass
    extract_pdf_data(pdf_path, output_image_dir, page_limit)
