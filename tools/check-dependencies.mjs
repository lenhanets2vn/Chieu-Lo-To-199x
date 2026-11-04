import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const fail = [];
const version = (group, key) => pkg[group]?.[key] ?? '';
if (!/^\^?8\.3\./.test(version('dependencies', 'vite')))
  fail.push(`Vite unexpected: ${version('dependencies', 'vite')}`);
if (version('devDependencies', 'esbuild') !== '^0.28.0')
  fail.push(`esbuild must be ^0.28.0, received ${version('devDependencies', 'esbuild')}`);
for (const file of ['bun.lock', 'bun.lockb']) {
  if (fs.existsSync(path.join(root, file))) {
    fail.push(`Old ${file} is present. Delete it or regenerate it with a compatible esbuild version.`);
  }
}
const npmLock = path.join(root, 'package-lock.json');
if (fs.existsSync(npmLock)) {
  try {
    const data = JSON.parse(fs.readFileSync(npmLock, 'utf8'));
    const dep = data.packages?.['']?.devDependencies?.esbuild;
    const resolved = data.packages?.['node_modules/esbuild']?.version;
    if (dep && dep !== '^0.28.0') fail.push(`Old package-lock devDependency esbuild: ${dep}`);
    if (resolved && !/^0\.28\./.test(resolved)) fail.push(`Old package-lock esbuild version: ${resolved}`);
  } catch (e) { fail.push('package-lock.json unreadable: ' + e.message); }
}
const major = Number(process.versions.node.split('.')[0]);
const minor = Number(process.versions.node.split('.')[1]);
if (!((major === 20 && minor >= 19) || major >= 22 && (major !== 22 || minor >= 12)))
  fail.push(`Node.js ${process.version}: Vite 8 needs Node 20.19+ or 22.12+`);
console.log(`Node ${process.version} | Vite ${version('dependencies', 'vite')} | esbuild ${version('devDependencies', 'esbuild')}`);
if (fail.length) {
  for (const error of fail) console.error('[FAIL]', error);
  process.exit(1);
}
console.log('[PASS] Vite/esbuild compatibility (static check). Run npm install, npm run lint and npm run build to verify installation and compilation.');
