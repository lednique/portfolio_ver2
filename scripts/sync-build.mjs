import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const rootAssetsDir = path.join(root, 'assets');

// Remove previous build bundles in root assets/
for (const entry of fs.readdirSync(rootAssetsDir)) {
  if (
    /^(index|app|chunk|dist|c07ae181aa43af6f5421b17f220d46e22dc61cbd|4dc4b7de1c10150df5d1cfc62daf6b61a087c68a)-[A-Za-z0-9_-]+\.(js|css|png|webp|svg)$/.test(entry)
  ) {
    fs.unlinkSync(path.join(rootAssetsDir, entry));
  }
}

// Copy freshly built assets into root assets/
if (fs.existsSync(distAssetsDir)) {
  for (const entry of fs.readdirSync(distAssetsDir)) {
    fs.copyFileSync(
      path.join(distAssetsDir, entry),
      path.join(rootAssetsDir, entry)
    );
  }
}

// Copy built app.html -> root index.html
fs.copyFileSync(path.join(distDir, 'app.html'), path.join(root, 'index.html'));

// Write lightweight legacy/direct route HTML redirects for GitHub Pages compatibility
const redirects = {
  'graphic.html': '#/design',
  'design.html': '#/design',
  'ai.html': '#/ai',
  'ar.html': '#/ar',
  'resume.html': '#/resume',
  'admin.html': '#/admin',
};

for (const [file, hash] of Object.entries(redirects)) {
  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=./index.html${hash}" />
  <title>LEDNIQUE — Redirecting…</title>
  <script>location.replace('./index.html${hash}');</script>
</head>
<body style="background:#000;color:#fff;font-family:sans-serif;padding:40px;">
  <a href="./index.html${hash}" style="color:#cbff31;">Перейти →</a>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, file), html, 'utf8');
}

console.log('Synced dist build into repository root (index.html + assets/ + route redirects).');
