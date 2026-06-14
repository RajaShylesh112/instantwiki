# Docker Hub Push Guide

## 📦 Push MarkItDown Service to Docker Hub

### Prerequisites

1. **Docker Hub Account**
   - Create account at https://hub.docker.com
   - Note your username

2. **Docker Installed**
   - Verify: `docker --version`
   - Download: https://www.docker.com/products/docker-desktop

3. **Docker Running**
   - Start Docker Desktop (Windows/Mac)
   - Or start Docker daemon (Linux)

---

## 🚀 Quick Push (Automated Script)

### Windows
```cmd
cd apps\web\services\markitdown
push-to-dockerhub.bat YOUR_DOCKERHUB_USERNAME 1.0.0
```

### Linux/Mac
```bash
cd apps/web/services/markitdown
chmod +x push-to-dockerhub.sh
./push-to-dockerhub.sh YOUR_DOCKERHUB_USERNAME 1.0.0
```

**The script will:**
1. ✅ Check Docker installation
2. ✅ Log in to Docker Hub (if needed)
3. ✅ Build the Docker image
4. ✅ Tag with version and 'latest'
5. ✅ Push both tags to Docker Hub

---

## 📝 Manual Push (Step-by-Step)

### Step 1: Log in to Docker Hub
```bash
docker login
# Enter your Docker Hub username and password
```

### Step 2: Build the Image
```bash
cd apps/web/services/markitdown

# Build with version tag
docker build -t markitdown-service:1.0.0 .
```

**Build Time:** 5-10 minutes (first time), 1-2 minutes (cached)

### Step 3: Tag for Docker Hub
```bash
# Replace YOUR_USERNAME with your Docker Hub username

# Tag with version
docker tag markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:1.0.0

# Tag as latest
docker tag markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:latest
```

### Step 4: Push to Docker Hub
```bash
# Push version tag
docker push YOUR_USERNAME/markitdown-service:1.0.0

# Push latest tag
docker push YOUR_USERNAME/markitdown-service:latest
```

**Upload Size:** ~800 MB
**Upload Time:** 5-15 minutes (depends on internet speed)

### Step 5: Verify on Docker Hub
Visit: `https://hub.docker.com/r/YOUR_USERNAME/markitdown-service`

---

## 🎯 After Publishing

### Pull and Run Your Image
```bash
# Pull from Docker Hub
docker pull YOUR_USERNAME/markitdown-service:latest

# Run locally
docker run -d -p 5100:5100 \
  -e HOST=0.0.0.0 \
  -e PORT=5100 \
  --name markitdown \
  YOUR_USERNAME/markitdown-service:latest

# Test
curl http://localhost:5100/health
```

### Use in Render
Instead of building from Dockerfile, Render can pull from Docker Hub:

**render.yaml:**
```yaml
services:
  - type: web
    name: instantwiki-markitdown
    runtime: image
    image:
      url: docker.io/YOUR_USERNAME/markitdown-service:latest
    region: oregon
    plan: starter
    
    envVars:
      - key: HOST
        value: 0.0.0.0
    
    healthCheckPath: /health
```

### Use in Docker Compose
```yaml
version: '3.8'
services:
  markitdown:
    image: YOUR_USERNAME/markitdown-service:latest
    ports:
      - "5100:5100"
    environment:
      - HOST=0.0.0.0
      - PORT=5100
    restart: unless-stopped
```

---

## 🏷️ Versioning Strategy

### Semantic Versioning
Use semantic versioning: `MAJOR.MINOR.PATCH`

```bash
# Major version (breaking changes)
docker tag markitdown-service:2.0.0 YOUR_USERNAME/markitdown-service:2.0.0
docker tag markitdown-service:2.0.0 YOUR_USERNAME/markitdown-service:latest

# Minor version (new features)
docker tag markitdown-service:1.1.0 YOUR_USERNAME/markitdown-service:1.1.0

# Patch version (bug fixes)
docker tag markitdown-service:1.0.1 YOUR_USERNAME/markitdown-service:1.0.1
```

### Multiple Tags
```bash
# Push specific version
docker push YOUR_USERNAME/markitdown-service:1.0.0

# Push major.minor
docker tag YOUR_USERNAME/markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:1.0
docker push YOUR_USERNAME/markitdown-service:1.0

# Push major only
docker tag YOUR_USERNAME/markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:1
docker push YOUR_USERNAME/markitdown-service:1

# Push latest
docker push YOUR_USERNAME/markitdown-service:latest
```

This allows users to:
- Pin to exact version: `:1.0.0`
- Get patch updates: `:1.0`
- Get minor updates: `:1`
- Get all updates: `:latest`

---

## 📊 Docker Hub Repository Settings

### Make Repository Public
1. Go to https://hub.docker.com/r/YOUR_USERNAME/markitdown-service/settings
2. Set visibility to **Public** (free tier)
3. Add description and README

### Add README
Docker Hub can display a README from:
- Linked GitHub repository
- Manual README upload

