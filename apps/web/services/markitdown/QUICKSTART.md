# MarkItDown Service - Docker Quick Start

## 🚀 5-Minute Local Test

```bash
# 1. Navigate to service
cd apps/web/services/markitdown

# 2. Build Docker image
docker build -t markitdown-service .

# 3. Run container
docker run -d -p 5100:5100 \
  -e HOST=0.0.0.0 \
  -e PORT=5100 \
  --name markitdown \
  markitdown-service:latest

# 4. Test endpoints
curl http://localhost:5100/health
# Expected: {"status":"ok","service":"markitdown"}

curl http://localhost:5100/info
# Expected: JSON with version and endpoints

# 5. Cleanup
docker stop markitdown && docker rm markitdown
```

## 🌐 Deploy to Render (5 Minutes)

### Method 1: Dashboard
1. Go to https://dashboard.render.com
2. New + → Web Service → Connect repository
3. Configure:
   - **Root:** `apps/web/services/markitdown`
   - **Runtime:** Docker
   - **Plan:** Starter (free) or higher
4. Add env var: `HOST=0.0.0.0`
5. Deploy!

### Method 2: Blueprint (Automated)
1. Ensure `render.yaml` is in your repo
2. Render Dashboard → New + → Blueprint
3. Select repository
4. Render auto-configures everything
5. Deploy!

## ✅ Verify Deployment

```bash
# Replace with your Render URL
URL="https://your-service.onrender.com"

curl $URL/health
curl $URL/info
curl $URL/formats
```

## 📚 Full Documentation

- **Complete Guide:** `DEPLOYMENT.md`
- **Verification:** `DOCKER-VERIFICATION.md`
- **Summary:** `PRODUCTION-SUMMARY.md`

## 🔧 Environment Variables for Render

Required:
- `HOST=0.0.0.0`

Optional:
- `OPENAI_API_KEY=sk-...` (for LLM OCR)
- `OPENAI_BASE_URL=https://...` (custom endpoint)

## 🎯 Files You Need

All created and ready:
- ✅ `Dockerfile`
- ✅ `.dockerignore`
- ✅ `requirements-docker.txt`
- ✅ `render.yaml`
- ✅ `server.py` (modified for PORT support)

## ⚡ That's It!

Your service is production-ready. Build, test, deploy!
