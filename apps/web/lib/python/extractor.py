import os
import sys
import json
import fitz  # PyMuPDF

def extract_pdf_data(pdf_path, output_image_dir):
    try:
        # Create output image directory if it doesn't exist
        os.makedirs(output_image_dir, exist_ok=True)
        
        doc = fitz.open(pdf_path)
        pages_data = []
        images_data = []
        
        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]
            
            # 1. Extract text
            text = page.get_text("text").strip()
            pages_data.append({
                "page_number": page_num,
                "text": text
            })
            
            # 2. Extract images
            image_list = page.get_images(full=True)
            for img_idx, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Create unique filename
                filename = f"img_page{page_num}_{img_idx + 1}.{image_ext}"
                filepath = os.path.join(output_image_dir, filename)
                
                # Save image file
                with open(filepath, "wb") as f:
                    f.write(image_bytes)
                
                # Record image metadata
                images_data.append({
                    "page_number": page_num,
                    "filename": filename,
                    "width": base_image.get("width", 0),
                    "height": base_image.get("height", 0),
                    "ext": image_ext
                })
        
        result = {
            "success": True,
            "pages": pages_data,
            "images": images_data
        }
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python extractor.py <pdf_path> <output_image_dir>"
        }))
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    output_image_dir = sys.argv[2]
    extract_pdf_data(pdf_path, output_image_dir)
