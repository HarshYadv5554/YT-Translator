## Gurmukhi → English Translator (YouTube + Files)

Transcribe Punjabi (Gurmukhi) audio to English using Whisper translate. Supports:
- YouTube URLs (including the live replay you provided)
- Local audio/video uploads
- **NEW**: Chunked transcription for long videos
- **NEW**: Automatic English translation with GPT fallback

### Prerequisites
- Node.js 18+
- Create an OpenAI API key and set it as `OPENAI_API_KEY`
- For YouTube: install `yt-dlp` and `ffmpeg` and ensure both are on PATH
  - Windows: install via `winget`, `scoop`, or `chocolatey`
  - Verify: `yt-dlp --version` and `ffmpeg -version`

### Setup
```
npm install
```

Create a `.env` file in the project root:
```
OPENAI_API_KEY=sk-...
PORT=3001
YTDLP_PATH=C:\path\to\yt-dlp.exe  # Optional: if not on PATH
FFMPEG_PATH=C:\path\to\ffmpeg.exe  # Optional: if not on PATH
```

### Run
```
npm run dev
```
Open `http://localhost:3001` in your browser.

Paste the YouTube URL (e.g. the live replay) or upload a file, then click the corresponding button.

### Features
- **Chunked Processing**: Long videos are split into 10-minute chunks for better transcription
- **Auto-Translation**: Detects non-English output and automatically translates to English
- **Modern UI**: Beautiful gradient design with responsive layout
- **Error Handling**: Comprehensive error messages and fallback mechanisms

### Notes
- YouTube downloads require `yt-dlp` and `ffmpeg` on PATH. If download fails, the API returns a helpful error.
- Transcription defaults to translate into English. If Whisper returns native language, the app falls back to GPT translation to English.
- Large videos may take several minutes to process due to chunking.

## Deployment

### Option 1: Render.com (Recommended)
1. Fork this repository to your GitHub
2. Sign up at [render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repo
5. Set environment variables:
   - `OPENAI_API_KEY`
   - `PORT` (Render will set this)
6. Deploy!

### Option 2: Railway.app
1. Fork this repository to your GitHub
2. Sign up at [railway.app](https://railway.app)
3. Create new project from GitHub repo
4. Set environment variables:
   - `OPENAI_API_KEY`
   - `PORT` (Railway will set this)
5. Deploy!

### Option 3: Vercel
1. Fork this repository to your GitHub
2. Sign up at [vercel.com](https://vercel.com)
3. Import your GitHub repo
4. Set environment variables:
   - `OPENAI_API_KEY`
5. Deploy!

### Important Deployment Notes
- **yt-dlp and ffmpeg**: These tools are NOT available on most cloud platforms
- **Workaround**: For cloud deployment, you'll need to:
   - Use a VPS/cloud server with Ubuntu/Debian
   - Install yt-dlp and ffmpeg on the server
   - Or use Docker with custom image containing these tools
- **Alternative**: Focus on file upload functionality for cloud deployment


