# ============================================================================
# InstantWiki MarkItDown Microservice - Production Dockerfile
# ============================================================================
# Multi-stage build for minimal production image
# Optimized for Render deployment
# ============================================================================

# Stage 1: Builder - Install dependencies
FROM python:3.12-slim AS builder

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements-docker.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r /tmp/requirements.txt


# Stage 2: Production runtime
FROM python:3.12-slim

# Set metadata
LABEL maintainer="InstantWiki"
LABEL description="MarkItDown document-to-markdown conversion microservice"
LABEL version="1.0.0"

# Install only runtime system dependencies (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Required for PyMuPDF and PDF processing
    libmupdf-dev \
    mupdf-tools \
    # Required for image processing
    libjpeg62-turbo \
    libpng16-16 \
    # Required for audio processing (optional)
    ffmpeg \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r markitdown && useradd -r -g markitdown markitdown

# Set working directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY server.py /app/
COPY pyproject.toml /app/
COPY README.md /app/

# Create temp directory for file conversions
RUN mkdir -p /tmp/markitdown && chown -R markitdown:markitdown /tmp/markitdown

# Set environment variable for temp directory
ENV TMPDIR=/tmp/markitdown

# Switch to non-root user
USER markitdown

# Expose port (Render will override with PORT env var)
EXPOSE 5100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-5100}/health').read()"

# Start command - Render will provide PORT env var
CMD ["python", "server.py"]
