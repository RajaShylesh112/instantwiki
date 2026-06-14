@echo off
echo ==========================================
echo   Docker Desktop Diagnostic Tool
echo ==========================================
echo.

echo [1/5] Checking if Docker command exists...
where docker >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Docker command not found in PATH
    echo.
    echo Solution: Install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
) else (
    echo [OK] Docker command found
)
echo.

echo [2/5] Checking Docker version...
docker --version 2>nul
if errorlevel 1 (
    echo [FAIL] Cannot get Docker version
) else (
    echo [OK] Docker version retrieved
)
echo.

echo [3/5] Checking if Docker daemon is running...
docker info >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Docker daemon is NOT running
    echo.
    echo This is the problem! Docker Desktop is not started.
    echo.
    echo Solutions:
    echo 1. Start Docker Desktop manually:
    echo    - Press Windows key and search for "Docker Desktop"
    echo    - Click to start it
    echo    - Wait for the whale icon to appear in system tray
    echo    - Wait until the whale icon stops animating (about 30-60 seconds)
    echo.
    echo 2. Or run this command to start it:
    echo    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo.
    set /p START="Would you like me to try starting Docker Desktop now? (Y/N): "
    if /i "!START!"=="Y" (
        echo.
        echo Starting Docker Desktop...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo.
        echo Waiting for Docker Desktop to start...
        echo This may take 30-60 seconds...
        timeout /t 10 /nobreak >nul
        
        REM Check multiple times
        for /L %%i in (1,1,12) do (
            echo Checking... attempt %%i of 12
            docker info >nul 2>&1
            if not errorlevel 1 (
                echo.
                echo [SUCCESS] Docker Desktop is now running!
                goto :docker_ready
            )
            timeout /t 5 /nobreak >nul
        )
        
        echo.
        echo [WARNING] Docker Desktop is still starting...
        echo Please wait until the Docker whale icon in the system tray stops animating.
        echo Then re-run the dockerhub-push-interactive.bat script.
    )
    pause
    exit /b 1
) else (
    echo [OK] Docker daemon is running
)
echo.

:docker_ready
echo [4/5] Testing Docker build capability...
docker images >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Cannot list Docker images
    pause
    exit /b 1
) else (
    echo [OK] Docker build capability available
)
echo.

echo [5/5] Checking Docker context...
docker context show 2>nul
echo.

echo ==========================================
echo   Docker Status: READY
echo ==========================================
echo.
echo Docker Desktop is running and ready to build images!
echo.
echo You can now run: dockerhub-push-interactive.bat
echo.
pause
