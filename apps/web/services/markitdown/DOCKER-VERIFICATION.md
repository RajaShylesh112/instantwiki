# Docker Build Verification Checklist

## ✅ Pre-Build Verification

Before building, ensure these files exist:

```
apps/web/services/markitdown/
├── Dockerfile                  ✓ Created
├── .dockerignore              ✓ Created
├── requirements-docker.txt    ✓ Created
├── render.yaml                ✓ Created
├── server.py                  ✓ Modified (PORT support)
├── pyproject.toml             ✓ Exists
└── README.md                  ✓ Exists
```

## 🔧 Code Changes Summary

### 1. `server.py` - Modified for Production
**Changes Made:**
- Added support for `PORT` environment variable (Render requirement)
- Changed default host from `127.0.0.1` to `0.0.0.0` for Docker
- Added `HOST` environment variable support for flexibility

**Before:**
```python
def main():
    port = int(os.environ.get("MARKITDOWN_SERVICE_PORT", "5100"))
    print(f"Starting MarkItDown service on http://127.0.0.1:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
```

**After:**
```python
def main():
    # Render provides PORT, fallback to MARKITDOWN_SERVICE_PORT or 5100
    port = int(os.environ.get("PORT", os.environ.get("MARKITDOWN_SERVICE_PORT", "5100")))
    # Bind to 0.0.0.0 for production (Render requires this), 127.0.0.1 for local dev
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting MarkItDown service on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")
```

**Backward Compatible:** Yes
- Local dev still works: Set `HOST=127.0.0.1` or omit (defaults to 0.0.0.0)
- Render works: Uses `PORT` env var automatically

## 🐳 Docker Build Test Commands

### Step 1: Navigate to Service Directory
```bash
cd apps/web/services/markitdown
```

### Step 2: Build Docker Image
```bash
# Build with tag
docker build -t markitdown-service:latest .

# Build with verbose output (for debugging)
docker build --progress=plain -t markitdown-service:latest .

# Build without cache (if issues)
docker build --no-cache -t markitdown-service:latest .
```

**Expected Output:**
```
[+] Building 120.5s (15/15) FINISHED
 => [internal] load build definition from Dockerfile
 => [internal] load .dockerignore
 => [builder 1/4] FROM python:3.12-slim
 => [builder 2/4] RUN apt-get update && apt-get install -y...
 => [builder 3/4] RUN python -m venv /opt/venv
 => [builder 4/4] RUN pip install --no-cache-dir -r /tmp/requirements.txt
 => [stage-1 1/6] FROM python:3.12-slim
 => [stage-1 2/6] RUN apt-get update && apt-get install -y...
 => [stage-1 3/6] RUN groupadd -r markitdown && useradd -r -g markitdown markitdown
 => [stage-1 4/6] COPY --from=builder /opt/venv /opt/venv
 => [stage-1 5/6] COPY server.py /app/
 => [stage-1 6/6] RUN mkdir -p /tmp/markitdown && chown -R markitdown:markitdown /tmp/markitdown
 => exporting to image
 => => naming to docker.io/library/markitdown-service:latest
```

### Step 3: Verify Image
```bash
# Check image exists
docker images markitdown-service

# Expected output:
# REPOSITORY            TAG       IMAGE ID       CREATED         SIZE
# markitdown-service   latest    abc123def456   2 minutes ago   ~800MB
```

### Step 4: Run Container
```bash
# Run on port 5100
docker run -p 5100:5100 \
  -e HOST=0.0.0.0 \
  -e PORT=5100 \
  --name markitdown-test \
  markitdown-service:latest
```

**Expected Output:**
```
Starting MarkItDown service on 0.0.0.0:5100
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5100 (Press CTRL+C to quit)
```

### Step 5: Test Health Endpoint
Open new terminal:
```bash
# Health check
curl http://localhost:5100/health

# Expected: {"status":"ok","service":"markitdown"}
```

```bash
# Service info
curl http://localhost:5100/info

# Expected: JSON with service version, endpoints, etc.
```

```bash
# Supported formats
curl http://localhost:5100/formats

# Expected: JSON array of supported file formats
```

### Step 6: Cleanup
```bash
# Stop container
docker stop markitdown-test

# Remove container
docker rm markitdown-test

# (Optional) Remove image
docker rmi markitdown-service:latest
```

## 🌐 Render Deployment Verification

### Before Deploying to Render

1. **Commit all files to git:**
   ```bash
   git add apps/web/services/markitdown/Dockerfile
   git add apps/web/services/markitdown/.dockerignore
   git add apps/web/services/markitdown/requirements-docker.txt
   git add apps/web/services/markitdown/render.yaml
   git add apps/web/services/markitdown/server.py
   git add apps/web/services/markitdown/DEPLOYMENT.md
   git add apps/web/services/markitdown/DOCKER-VERIFICATION.md
   git commit -m "Add production Docker setup for MarkItDown service"
   git push
   ```

