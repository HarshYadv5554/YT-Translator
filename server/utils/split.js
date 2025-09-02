const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const ps = spawn(command, args, { stdio: 'inherit', shell: true });
    ps.on('error', reject);
    ps.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))));
  });
}

async function splitAudioWithFfmpeg(inputPath, outDir, secondsPerChunk = 600) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const ffmpegPath = process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim().length > 0
    ? process.env.FFMPEG_PATH
    : 'ffmpeg';
  const outTemplate = path.join(outDir, 'chunk_%03d.mp3');
  const args = [
    '-y',
    '-i', inputPath,
    '-f', 'segment',
    '-segment_time', String(secondsPerChunk),
    '-c', 'copy',
    outTemplate,
  ];
  await run(ffmpegPath, args);
  // collect chunk file paths in order
  const files = fs.readdirSync(outDir)
    .filter((f) => f.startsWith('chunk_') && f.endsWith('.mp3'))
    .sort()
    .map((f) => path.join(outDir, f));
  return files;
}

module.exports = { splitAudioWithFfmpeg };


