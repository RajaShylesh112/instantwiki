@echo off
REM Setup script for the MarkItDown microservice virtual environment
REM Run this once to initialize or re-initialize the .venv

echo === InstantWiki MarkItDown Service Setup ===

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate and install dependencies
echo Installing dependencies...
call .venv\Scripts\activate.bat

pip install --upgrade pip
pip install -e packages/markitdown[all]
pip install -e packages/markitdown-ocr[llm]
pip install fastapi "uvicorn[standard]" PyMuPDF "pdfminer.six>=20251230" "pdfplumber>=0.11.9" "openai>=1.0.0" python-dotenv

echo.
echo === Setup complete! ===
echo.
echo To start the service:
echo   .venv\Scripts\activate.bat
echo   python server.py
echo.
echo Or directly:
echo   .venv\Scripts\python.exe server.py