**Recommended README content:**
```markdown
# MarkItDown Microservice

Document-to-Markdown conversion service powered by FastAPI.

## Quick Start

docker pull YOUR_USERNAME/markitdown-service:latest
docker run -p 5100:5100 -e HOST=0.0.0.0 YOUR_USERNAME/markitdown-service

## Features
- 13+ document formats (PDF, DOCX, XLSX, PPTX, etc.)
- REST API with FastAPI
- Health checks and monitoring
- LLM-based OCR support

## Documentation
https://github.com/YOUR_USERNAME/YOUR_REPO

## Endpoints
- GET /health - Health check
- GET /info - Service information
- GET /formats - Supported formats
- POST /convert - Convert document
- POST /convert-batch - Batch conversion
- POST /convert-bytes - Convert from bytes

## Environment Variables
- PORT (default: 5100)
- HOST (default: 0.0.0.0)
- OPENAI_API_KEY (optional, for OCR)
```

---

## 🔐 Security Best Practices

### Use Multi-Factor Authentication
Enable 2FA on your Docker Hub account:
https://hub.docker.com/settings/security

### Use Access Tokens
Instead of password, use Personal Access Tokens:

1. Generate token: https://hub.docker.com/settings/security
2. Use token for login:
   ```bash
   docker login -u YOUR_USERNAME
   # Enter token as password
   ```

### Scan for Vulnerabilities
```bash
# Scan local image
docker scan YOUR_USERNAME/markitdown-service:latest

# View on Docker Hub
# Go to https://hub.docker.com/r/YOUR_USERNAME/markitdown-service/tags
# Docker Hub automatically scans public images
```

---

## 🔄 Update Workflow

### When You Update Code

1. **Update version in pyproject.toml**
   ```toml
   version = "1.1.0"
   ```

2. **Build new version**
   ```bash
   docker build -t markitdown-service:1.1.0 .
   ```

3. **Tag and push**
   ```bash
   docker tag markitdown-service:1.1.0 YOUR_USERNAME/markitdown-service:1.1.0
   docker tag markitdown-service:1.1.0 YOUR_USERNAME/markitdown-service:latest
   docker push YOUR_USERNAME/markitdown-service:1.1.0
   docker push YOUR_USERNAME/markitdown-service:latest
   ```

4. **Update documentation**
   - Update README on Docker Hub
   - Update version in deployment guides
   - Create git tag: `git tag v1.1.0 && git push --tags`

---

## 🐙 GitHub Actions (Automated Push)

Create `.github/workflows/docker-push.yml` for automatic builds:

```yaml
name: Push to Docker Hub

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract version
        id: meta
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./apps/web/services/markitdown
          file: ./apps/web/services/markitdown/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/markitdown-service:${{ steps.meta.outputs.VERSION }}
            ${{ secrets.DOCKERHUB_USERNAME }}/markitdown-service:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Setup:**
1. Add secrets in GitHub: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`
2. Push git tag: `git tag v1.0.0 && git push --tags`
3. GitHub Actions automatically builds and pushes to Docker Hub

---

## 🛠️ Troubleshooting

### Issue: "unauthorized: authentication required"
**Solution:** Log in again
```bash
docker logout
docker login
```

### Issue: "denied: requested access to the resource is denied"
**Solution:** Check repository name matches username
```bash
# Wrong: docker push markitdown-service:latest
# Right: docker push YOUR_USERNAME/markitdown-service:latest
```

### Issue: Build fails during push
**Solution:** Build locally first to verify
```bash
docker build -t markitdown-service:latest .
```

### Issue: "tag does not exist"
**Solution:** Ensure you tagged the image
```bash
docker images | grep markitdown
# Should show both local and remote tags
```

### Issue: Slow upload
**Solution:** 
- Check internet speed
- Use Docker layer caching
- Consider uploading during off-peak hours

---

## 📦 Alternative: Private Registry

If you need a private registry:

### Docker Hub Private Repository
- **Free:** 1 private repository
- **Pro ($5/mo):** Unlimited private repositories

### Self-Hosted Registry
```bash
# Run local registry
docker run -d -p 5000:5000 --name registry registry:2

# Tag for local registry
docker tag markitdown-service:latest localhost:5000/markitdown-service:latest

# Push to local registry
docker push localhost:5000/markitdown-service:latest
```

### Cloud Registries
- **AWS ECR:** Amazon Elastic Container Registry
- **GCP GCR:** Google Container Registry
- **Azure ACR:** Azure Container Registry
- **GitHub Container Registry:** ghcr.io

---

## ✅ Quick Reference

**Build:**
```bash
docker build -t markitdown-service:1.0.0 .
```

**Tag:**
```bash
docker tag markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:1.0.0
docker tag markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:latest
```

**Push:**
```bash
docker push YOUR_USERNAME/markitdown-service:1.0.0
docker push YOUR_USERNAME/markitdown-service:latest
```

**Pull:**
```bash
docker pull YOUR_USERNAME/markitdown-service:latest
```

**Run:**
```bash
docker run -p 5100:5100 -e HOST=0.0.0.0 YOUR_USERNAME/markitdown-service:latest
```

---

## 🎉 Success!

Once pushed, your image is available at:
```
https://hub.docker.com/r/YOUR_USERNAME/markitdown-service
```

Anyone can pull and run it with:
```bash
docker run -p 5100:5100 YOUR_USERNAME/markitdown-service:latest
```

Perfect for:
- ✅ Sharing with team
- ✅ Deploying to production (Render, AWS, etc.)
- ✅ CI/CD pipelines
- ✅ Version control of deployments
