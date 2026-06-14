# Docker Desktop Troubleshooting

## Error: "open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified"

### What This Means
Docker Desktop is installed but **not running**. The Docker daemon (the background service that builds and runs containers) is not started.

---

## ✅ Solution (Quick Fix)

### Step 1: Start Docker Desktop

**Option A: Using Start Menu**
1. Press `Windows` key
2. Type "Docker Desktop"
3. Click "Docker Desktop" to start it
4. Wait for the whale icon 🐋 to appear in the system tray (bottom-right)
5. Wait until the whale icon **stops animating** (30-60 seconds)

**Option B: Using Command**
```cmd
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

**Option C: Using Our Diagnostic Tool**
```cmd
cd apps\web\services\markitdown
check-docker.bat
```
The tool will offer to start Docker Desktop for you!

### Step 2: Verify Docker is Running
```cmd
docker info
```

If you see Docker information (version, containers, images, etc.) - **Docker is ready!**

If you see an error - Docker is still starting. Wait 30 more seconds and try again.

### Step 3: Re-run the Push Script
```cmd
dockerhub-push-interactive.bat
```

---

## 🔍 Detailed Troubleshooting

### Check 1: Is Docker Desktop Installed?
```cmd
where docker
```

**Expected:** Path to docker.exe (e.g., `C:\Program Files\Docker\Docker\resources\bin\docker.exe`)

**If not found:**
- Download and install Docker Desktop: https://www.docker.com/products/docker-desktop
- Restart your computer after installation

### Check 2: Is Docker Desktop Running?
Look at your system tray (bottom-right corner):
- ✅ **Whale icon present and still** = Docker is running
- ⚠️ **Whale icon animating** = Docker is starting (wait)
- ❌ **No whale icon** = Docker is not running (start it)

### Check 3: Can You Connect to Docker Daemon?
```cmd
docker version
```

**Expected Output:**
```
Client:
 Version:           24.0.x
 ...

Server:
 Version:           24.0.x
 ...
```

**If you only see Client but no Server:**
- Docker daemon is not running
- Start Docker Desktop (see Step 1 above)

### Check 4: Is Docker Engine Actually Running?
```cmd
docker info
```

**Expected:** Long output with system information

**If error:** Docker daemon not running or not accessible

---

## 🚨 Common Issues & Fixes

### Issue 1: Docker Desktop Won't Start

**Symptoms:**
- Clicking Docker Desktop does nothing
- Whale icon appears then disappears
- Error: "Docker Desktop starting..." forever

**Solutions:**

1. **Restart Docker Desktop Service**
   ```cmd
   net stop com.docker.service
   net start com.docker.service
   ```

2. **Restart Computer**
   Sometimes Windows services get stuck. A full restart often fixes it.

3. **Check System Requirements**
   - Windows 10/11 Pro, Enterprise, or Education
   - OR Windows 10/11 Home with WSL 2
   - Virtualization enabled in BIOS

4. **Check WSL 2**
   ```cmd
   wsl --status
   ```
   If WSL 2 not installed:
   ```cmd
   wsl --install
   ```

5. **Reset Docker Desktop**
   - Open Docker Desktop
   - Click Settings (gear icon)
   - Go to "Troubleshoot"
   - Click "Reset to factory defaults"
   - Restart Docker Desktop

### Issue 2: Docker Commands Work But Build Fails

**Solution:** Switch Docker context
```cmd
docker context ls
docker context use default
```

### Issue 3: "permission denied" Errors

**Solution:** Run as Administrator
- Right-click Command Prompt
- Select "Run as administrator"
- Navigate to directory and run script

### Issue 4: "insufficient disk space"

**Check available space:**
```cmd
docker system df
```

**Clean up unused images:**
```cmd
docker system prune -a
```

### Issue 5: Firewall/Antivirus Blocking Docker

**Solution:**
1. Temporarily disable antivirus
2. Add Docker Desktop to firewall exceptions
3. Allow Docker Desktop in Windows Defender

---

## 🛠️ Manual Docker Start Process

If automatic start doesn't work:

### Windows PowerShell (Run as Administrator)
```powershell
# Start Docker Desktop service
Start-Service -Name "com.docker.service"

# Wait for it to start
Start-Sleep -Seconds 30

# Verify
docker info
```

### Windows Services
1. Press `Windows + R`
2. Type `services.msc`
3. Find "Docker Desktop Service"
4. Right-click → Start
5. Wait 30-60 seconds
6. Test: `docker info`

---

## 🔄 Complete Reset Process

If nothing works:

### Step 1: Uninstall Docker Desktop
1. Settings → Apps → Docker Desktop → Uninstall
2. Delete remaining files:
   - `C:\Program Files\Docker`
   - `%USERPROFILE%\AppData\Local\Docker`
   - `%USERPROFILE%\AppData\Roaming\Docker`

### Step 2: Reinstall
1. Download latest Docker Desktop: https://www.docker.com/products/docker-desktop
2. Run installer
3. Restart computer
4. Start Docker Desktop
5. Wait for initialization (can take 2-3 minutes first time)

### Step 3: Verify
```cmd
docker --version
docker info
docker run hello-world
```

---

## ✅ Verification Checklist

Before running the push script, verify:

- [ ] Docker Desktop icon visible in system tray
- [ ] Icon is not animating (static whale)
- [ ] `docker --version` shows version
- [ ] `docker info` shows server information
- [ ] `docker images` lists images (even if empty)
- [ ] `docker ps` works (even if no containers)

**All checks passed?** You're ready to build and push! ✅

---

## 🆘 Still Having Issues?

### Get Docker Logs
```cmd
docker system info --format '{{json .}}' > docker-info.txt
```

### Check Docker Desktop Logs
Location: `%APPDATA%\Docker\log.txt`

### Common Log Errors & Solutions

**"WSL 2 installation incomplete"**
```cmd
wsl --install
wsl --set-default-version 2
```

**"Hyper-V not enabled"**
- Open PowerShell as Administrator
- Run: `Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All`
- Restart computer

**"Virtualization disabled"**
- Restart computer
- Enter BIOS (usually F2, F12, or DEL during boot)
- Find "Virtualization Technology" or "VT-x" or "AMD-V"
- Enable it
- Save and exit BIOS

---

## 📞 Support Resources

- **Docker Desktop Docs:** https://docs.docker.com/desktop/
- **Docker Community:** https://forums.docker.com/
- **GitHub Issues:** https://github.com/docker/for-win/issues
- **Stack Overflow:** Tag with `docker` and `windows`

---

## 🎯 Quick Reference Commands

```cmd
REM Check Docker status
docker info

REM Start Docker Desktop
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

REM Restart Docker service
net stop com.docker.service
net start com.docker.service

REM Clean up Docker
docker system prune -a

REM Check WSL
wsl --status

REM Update WSL
wsl --update

REM Test Docker
docker run hello-world
```

---

## ✨ Pro Tips

1. **Set Docker Desktop to Start on Boot**
   - Open Docker Desktop
   - Settings → General
   - Check "Start Docker Desktop when you log in"

2. **Wait for Full Initialization**
   - After starting Docker Desktop, wait until the whale icon stops animating
   - First start after reboot can take 1-2 minutes

3. **Use Our Diagnostic Tool**
   ```cmd
   check-docker.bat
   ```
   It automatically checks everything and offers to start Docker!

4. **Allocate More Resources** (if builds are slow)
   - Docker Desktop → Settings → Resources
   - Increase CPUs and Memory
   - Apply & Restart

---

**Most Common Fix:** Just start Docker Desktop and wait 30-60 seconds! 🚀
