import * as fs from 'node:fs';
import * as path from 'node:path';

const srcImg = 'C:\\Users\\Prajakta\\.gemini\\antigravity\\brain\\18ed5dfd-3d11-4be2-8ffa-a258ad7dcbc9\\media__1786725079771.png';

const destDirs = [
  'C:\\Users\\Prajakta\\Downloads\\Midnightt\\docs',
  'C:\\Users\\Prajakta\\Downloads\\Midnightt\\my-app\\docs'
];

for (const dir of destDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(srcImg, path.join(dir, 'screenshot-deploy.png'));
  fs.copyFileSync(srcImg, path.join(dir, 'screenshot-compile.png'));
}

console.log('✅ Screenshot assets copied successfully!');
