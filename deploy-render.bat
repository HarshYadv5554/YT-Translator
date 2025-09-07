@echo off
REM Deploy to Render.com using CLI
REM Make sure you have the Render CLI installed: https://render.com/docs/cli

echo 🚀 Starting deployment to Render...

REM Check if render CLI is installed
where render >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Render CLI not found. Please install it first:
    echo    npm install -g @render/cli
    echo    or visit: https://render.com/docs/cli
    pause
    exit /b 1
)

REM Login to Render (if not already logged in)
echo 🔐 Checking Render authentication...
render auth whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo Please log in to Render:
    render auth login
)

REM Create or update the service
echo 📦 Deploying service...
render services create --name yt-transcriber --type web --env node --build-command "apt-get update && apt-get install -y python3 python3-pip ffmpeg && python3 -m pip install --user yt-dlp && echo 'export PATH=\"/root/.local/bin:\$PATH\"' >> ~/.bashrc && ln -sf /root/.local/bin/yt-dlp /usr/local/bin/yt-dlp && npm install" --start-command "npm start" --region oregon --plan starter

REM Set environment variables
echo 🔧 Setting environment variables...
render env set YTDLP_PATH=yt-dlp
render env set FFMPEG_PATH=ffmpeg
render env set PORT=10000

echo ✅ Deployment initiated! Check your Render dashboard for progress.
echo 🌐 Your app will be available at: https://yt-transcriber.onrender.com
pause
