/** Regression test for the current single 5-number ticket game. No Firebase. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require(process.env.TYPESCRIPT_MODULE || 'typescript');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(relative) {
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  const js=ts.transpileModule(source,{fileName:relative,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('module','exports',js)(module,module.exports);
  return module.exports;
}
const {LotoEngine}=load('src/features/game/lotoEngine.ts');
const {pickFiveUnique,generateFiveNumberTicket}=load('src/features/game/ticketGenerator.ts');
for(let trial=0;trial<100;trial++){
  const engine=new LotoEngine(90), history=[];
  const ticket=generateFiveNumberTicket(pickFiveUnique(90));
  const numbers=ticket.grid.flat().map(c=>c.value).filter(n=>n!==null);
  assert.equal(numbers.length,5);assert.equal(new Set(numbers).size,5);
  for(let i=0;i<90;i++){
    const preview=engine.peekNextNumber();
    const drawn=engine.drawNextBall();assert(drawn);assert.equal(drawn.number,preview);
    assert(engine.confirmCurrentBall(drawn.number));history.push(drawn.number);
  }
  assert.equal(new Set(history).size,90);
  assert(engine.checkTicketKinh(ticket,engine.getCalledNumbersSet()).hasKinh);
}
const engine=new LotoEngine(90);
const ticket=generateFiveNumberTicket([1,9,15,28,90]);
assert(!engine.checkTicketKinh(ticket,new Set([1,9,15,28])).hasKinh);
assert(engine.checkTicketKinh(ticket,new Set([1,9,15,28,90])).hasKinh);
const retained=pickFiveUnique(90,[1,9,15]);
assert.equal(retained.length,5);
for(const n of [1,9,15])assert(retained.includes(n));
const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
assert.match(app,/const rememberedCount: 1 \| 5 = 1;/);
assert.match(app,/useState<1 \| 5>\(initialPackCount\)/);
assert.match(app,/if \(!selectionLockedRef\.current\) finalizeOnCountdownRef\.current\?\.\(\)/);
console.log('PASS: 100 x 90 unique calls; exactly 5 numbers per ticket; KINH 4/5 blocked, 5/5 accepted; countdown auto-ticket path exists.');
