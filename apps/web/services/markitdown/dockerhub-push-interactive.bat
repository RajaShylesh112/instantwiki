@echo off
REM Interactive Docker Hub Push Script for Windows
setlocal EnableDelayedExpansion

echo.
echo ==========================================
echo   MarkItDown - Docker Hub Push Wizard
echo ==========================================
echo.

REM Check Docker installation
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not running!
    echo.
    echo Please:
    echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo 2. Start Docker Desktop
    echo 3. Run this script again
    pause
    exit /b 1
)
echo [OK] Docker is installed and running
echo.

REM Get Docker Hub username
set /p DOCKERHUB_USERNAME="Enter your Docker Hub username: "
if "%DOCKERHUB_USERNAME%"=="" (
    echo [ERROR] Username cannot be empty!
    pause
    exit /b 1
)

REM Get version
set /p VERSION="Enter version tag (default: 1.0.0): "
if "%VERSION%"=="" set "VERSION=1.0.0"

echo.
echo Configuration:
echo   Docker Hub Username: %DOCKERHUB_USERNAME%
echo   Version: %VERSION%
echo   Image: markitdown-service
echo.
set /p CONFIRM="Continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo ==========================================
echo Step 1: Docker Hub Login
echo ==========================================
echo.
docker login
if errorlevel 1 (
    echo [ERROR] Docker Hub login failed!
    pause
    exit /b 1
)
echo [OK] Logged in successfully
echo.

echo ==========================================
echo Step 2: Building Docker Image
echo ==========================================
echo.
echo This may take 5-10 minutes on first build...
echo.
docker build -t markitdown-service:%VERSION% .
if errorlevel 1 (
    echo [ERROR] Docker build failed!
    echo.
    echo Troubleshooting:
    echo 1. Check that Dockerfile exists in current directory
    echo 2. Check requirements-docker.txt exists
    echo 3. Check your internet connection
    echo 4. Try: docker builder prune
    pause
    exit /b 1
)
echo.
echo [OK] Image built successfully
echo.

echo ==========================================
echo Step 3: Tagging Images
echo ==========================================
echo.
docker tag markitdown-service:%VERSION% %DOCKERHUB_USERNAME%/markitdown-service:%VERSION%
docker tag markitdown-service:%VERSION% %DOCKERHUB_USERNAME%/markitdown-service:latest
echo [OK] Tagged as:
echo   - %DOCKERHUB_USERNAME%/markitdown-service:%VERSION%
echo   - %DOCKERHUB_USERNAME%/markitdown-service:latest
echo.

echo ==========================================
echo Step 4: Pushing to Docker Hub
echo ==========================================
echo.
echo This may take 5-15 minutes depending on your internet speed...
echo.
echo Pushing version %VERSION%...
docker push %DOCKERHUB_USERNAME%/markitdown-service:%VERSION%
if errorlevel 1 (
    echo [ERROR] Failed to push version tag!
    pause
    exit /b 1
)
echo [OK] Pushed version %VERSION%
echo.

echo Pushing latest tag...
docker push %DOCKERHUB_USERNAME%/markitdown-service:latest
if errorlevel 1 (
    echo [ERROR] Failed to push latest tag!
    pause
    exit /b 1
)
echo [OK] Pushed latest tag
echo.

echo ==========================================
echo          SUCCESS!
echo ==========================================
echo.
echo Your image is now available on Docker Hub!
echo.
echo Docker Hub URL:
echo   https://hub.docker.com/r/%DOCKERHUB_USERNAME%/markitdown-service
echo.
echo To pull and run from anywhere:
echo   docker pull %DOCKERHUB_USERNAME%/markitdown-service:latest
echo   docker run -p 5100:5100 -e HOST=0.0.0.0 %DOCKERHUB_USERNAME%/markitdown-service:latest
echo.
echo To test locally:
echo   curl http://localhost:5100/health
echo.
echo Next steps:
echo 1. Visit Docker Hub to verify: https://hub.docker.com/r/%DOCKERHUB_USERNAME%/markitdown-service
echo 2. Add a description and README to your Docker Hub repository
echo 3. Update your Render deployment to use this image
echo.

pause
endlocal
