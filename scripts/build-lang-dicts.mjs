import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupplementForLang } from '../src/i18n/v2Supplements.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OLD_LANG_DIR = '/tmp/old_portfolio/lang';
const OUT_DIR = path.join(ROOT, 'lang');
const LANGS = ['en', 'zh', 'ja', 'pt', 'fr', 'ar'];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const code of LANGS) {
  let baseDict = {};
  const oldFile = path.join(OLD_LANG_DIR, `${code}.js`);
  const existingJson = path.join(OUT_DIR, `${code}.json`);

  if (fs.existsSync(oldFile)) {
    const src = fs.readFileSync(oldFile, 'utf8');
    const sandbox = {};
    new Function('window', src)(sandbox);
    baseDict = sandbox.LEDNIQUE_DICT || {};
  } else if (fs.existsSync(existingJson)) {
    baseDict = JSON.parse(fs.readFileSync(existingJson, 'utf8'));
  }

  const supplement = getSupplementForLang(code);
  const merged = { ...baseDict, ...supplement };
  const outFile = path.join(OUT_DIR, `${code}.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`Built lang/${code}.json -> ${Object.keys(merged).length} entries`);
}
