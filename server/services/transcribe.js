const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const os = require('os');
const { splitAudioWithFfmpeg } = require('../utils/split');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function likelyNotEnglish(text) {
  if (!text) return true;
  // Detect Gurmukhi or non-latin heavy text. Gurmukhi range: 0A00–0A7F
  const gurmukhiRegex = /[\u0A00-\u0A7F]/;
  if (gurmukhiRegex.test(text)) return true;
  // If fewer than ~70% latin letters/spaces, assume not English
  const latin = (text.match(/[A-Za-z\s.,'"?!;:\-]/g) || []).length;
  return latin / Math.max(1, text.length) < 0.7;
}

async function translateToEnglish(text) {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You translate Punjabi (Gurmukhi) speech into clear, natural English. Keep meaning faithful, concise, and readable.' },
      { role: 'user', content: `Translate the following into English. Output only the translation, no preface.\n\n${text}` }
    ],
    temperature: 0.2
  });
  return completion.choices?.[0]?.message?.content?.trim() || '';
}

async function transcribeAudioFile(filePath, { translateToEnglish } = { translateToEnglish: true }) {
  const fileStream = fs.createReadStream(filePath);
  const model = translateToEnglish ? 'whisper-1' : 'whisper-1';

  const response = await client.audio.transcriptions.create({
    file: fileStream,
    model,
    // translate to English if needed
    translate: translateToEnglish,
    // language left unspecified to auto-detect
    // prompt: 'Punjabi Gurmukhi religious discourse.'
  });

  let text = response.text || '';
  const language = response.language || 'pa';
  // If Whisper did not produce English, run a second-pass translation
  if (translateToEnglish && likelyNotEnglish(text)) {
    try {
      text = await translateToEnglish(text);
    } catch (_) {
      // fall through with original text on failure
    }
  }
  return { text, language, segments: response.segments || [] };
}

async function transcribeAndTranslateTextFallback(filePath) {
  const transcript = await transcribeAudioFile(filePath, { translateToEnglish: false });
  const text = transcript.text || '';

  if (!text) return { text: '', language: 'pa', segments: [] };

  const translated = await translateToEnglish(text);
  return { text: translated, language: 'en', segments: transcript.segments };
}

async function transcribeLargeAudio(filePath, options = { translateToEnglish: true }) {
  // Split into 10-minute chunks to avoid timeouts and improve stability
  const tmpDir = path.join(os.tmpdir(), 'yt_chunks_' + Math.random().toString(36).slice(2));
  const chunks = await splitAudioWithFfmpeg(filePath, tmpDir, 600);
  let combined = '';
  for (const chunk of chunks) {
    const part = await transcribeAudioFile(chunk, options);
    combined += (combined ? '\n\n' : '') + part.text;
    try { fs.unlinkSync(chunk); } catch (_) {}
  }
  try { fs.rmdirSync(tmpDir, { recursive: true }); } catch (_) {}
  return { text: combined, language: 'en', segments: [] };
}

module.exports = { transcribeAudioFile, transcribeAndTranslateTextFallback, transcribeLargeAudio };

module.exports = { transcribeAudioFile, transcribeAndTranslateTextFallback };


