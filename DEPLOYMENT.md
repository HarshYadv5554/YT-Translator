# Deployment Guide for YouTube Transcriber

This guide will help you deploy your YouTube transcriber application to Render.com.

## Prerequisites

1. **Install Render CLI**:
   ```bash
   npm install -g @render/cli
   ```

2. **Login to Render**:
   ```bash
   render auth login
   ```

3. **Set up your OpenAI API Key** (you'll need this for transcription):
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - You'll set this as an environment variable during deployment

## Deployment Options

### Option 1: Using the Deployment Scripts (Recommended)

#### For Windows:
```bash
deploy-render.bat
```

#### For Linux/Mac:
```bash
chmod +x deploy-render.sh
./deploy-render.sh
```

### Option 2: Using npm scripts

1. **Deploy the service**:
   ```bash
   npm run deploy:render
   ```

2. **Set environment variables**:
   ```bash
   npm run deploy:render:env
   ```

3. **Set your OpenAI API key**:
   ```bash
   render env set OPENAI_API_KEY=your_api_key_here
   ```

### Option 3: Manual CLI Deployment

1. **Create the service**:
   ```bash
   render services create \
     --name yt-transcriber \
     --type web \
     --env node \
     --build-command "apt-get update && apt-get install -y python3 python3-pip ffmpeg && python3 -m pip install --user yt-dlp && echo 'export PATH=\"/root/.local/bin:\$PATH\"' >> ~/.bashrc && ln -sf /root/.local/bin/yt-dlp /usr/local/bin/yt-dlp && npm install" \
     --start-command "npm start" \
     --region oregon \
     --plan starter
   ```

2. **Set environment variables**:
   ```bash
   render env set YTDLP_PATH=yt-dlp
   render env set FFMPEG_PATH=ffmpeg
   render env set PORT=10000
   render env set OPENAI_API_KEY=your_api_key_here
   ```

## What the Deployment Does

1. **Installs System Dependencies**:
   - Python 3 and pip for yt-dlp
   - FFmpeg for audio processing
   - yt-dlp via pip

2. **Sets up Paths**:
   - Creates symbolic links for easy access
   - Updates PATH environment variable

3. **Configures Environment**:
   - Sets proper paths for yt-dlp and ffmpeg
   - Configures port and other necessary variables

## Troubleshooting

### Common Issues:

1. **"yt-dlp not found"**:
   - The deployment script installs yt-dlp via pip
   - Check that the build command completed successfully

2. **"ffmpeg not found"**:
   - FFmpeg is installed via apt-get in the build command
   - Verify the build logs in Render dashboard

3. **"OpenAI API key not set"**:
   - Make sure you've set the OPENAI_API_KEY environment variable
   - Check that the key is valid and has sufficient credits

### Checking Deployment Status:

1. **View logs**:
   ```bash
   render logs --service yt-transcriber
   ```

2. **Check service status**:
   ```bash
   render services list
   ```

3. **Test the health endpoint**:
   ```bash
   curl https://yt-transcriber.onrender.com/health
   ```

## Post-Deployment

Once deployed, your app will be available at:
- **URL**: `https://yt-transcriber.onrender.com`
- **Health Check**: `https://yt-transcriber.onrender.com/health`

### Testing the Deployment:

1. **Health Check**:
   ```bash
   curl https://yt-transcriber.onrender.com/health
   ```

2. **Test YouTube Transcription**:
   ```bash
   curl -X POST https://yt-transcriber.onrender.com/api/transcribe-youtube \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for transcription | Yes |
| `PORT` | Port for the application (set to 10000) | No |
| `YTDLP_PATH` | Path to yt-dlp executable | No |
| `FFMPEG_PATH` | Path to ffmpeg executable | No |

## Support

If you encounter issues:
1. Check the Render dashboard logs
2. Verify all environment variables are set
3. Test the health endpoint
4. Check that your OpenAI API key is valid and has credits
