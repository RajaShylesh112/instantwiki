# Quick Docker Hub Push Commands

## Copy-Paste Commands (Replace YOUR_USERNAME)

### Step 1: Navigate to Directory
```cmd
cd /d "C:\Users\rsmgo\Desktop\Prog\Projects\.Personal\instantwiki\apps\web\services\markitdown"
```

### Step 2: Login to Docker Hub
```cmd
docker login
```
*Enter your Docker Hub username and password when prompted*

### Step 3: Build Image
```cmd
docker build -t markitdown-service:1.0.0 .
```
*This takes 5-10 minutes first time*

### Step 4: Tag for Docker Hub
```cmd
REM Replace YOUR_USERNAME with your actual Docker Hub username
docker tag markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:1.0.0
docker tag markitdown-service:1.0.0 YOUR_USERNAME/markitdown-service:latest
```

### Step 5: Push to Docker Hub
```cmd
docker push YOUR_USERNAME/markitdown-service:1.0.0
docker push YOUR_USERNAME/markitdown-service:latest
```
*This takes 5-15 minutes depending on internet speed*

### Step 6: Verify
Visit: `https://hub.docker.com/r/YOUR_USERNAME/markitdown-service`

---

## Example (If your username is "johndoe")

```cmd
cd /d "C:\Users\rsmgo\Desktop\Prog\Projects\.Personal\instantwiki\apps\web\services\markitdown"
docker login
docker build -t markitdown-service:1.0.0 .
docker tag markitdown-service:1.0.0 johndoe/markitdown-service:1.0.0
docker tag markitdown-service:1.0.0 johndoe/markitdown-service:latest
docker push johndoe/markitdown-service:1.0.0
docker push johndoe/markitdown-service:latest
```

---

## Or Use Interactive Script

Simply double-click:
```
dockerhub-push-interactive.bat
```

The script will guide you through each step interactively!

---

## Test After Push

```cmd
REM Pull from Docker Hub
docker pull YOUR_USERNAME/markitdown-service:latest

REM Run locally
docker run -d -p 5100:5100 -e HOST=0.0.0.0 YOUR_USERNAME/markitdown-service:latest

REM Test health endpoint
curl http://localhost:5100/health
```

---

## Troubleshooting

### "Docker not found"
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Start Docker Desktop
- Restart terminal

### "Cannot connect to Docker daemon"
- Start Docker Desktop
- Wait for Docker to fully start (whale icon in system tray)

### "unauthorized: authentication required"
- Run: `docker login`
- Enter correct username and password

### "denied: requested access to the resource is denied"
- Make sure you're using YOUR username, not "YOUR_USERNAME"
- Example: `docker push johndoe/markitdown-service:latest`
