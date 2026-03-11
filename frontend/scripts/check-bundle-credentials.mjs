import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const FORBIDDEN_STRINGS = ['BNOVO_UID', 'BNOVO_ACCOUNT_ID'];

function collectJsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectJsFiles(full));
    } else if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
      files.push(full);
    }
  }
  return files;
}

let failed = false;

const jsFiles = collectJsFiles(distDir);

for (const file of jsFiles) {
  const content = readFileSync(file, 'utf8');
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      console.error(`FAIL: "${forbidden}" found in ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('Bundle credential check FAILED: Bnovo credentials found in frontend bundle.');
  process.exit(1);
} else {
  console.log(`OK: No Bnovo credentials found in ${jsFiles.length} JS bundle file(s).`);
}
