/** Repeatable test for 90 random numbers and 1/5 ticket rules, no web needed. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(relative) {
 const source=fs.readFileSync(path.join(root,relative),'utf8');
 const js=ts.transpileModule(source,{fileName:relative,compilerOptions:{module:1,target:99}}).outputText;
 const module={exports:{}};
 new Function('module','exports',js)(module,module.exports);
 return module.exports;
}
const {LotoEngine}=load('src/features/game/lotoEngine.ts');
const {pickFiveUnique,generateFiveNumberTicket}=load('src/features/game/ticketGenerator.ts');
for(let trial=0;trial<100;trial++){
 const engine=new LotoEngine(90); const history=[];
 const packs=Array.from({length:5},()=>generateFiveNumberTicket(pickFiveUnique(90)));
 assert.equal(packs.length,5);
 for(const t of packs){const values=t.grid.flat().map(c=>c.value);assert.equal(values.length,5);assert.equal(new Set(values).size,5)}
 for(let i=0;i<90;i++){
  let next=engine.peekNextNumber();let preview=engine.peekNextNumbers(2);
  assert.equal(preview[0],next);
  const ball=engine.drawNextBall();assert(ball);assert.equal(ball.number,next);
  assert(engine.confirmCurrentBall(ball.number));history.push(ball.number);
 }
 assert.equal(history.length,90);assert.equal(new Set(history).size,90);
 for(const ticket of packs) assert(engine.checkTicketKinh(ticket,engine.getCalledNumbersSet()).hasKinh);
}
const engine=new LotoEngine(90);
const ticket=generateFiveNumberTicket([1,9,15,28,90]);
const four=new Set([1,9,15,28]);assert.equal(engine.checkTicketKinh(ticket,four).hasKinh,false);
const five=new Set([1,9,15,28,90]);assert.equal(engine.checkTicketKinh(ticket,five).hasKinh,true);
const retained=pickFiveUnique(90,[1,9,15]);
assert.equal(retained.length,5);
for(const value of [1,9,15]) assert(retained.includes(value));
const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
assert.match(app,/ticketCount: initialPackCount\(\)/);
assert.match(app,/setSettings\(previous => \(\{ \.\.\.previous, ticketCount: count \}\)\)/);
assert.match(app,/setPackCount\(rememberedCount\)/);
assert.doesNotMatch(app,/setPackCount\(1\)/);
console.log('PASS: 100 games x 90 unique calls, 5 packs x 5 values, KINH 4/5 locked, 5/5 allowed, persistent pack-count logic.');
