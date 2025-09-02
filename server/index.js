const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const { transcribeAudioFile, transcribeAndTranslateTextFallback, transcribeLargeAudio } = require('./services/transcribe');
const { downloadYouTubeAudio } = require('./utils/download');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/health', (_req, res) => {
  res.json({ ok: true, port: PORT, yt_dlp: process.env.YTDLP_PATH || 'yt-dlp', ffmpeg: process.env.FFMPEG_PATH || 'ffmpeg' });
});

const upload = multer({ dest: path.join(__dirname, '..', 'tmp') });

app.post('/api/transcribe-file', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = req.file.path;
  try {
    const result = await transcribeAudioFile(filePath, { translateToEnglish: true });
    return res.json(result);
  } catch (err) {
    try {
      const fallback = await transcribeAndTranslateTextFallback(filePath);
      return res.json(fallback);
    } catch (innerErr) {
      return res.status(500).json({ error: 'Transcription failed', details: String(innerErr?.message || innerErr) });
    }
  } finally {
    fs.unlink(filePath, () => {});
  }
});

app.post('/api/transcribe-youtube', async (req, res) => {
  const url = req.body?.url;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }
  const tmpDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  try {
    const audioFilePath = await downloadYouTubeAudio(url, tmpDir);
    try {
      // For long videos, do chunked transcription to avoid incomplete outputs
      const result = await transcribeLargeAudio(audioFilePath, { translateToEnglish: true });
      return res.json(result);
    } catch (err) {
      try {
        const fallback = await transcribeAndTranslateTextFallback(audioFilePath);
        return res.json(fallback);
      } catch (innerErr) {
        return res.status(500).json({ error: 'Transcription failed', details: String(innerErr?.message || innerErr) });
      }
    } finally {
      fs.unlink(audioFilePath, () => {});
    }
  } catch (e) {
    return res.status(500).json({ error: 'Failed to download audio. Ensure yt-dlp and ffmpeg are installed and on PATH.', details: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


