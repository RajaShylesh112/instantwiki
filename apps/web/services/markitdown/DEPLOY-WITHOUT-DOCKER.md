# Deploy MarkItDown Service WITHOUT Local Docker

## 🎯 You Don't Need Docker Locally!

Since Docker Desktop isn't working on your machine, here are **better alternatives** that build and deploy directly in the cloud.

---

## ✅ Option 1: Render Direct Deploy (EASIEST) ⭐

Render builds Docker images in the cloud - you don't need Docker locally!

### Steps:

1. **Push your code to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Add MarkItDown Docker service"
   git push
   ```

2. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click "New +" → "Web Service"

3. **Connect Repository**
   - Select your repository
   - Render will detect the Dockerfile automatically

4. **Configure Service**
   ```
   Name: markitdown-service
   Region: Oregon (or your preference)
   Branch: main
   Root Directory: apps/web/services/markitdown
   Runtime: Docker
   
   Build Command: (leave empty - Docker handles it)
   Start Command: (leave empty - uses Dockerfile CMD)
   
   Plan: Starter (free)
   ```

5. **Add Environment Variables**
   ```
   HOST = 0.0.0.0
   ```
   
   Optional (for OCR):
   ```
   OPENAI_API_KEY = your-key-here
   OPENAI_BASE_URL = https://api.openai.com/v1
   ```

6. **Click "Create Web Service"**
   - Render builds the Docker image in the cloud
   - Takes 5-10 minutes
   - You get a live URL: `https://markitdown-service-xxxxx.onrender.com`

**No Docker needed on your machine!** ✅

---

## ✅ Option 2: GitHub Actions → Docker Hub

Let GitHub build and push to Docker Hub for you!

### Steps:

