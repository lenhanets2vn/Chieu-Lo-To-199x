const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
let passed=0;let failures=[];
function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p); else if(/\.tsx?$/.test(f.name)){const source=fs.readFileSync(p,'utf-8'); const out=ts.transpileModule(source,{fileName:p,reportDiagnostics:true, compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});const errors=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(errors.length) failures.push(...errors.map(d=>path.relative(root,p)+': '+ts.flattenDiagnosticMessageText(d.messageText,' ')));passed++;}}}
walk(path.join(root,'src'));
console.log('TS/TSX parsed:',passed,'errors:',failures.length);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
