@echo off
REM ============================================================================
REM Push MarkItDown Service to Docker Hub - Windows Batch Script
REM ============================================================================
REM Usage: push-to-dockerhub.bat [DOCKERHUB_USERNAME] [VERSION]
REM Example: push-to-dockerhub.bat myusername 1.0.0
REM ============================================================================

setlocal EnableDelayedExpansion

REM Configuration
set "DOCKERHUB_USERNAME=%1"
set "VERSION=%2"
if "%VERSION%"=="" set "VERSION=1.0.0"
set "IMAGE_NAME=markitdown-service"
set "LATEST_TAG=latest"

REM Colors (basic for Windows)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM Validation
if "%DOCKERHUB_USERNAME%"=="" (
    echo %RED%Error: Docker Hub username required%NC%
    echo Usage: push-to-dockerhub.bat [DOCKERHUB_USERNAME] [VERSION]
    echo Example: push-to-dockerhub.bat johndoe 1.0.0
    exit /b 1
)

echo.
echo ======================================
echo Docker Hub Push Script
echo ======================================
echo Docker Hub Username: %DOCKERHUB_USERNAME%
echo Image Name: %IMAGE_NAME%
echo Version: %VERSION%
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: Docker is not installed or not in PATH%NC%
    exit /b 1
)
echo [OK] Docker is installed

REM Check Docker login status
echo.
echo Checking Docker Hub login...
docker info | findstr /C:"Username" >nul 2>&1
if errorlevel 1 (
    echo Not logged in to Docker Hub. Logging in...
    docker login
    if errorlevel 1 (
        echo %RED%Error: Docker login failed%NC%
        exit /b 1
    )
) else (
    echo [OK] Already logged in to Docker Hub
)

REM Build the Docker image
echo.
echo Building Docker image...
docker build -t %IMAGE_NAME%:%VERSION% .
if errorlevel 1 (
    echo %RED%Error: Docker build failed%NC%
    exit /b 1
)
echo [OK] Docker image built successfully

REM Tag images for Docker Hub
echo.
echo Tagging images for Docker Hub...

REM Tag with version
docker tag %IMAGE_NAME%:%VERSION% %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%VERSION%
echo [OK] Tagged: %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%VERSION%

REM Tag as latest
docker tag %IMAGE_NAME%:%VERSION% %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%LATEST_TAG%
echo [OK] Tagged: %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%LATEST_TAG%

REM Push to Docker Hub
echo.
echo Pushing to Docker Hub...

REM Push version tag
echo Pushing version %VERSION%...
docker push %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%VERSION%
if errorlevel 1 (
    echo %RED%Error: Failed to push version tag%NC%
    exit /b 1
)
echo [OK] Pushed: %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%VERSION%

REM Push latest tag
echo Pushing latest tag...
docker push %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%LATEST_TAG%
if errorlevel 1 (
    echo %RED%Error: Failed to push latest tag%NC%
    exit /b 1
)
echo [OK] Pushed: %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%LATEST_TAG%

REM Success summary
echo.
echo ======================================
echo SUCCESS! Images pushed to Docker Hub
echo ======================================
echo.
echo Your images are now available:
echo   - %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%VERSION%
echo   - %DOCKERHUB_USERNAME%/%IMAGE_NAME%:%LATEST_TAG%
echo.
echo To pull and run:
echo   docker pull %DOCKERHUB_USERNAME%/%IMAGE_NAME%:latest
echo   docker run -p 5100:5100 -e HOST=0.0.0.0 %DOCKERHUB_USERNAME%/%IMAGE_NAME%:latest
echo.
echo Docker Hub URL:
echo   https://hub.docker.com/r/%DOCKERHUB_USERNAME%/%IMAGE_NAME%
echo.

endlocal