1. **Create GitHub Repository Secrets**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add secrets:
     - `DOCKERHUB_USERNAME` = your Docker Hub username
     - `DOCKERHUB_TOKEN` = your Docker Hub access token (create at https://hub.docker.com/settings/security)

2. **Create GitHub Actions Workflow**

Create file: `.github/workflows/docker-publish.yml`

```yaml
name: Build and Push to Docker Hub

on:
  push:
    branches: [ main ]
    paths:
      - 'apps/web/services/markitdown/**'
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract version
        id: version
        run: echo "VERSION=$(date +%Y%m%d-%H%M%S)" >> $GITHUB_OUTPUT
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./apps/web/services/markitdown
          file: ./apps/web/services/markitdown/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/markitdown-service:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/markitdown-service:${{ steps.version.outputs.VERSION }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Image digest
        run: echo "Image pushed successfully!"
```

3. **Push to GitHub**
   ```bash
   git add .github/workflows/docker-publish.yml
   git commit -m "Add GitHub Actions workflow for Docker build"
   git push
   ```

4. **GitHub Builds Automatically**
   - Go to: Repository → Actions tab
   - Watch the build progress
   - Image is automatically pushed to Docker Hub!

**No Docker needed on your machine!** ✅

---

## ✅ Option 3: GitLab CI/CD → Docker Hub

Similar to GitHub Actions, GitLab can build for you.

### Steps:

1. **Add GitLab Variables**
   - Settings → CI/CD → Variables
   - Add:
     - `DOCKERHUB_USERNAME`
     - `DOCKERHUB_TOKEN`

2. **Create `.gitlab-ci.yml`**

```yaml
image: docker:latest

services:
  - docker:dind

stages:
  - build
  - push

variables:
  DOCKER_DRIVER: overlay2
  IMAGE_NAME: markitdown-service

build-and-push:
  stage: build
  script:
    - cd apps/web/services/markitdown
    - docker login -u $DOCKERHUB_USERNAME -p $DOCKERHUB_TOKEN
    - docker build -t $DOCKERHUB_USERNAME/$IMAGE_NAME:latest .
    - docker push $DOCKERHUB_USERNAME/$IMAGE_NAME:latest
  only:
    - main
```

3. **Push to GitLab**
   - GitLab CI/CD automatically builds and pushes

**No Docker needed on your machine!** ✅

---

## ✅ Option 4: Render Blueprint (Infrastructure as Code)

Use the `render.yaml` file I created - Render builds in the cloud!

### Steps:

1. **Ensure render.yaml is in your repo**
   ```bash
   git add apps/web/services/markitdown/render.yaml
   git commit -m "Add Render blueprint"
   git push
   ```

2. **Create Blueprint in Render**
   - Render Dashboard → New + → Blueprint
   - Connect repository
   - Render reads `render.yaml` and configures everything

3. **Deploy**
   - Render builds Docker image in the cloud
   - Automatic deployment on every git push

**No Docker needed on your machine!** ✅

---

## ✅ Option 5: Use Pre-built Image (If Someone Else Builds)

If you have a teammate or CI/CD building the image:

### Pull and Run Pre-built Image
```bash
docker pull username/markitdown-service:latest
docker run -p 5100:5100 username/markitdown-service:latest
```

### Or Deploy Pre-built Image to Render

**render.yaml:**
```yaml
services:
  - type: web
    name: markitdown-service
    runtime: image
    image:
      url: docker.io/username/markitdown-service:latest
    envVars:
      - key: HOST
        value: 0.0.0.0
```

---

## 🎯 RECOMMENDED: Render Direct Deploy

**This is the easiest option and requires ZERO local Docker setup!**

### Quick Summary:
1. Push code to GitHub/GitLab
2. Create Web Service in Render
3. Point to your repository
4. Render builds Docker in the cloud
5. Done! Live service in 10 minutes

### What You Need:
- ✅ GitHub/GitLab account
- ✅ Render account (free)
- ✅ Your code pushed to git

### What You DON'T Need:
- ❌ Docker Desktop installed
- ❌ Docker running locally
- ❌ Any local building

---

## 📊 Comparison

| Method | Requires Local Docker | Build Location | Push to Docker Hub | Deploy to Production |
|--------|----------------------|----------------|-------------------|---------------------|
| **Render Direct** | ❌ No | Render Cloud | ❌ No | ✅ Yes |
| **GitHub Actions** | ❌ No | GitHub | ✅ Yes | Manual |
| **GitLab CI/CD** | ❌ No | GitLab | ✅ Yes | Manual |
| **Render Blueprint** | ❌ No | Render Cloud | ❌ No | ✅ Yes |
| **Local Docker** | ✅ Yes | Your PC | ✅ Yes | Manual |

---

## 🚀 Let's Use Render Direct Deploy!

Since Docker isn't working on your machine, let's go with **Render Direct Deploy**:

### Step-by-Step:

1. **Make sure your code is pushed to GitHub:**
   ```bash
   cd "C:\Users\rsmgo\Desktop\Prog\Projects\.Personal\instantwiki"
   git status
   git add apps/web/services/markitdown/
   git commit -m "Add MarkItDown Docker service"
   git push
   ```

2. **Go to Render:**
   - Visit: https://dashboard.render.com/register
   - Sign up with GitHub (easiest - auto-connects repos)

3. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Select your `instantwiki` repository
   - Configure:
     ```
     Name: markitdown-service
     Root Directory: apps/web/services/markitdown
     Runtime: Docker
     Branch: main
     Plan: Starter (Free)
     ```

4. **Add Environment Variable:**
   ```
   HOST = 0.0.0.0
   ```

5. **Click "Create Web Service"**

6. **Wait 5-10 minutes** for Render to:
   - Clone your repo
   - Build Docker image in the cloud
   - Deploy the service
   - Give you a live URL!

7. **Test Your Service:**
   ```bash
   curl https://your-service.onrender.com/health
   ```

**That's it!** No Docker needed on your machine! 🎉

---

## 💡 Why This is Better

**Advantages of cloud building:**
1. ✅ No local Docker installation needed
2. ✅ No Windows/WSL issues
3. ✅ Faster - cloud servers have better internet
4. ✅ Automatic rebuilds on git push
5. ✅ Free tier available
6. ✅ Production-ready immediately
7. ✅ Works from any computer

**When you need local Docker:**
- Testing builds locally before pushing
- Developing Docker configurations
- Offline development

---

## 🆘 Need Help with Render?

I can guide you through the Render deployment if you want. Just let me know:
- Do you have a GitHub/GitLab account?
- Is your code already pushed to a repository?
- Do you want me to create detailed Render setup instructions?

---

**Bottom Line:** Skip Docker Desktop entirely and let Render build in the cloud! 🚀
