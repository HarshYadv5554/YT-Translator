const { spawn } = require('child_process');
const path = require('path');

// Helper function to check if a command exists
function commandExists(command) {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const ps = spawn(cmd, args, { stdio: 'ignore', shell: true });
    ps.on('error', () => resolve(false));
    ps.on('exit', (code) => resolve(code === 0));
  });
}

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
  
  // Allow overriding executable paths via env, with fallbacks for different environments
  let ytdlpCmd = process.env.YTDLP_PATH && process.env.YTDLP_PATH.trim().length > 0
    ? process.env.YTDLP_PATH
    : 'yt-dlp';
  
  let ffmpegPath = process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim().length > 0
    ? process.env.FFMPEG_PATH
    : undefined;

  // Try to find yt-dlp in common locations if not found in PATH
  if (!await commandExists(ytdlpCmd)) {
    const commonPaths = [
      '/usr/local/bin/yt-dlp',
      '/usr/bin/yt-dlp',
      '/root/.local/bin/yt-dlp',
      'python3 -m yt_dlp'
    ];
    
    for (const testPath of commonPaths) {
      if (await commandExists(testPath)) {
        ytdlpCmd = testPath;
        break;
      }
    }
  }

  // Try to find ffmpeg in common locations if not found in PATH
  if (!ffmpegPath && !await commandExists('ffmpeg')) {
    const commonFfmpegPaths = [
      '/usr/local/bin/ffmpeg',
      '/usr/bin/ffmpeg'
    ];
    
    for (const testPath of commonFfmpegPaths) {
      if (await commandExists(testPath)) {
        ffmpegPath = testPath;
        break;
      }
    }
  }

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


