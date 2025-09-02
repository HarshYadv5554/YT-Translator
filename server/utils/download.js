const { spawn } = require('child_process');
const path = require('path');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
    ps.on('error', reject);
    ps.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function downloadYouTubeAudio(url, outDir) {
  const outPath = path.join(outDir, `yt_audio_%(id)s.%(ext)s`);
  // Allow overriding executable paths via env
  const ytdlpCmd = process.env.YTDLP_PATH && process.env.YTDLP_PATH.trim().length > 0
    ? process.env.YTDLP_PATH
    : 'yt-dlp';
  const ffmpegPath = process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim().length > 0
    ? process.env.FFMPEG_PATH
    : undefined;

  const args = [
    '-x', '--audio-format', 'mp3', '--audio-quality', '0',
    '-o', outPath,
  ];
  if (ffmpegPath) {
    args.push('--ffmpeg-location', ffmpegPath);
  }
  args.push(url);

  // Requires yt-dlp and ffmpeg either on PATH or provided via env vars
  await run(ytdlpCmd, args);

  // yt-dlp will output the actual file path; reconstruct with mp3 extension is risky.
  // However, since -x + --audio-format mp3, final file is .mp3. We need the video id to know exact file.
  // For simplicity, run a dry extraction to get id.
  let videoId = '';
  await new Promise((resolve, reject) => {
    const ps = spawn(ytdlpCmd, ['--get-id', url], { shell: true });
    let buf = '';
    ps.stdout.on('data', (d) => (buf += d.toString()));
    ps.on('error', reject);
    ps.on('exit', (code) => {
      if (code === 0) {
        videoId = buf.trim();
        resolve();
      } else reject(new Error('Failed to get video id'));
    });
  });

  const finalPath = path.join(outDir, `yt_audio_${videoId}.mp3`);
  return finalPath;
}

module.exports = { downloadYouTubeAudio };


