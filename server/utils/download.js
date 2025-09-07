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

// Helper function to find executable in PATH
function findExecutable(executable) {
  return new Promise((resolve) => {
    const ps = spawn('which', [executable], { stdio: 'pipe', shell: true });
    let output = '';
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });
    ps.on('error', () => resolve(null));
    ps.on('exit', (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        resolve(null);
      }
    });
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
  
  console.log('🔍 Detecting yt-dlp and ffmpeg paths...');
  
  // Allow overriding executable paths via env, with fallbacks for different environments
  let ytdlpCmd = process.env.YTDLP_PATH && process.env.YTDLP_PATH.trim().length > 0
    ? process.env.YTDLP_PATH
    : 'yt-dlp';
  
  let ffmpegPath = process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim().length > 0
    ? process.env.FFMPEG_PATH
    : undefined;

  // Try to find yt-dlp using which command first
  if (!await commandExists(ytdlpCmd)) {
    console.log('🔍 yt-dlp not found in PATH, searching...');
    const foundPath = await findExecutable('yt-dlp');
    if (foundPath) {
      ytdlpCmd = foundPath;
      console.log(`✅ Found yt-dlp at: ${foundPath}`);
    } else {
      // Try common locations
      const commonPaths = [
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
        '/root/.local/bin/yt-dlp',
        '/opt/homebrew/bin/yt-dlp'
      ];
      
      for (const testPath of commonPaths) {
        if (await commandExists(testPath)) {
          ytdlpCmd = testPath;
          console.log(`✅ Found yt-dlp at: ${testPath}`);
          break;
        }
      }
      
      // Last resort: try python module
      if (!await commandExists(ytdlpCmd)) {
        if (await commandExists('python3 -m yt_dlp')) {
          ytdlpCmd = 'python3 -m yt_dlp';
          console.log('✅ Using yt-dlp via python3 -m yt_dlp');
        }
      }
    }
  } else {
    console.log(`✅ Using yt-dlp from PATH: ${ytdlpCmd}`);
  }

  // Try to find ffmpeg using which command first
  if (!ffmpegPath) {
    if (await commandExists('ffmpeg')) {
      ffmpegPath = 'ffmpeg';
      console.log('✅ Found ffmpeg in PATH');
    } else {
      console.log('🔍 ffmpeg not found in PATH, searching...');
      const foundPath = await findExecutable('ffmpeg');
      if (foundPath) {
        ffmpegPath = foundPath;
        console.log(`✅ Found ffmpeg at: ${foundPath}`);
      } else {
        // Try common locations
        const commonFfmpegPaths = [
          '/usr/local/bin/ffmpeg',
          '/usr/bin/ffmpeg',
          '/opt/homebrew/bin/ffmpeg'
        ];
        
        for (const testPath of commonFfmpegPaths) {
          if (await commandExists(testPath)) {
            ffmpegPath = testPath;
            console.log(`✅ Found ffmpeg at: ${testPath}`);
            break;
          }
        }
      }
    }
  } else {
    console.log(`✅ Using ffmpeg from env: ${ffmpegPath}`);
  }

  // Final validation
  if (!await commandExists(ytdlpCmd)) {
    throw new Error(`yt-dlp not found. Tried: ${ytdlpCmd}. Please ensure yt-dlp is installed and accessible.`);
  }
  
  if (!ffmpegPath || !await commandExists(ffmpegPath)) {
    throw new Error(`ffmpeg not found. Tried: ${ffmpegPath}. Please ensure ffmpeg is installed and accessible.`);
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


