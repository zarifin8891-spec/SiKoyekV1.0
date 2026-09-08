const fs = require('fs');
const path = require('path');

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const url = 'https://fadxsycdgzuctvmhhjty.supabase.co';
const key = 'sb_publishable_kdVGUzaKxMNFiJLpaGgSTQ_KP8IDJ2o';

let html = source;
html = html.replace(/const SUPABASE_URL\s*=\s*'[^']*';/, `const SUPABASE_URL='${url}';`);
html = html.replace(/const SUPABASE_KEY\s*=\s*'[^']*';/, `const SUPABASE_KEY='${key}';`);

if (!html.includes(url) || !html.includes(key)) {
  throw new Error('Konstruva Supabase configuration was not injected. Build stopped.');
}

const outDir = path.join(root, 'dist-konstruva');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Copy the complete static application, preserving all relative assets.
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (['.git', '.github', 'dist-konstruva'].includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(root, outDir);
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Konstruva deployment prepared:', outDir);
