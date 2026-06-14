# MarkItDown Microservice - Production Deployment Guide

## 🚀 Render Deployment

### Prerequisites
- Render account ([render.com](https://render.com))
- Git repository with this code pushed

### Quick Deploy Options

#### Option 1: Deploy via Render Dashboard (Recommended for first deployment)

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub/GitLab repository

2. **Configure Service**
   ```
   Name: instantwiki-markitdown
   Region: Oregon (or your preferred region)
   Branch: main (or your deployment branch)
   Root Directory: apps/web/services/markitdown
   Runtime: Docker
   
   Docker Configuration:
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   
   Plan: Starter (free) or higher
   ```

3. **Environment Variables** (Add in Render dashboard)
   ```
   Required:
   HOST=0.0.0.0
   
   Optional (for LLM-based OCR):
   OPENAI_API_KEY=<your-openai-api-key>
   OPENAI_BASE_URL=<custom-endpoint-if-needed>
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - First build takes 5-10 minutes

#### Option 2: Deploy via Blueprint (Infrastructure as Code)

1. **Push render.yaml to your repository**
   ```bash
   git add apps/web/services/markitdown/render.yaml
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Create Blueprint in Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Select your repository
   - Render will detect `render.yaml` and create the service

3. **Add Secrets** (in Render dashboard after creation)
   - Navigate to your service
   - Go to "Environment" tab
   - Add `OPENAI_API_KEY` if needed

### Deployment Settings

| Setting | Value |
|---------|-------|
| **Runtime** | Docker |
| **Build Command** | (none - Docker handles it) |
| **Start Command** | `python server.py` (from Dockerfile CMD) |
| **Port** | Auto-detected from PORT env var |
| **Health Check** | `GET /health` |
| **Auto-Deploy** | Enabled on git push |

### Environment Variables for Render

Configure these in Render dashboard under "Environment":

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | ✅ Auto-set | Render provides this automatically | `10000` |
| `HOST` | ✅ Set to | Must bind to all interfaces | `0.0.0.0` |
| `OPENAI_API_KEY` | ⚠️ Optional | Enables LLM-based OCR for images | `sk-...` |
| `OPENAI_BASE_URL` | ⚠️ Optional | Custom OpenAI-compatible endpoint | `https://api.openai.com/v1` |

### Service URLs

After deployment, Render provides:
```
Service URL: https://instantwiki-markitdown-xxxxx.onrender.com
Health Check: https://instantwiki-markitdown-xxxxx.onrender.com/health
API Docs: https://instantwiki-markitdown-xxxxx.onrender.com/docs
```

### Verify Deployment

```bash
# Health check
curl https://your-service.onrender.com/health

# Service info
curl https://your-service.onrender.com/info

# Supported formats
curl https://your-service.onrender.com/formats
```

---

## 🐳 Docker Build & Test Locally

### Build Docker Image

```bash
cd apps/web/services/markitdown

# Build image
docker build -t markitdown-service:latest .

# Verify image size
docker images markitdown-service
```

### Run Docker Container Locally

```bash
# Run on default port 5100
docker run -p 5100:5100 \
  -e HOST=0.0.0.0 \
  -e PORT=5100 \
  markitdown-service:latest

# Run with OpenAI for OCR
docker run -p 5100:5100 \
  -e HOST=0.0.0.0 \
  -e PORT=5100 \
  -e OPENAI_API_KEY=sk-your-key \
  markitdown-service:latest

# Run in background
docker run -d -p 5100:5100 \
  --name markitdown \
  -e HOST=0.0.0.0 \
  -e PORT=5100 \
  markitdown-service:latest

# View logs
docker logs -f markitdown

# Stop container
docker stop markitdown
docker rm markitdown
```

### Test Endpoints

```bash
# Health check
curl http://localhost:5100/health

# Service info
curl http://localhost:5100/info

# Supported formats
curl http://localhost:5100/formats
```

---

## 📊 Production Considerations

### Resource Requirements

**Minimum (Starter Plan on Render):**
- RAM: 512 MB
- CPU: 0.5 vCPU
- Suitable for: Light workloads, testing

**Recommended (Standard Plan):**
- RAM: 2 GB
- CPU: 1 vCPU
- Suitable for: Production with moderate document conversion

**Heavy Workloads:**
- RAM: 4+ GB
- CPU: 2+ vCPU
- Required for: Large PDFs, many concurrent requests

### Performance Optimization

1. **Document Size Limits**
   - Recommended max: 50 MB per document
   - For larger files, increase timeout and memory

2. **Concurrent Requests**
   - FastAPI handles async requests efficiently
   - Consider horizontal scaling for high traffic

3. **Caching Strategy**
   - Implement caching layer (Redis) for frequently converted docs
   - Cache conversion results by content hash

### Security

1. **API Authentication** (Not included - add if needed)
   - Add API key middleware in FastAPI
   - Use Render environment variables for secrets

2. **Rate Limiting** (Recommended for production)
   ```python
   from fastapi_limiter import FastAPILimiter
   # Add rate limiting to endpoints
   ```

3. **File Upload Limits**
   - Already handled: `/convert-bytes` endpoint for uploads
   - Set max file size in FastAPI middleware

### Monitoring

1. **Health Check** ✅ Included
   - Endpoint: `GET /health`
   - Returns: `{"status": "ok"}`

2. **Logs**
   - View in Render dashboard: Logs tab
   - Structured logging with uvicorn

3. **Metrics** (Recommended to add)
   - Conversion success rate
   - Response times
   - Document format distribution

### Error Handling

Service returns structured errors:
```json
{
  "success": false,
  "error": "Detailed error message",
  "pages": [],
  "images": []
}
```

HTTP Status Codes:
- `200`: Success
- `400`: Bad request (file not found, invalid format)
- `500`: Server error (conversion failure)

---

## 🔧 Troubleshooting

### Build Fails

**Issue**: Docker build fails with package installation errors
**Solution**: 
```bash
# Clear Docker cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t markitdown-service .
```

### Service Won't Start

**Issue**: Container starts but service doesn't respond
**Solution**: Check logs
```bash
docker logs markitdown
```

Common causes:
- Port already in use
- Missing environment variables
- Insufficient memory

### Conversion Fails

**Issue**: Document conversion returns errors
**Solution**: Check supported formats
```bash
curl http://localhost:5100/formats
```

Ensure document format is supported and file is not corrupted.

### Out of Memory

**Issue**: Service crashes with large PDFs
**Solution**: 
- Upgrade to higher Render plan (2GB+ RAM)
- Use `page_limit` parameter to process fewer pages
- Implement chunked processing

---

## 🔄 Updates & Maintenance

### Update Deployment

```bash
# Make code changes
git add .
git commit -m "Update service"
git push

# Render auto-deploys on push (if auto-deploy enabled)
# Or manually deploy from Render dashboard
```

### Update Dependencies

```bash
# Update requirements-docker.txt
# Update version pins as needed

# Rebuild Docker image
docker build -t markitdown-service:latest .

# Push and deploy
git push
```

### Rollback

In Render dashboard:
1. Go to "Events" tab
2. Find previous successful deployment
3. Click "Rollback"

---

## 📚 API Documentation

After deployment, interactive API docs available at:
- Swagger UI: `https://your-service.onrender.com/docs`
- ReDoc: `https://your-service.onrender.com/redoc`

---

## 🆘 Support

- Documentation: See `README.md` in service directory
- Issues: Create issue in repository
- Render Support: [Render Documentation](https://render.com/docs)
