import os
from markitdown import MarkItDown

def main():
    markitdown = MarkItDown()
    
    # Define source directories and files to convert
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_files_dir = os.path.join(workspace_dir, "inspiration", "markitdown", "packages", "markitdown", "tests", "test_files")
    output_dir = os.path.join(workspace_dir, "inspiration", "converted_markdowns")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # List of files to convert
    files_to_convert = []
    
    # 1. Add workspace root files
    root_files = [
        os.path.join(workspace_dir, "reference-wikipage.html"),
        os.path.join(workspace_dir, "schema.csv")
    ]
    for rf in root_files:
        if os.path.exists(rf):
            files_to_convert.append((rf, "workspace_root"))
            
    # 2. Add files from markitdown test_files
    if os.path.exists(test_files_dir):
        # We look for files in test_files_dir
        supported_extensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.xls', '.epub', '.html', '.csv', '.json', '.xml', '.ipynb', '.msg']
        for file_name in os.listdir(test_files_dir):
            file_path = os.path.join(test_files_dir, file_name)
            if os.path.isfile(file_path):
                ext = os.path.splitext(file_name)[1].lower()
                if ext in supported_extensions:
                    files_to_convert.append((file_path, "test_files"))
                    
    print(f"Found {len(files_to_convert)} files to convert.")
    
    for file_path, source_group in files_to_convert:
        file_name = os.path.basename(file_path)
        out_name = f"{source_group}_{file_name}.md"
        out_path = os.path.join(output_dir, out_name)
        
        print(f"Converting: {file_name} ({source_group}) -> {out_name}...")
        try:
            result = markitdown.convert(file_path)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(result.text_content)
            print(f"  Success!")
        except Exception as e:
            print(f"  Failed: {e}")

if __name__ == "__main__":
    main()