2. **Verify files in repository:**
   - Check GitHub/GitLab that all files are present
   - Ensure `.dockerignore` is NOT ignored by `.gitignore`

### Deploy to Render

**Option A: Dashboard (Recommended for first time)**
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select your repository
4. Configure:
   - **Root Directory:** `apps/web/services/markitdown`
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.`
   - **Port:** Detected automatically
5. Add environment variables:
   - `HOST` = `0.0.0.0`
   - (Optional) `OPENAI_API_KEY` = your key
6. Click "Create Web Service"

**Option B: Blueprint (Infrastructure as Code)**
1. In Render dashboard, click "New +" → "Blueprint"
2. Select your repository
3. Render detects `render.yaml` and creates service automatically

### Post-Deployment Verification

After Render deploys (5-10 minutes):

```bash
# Replace with your actual Render URL
RENDER_URL="https://instantwiki-markitdown-xxxxx.onrender.com"

# Health check
curl $RENDER_URL/health

# Service info
curl $RENDER_URL/info

# Supported formats
curl $RENDER_URL/formats
```

## 📋 Common Build Issues & Solutions

### Issue 1: "requirements-docker.txt not found"
**Cause:** File path incorrect in Dockerfile
**Solution:** Verify COPY command in Dockerfile uses correct filename

### Issue 2: Build fails at pip install
**Cause:** Dependency conflict or network issue
**Solution:** 
```bash
# Clear Docker build cache
docker builder prune

# Rebuild
docker build --no-cache -t markitdown-service .
```

### Issue 3: Container starts but service not accessible
**Cause:** Host binding issue
**Solution:** Ensure HOST=0.0.0.0 in environment

### Issue 4: Health check fails in Docker
**Cause:** Port mismatch
**Solution:** Ensure PORT env var matches exposed port

### Issue 5: Render build fails
**Cause:** Wrong Docker context or Dockerfile path
**Solution:** Verify in render.yaml:
```yaml
dockerfilePath: ./apps/web/services/markitdown/Dockerfile
dockerContext: ./apps/web/services/markitdown
```

## 📊 Expected Build Metrics

| Metric | Expected Value |
|--------|----------------|
| **Build Time** | 5-10 minutes (first build) |
| **Image Size** | ~800 MB (with all dependencies) |
| **Startup Time** | 5-10 seconds |
| **Memory Usage** | ~200 MB idle, ~500 MB under load |
| **Health Check** | <100ms response time |

## ✅ Production Readiness Checklist

- [ ] Docker builds successfully locally
- [ ] Container runs and responds to health check
- [ ] All endpoints return expected responses
- [ ] Files committed to git repository
- [ ] Render service created and configured
- [ ] Environment variables set in Render dashboard
- [ ] Deployment successful on Render
- [ ] Health check passes on production URL
- [ ] API endpoints accessible and functional
- [ ] (Optional) OpenAI API key configured for OCR
- [ ] Monitoring/logging reviewed in Render dashboard

## 🎯 Final Verification Script

Save as `verify-docker.sh` and run locally:

```bash
#!/bin/bash
set -e

echo "🔍 Verifying Docker setup for MarkItDown service..."

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi
echo "✅ Docker is installed"

# Check required files exist
FILES=("Dockerfile" ".dockerignore" "requirements-docker.txt" "server.py" "pyproject.toml")
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        exit 1
    fi
    echo "✅ Found: $file"
done

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t markitdown-test:verify . || {
    echo "❌ Docker build failed"
    exit 1
}
echo "✅ Docker build successful"

# Run container
echo "🚀 Starting container..."
docker run -d -p 5100:5100 -e HOST=0.0.0.0 -e PORT=5100 --name markitdown-verify markitdown-test:verify || {
    echo "❌ Container failed to start"
    exit 1
}

# Wait for startup
echo "⏳ Waiting for service to start..."
sleep 10

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5100/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Health check passed: $HEALTH"
else
    echo "❌ Health check failed: $HEALTH"
    docker logs markitdown-verify
    docker stop markitdown-verify
    docker rm markitdown-verify
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
docker stop markitdown-verify
docker rm markitdown-verify
docker rmi markitdown-test:verify

echo ""
echo "✅ ✅ ✅ ALL VERIFICATIONS PASSED ✅ ✅ ✅"
echo "Service is ready for Render deployment!"
```

Make executable and run:
```bash
chmod +x verify-docker.sh
./verify-docker.sh
```

## 🎉 Success Criteria

Your Docker setup is ready when:
1. ✅ `docker build` completes without errors
2. ✅ Container starts and binds to port
3. ✅ `/health` returns `{"status":"ok"}`
4. ✅ `/info` returns service metadata
5. ✅ `/formats` returns supported formats list
6. ✅ Service responds within 100ms
7. ✅ No error logs in Docker output

Once all criteria pass, proceed with Render deployment!
