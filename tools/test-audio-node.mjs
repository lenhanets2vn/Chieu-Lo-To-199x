import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'loto-v8-audio-test-'));
fs.writeFileSync(path.join(tmp,'package.json'), '{"type":"module"}');
for(const file of ['soundpackManifest','soundpackRegistry','speechCaller','audioSynthesizer']){
  const input = fs.readFileSync(path.join(root,'src','features','audio',file+'.ts'),'utf8');
  let code = ts.transpileModule(input, {fileName:file+'.ts',compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  code = code.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,module)=>`from './${module}.js'`);
  code = code.replace(/import\.meta\.env\.BASE_URL/g,"'/'");
  fs.writeFileSync(path.join(tmp,file+'.js'),code);
}

import {setTimeout as sleep} from 'node:timers/promises';
class Param { setValueAtTime(){}linearRampToValueAtTime(){}cancelScheduledValues(){}setTargetAtTime(){}exponentialRampToValueAtTime(){} }
class Node { constructor(ctx){this.ctx=ctx;this.gain=new Param();this.frequency=new Param();} connect(dest){this.dest=dest;return dest;}disconnect(){} }
class Source extends Node {
 constructor(ctx){super(ctx);this.buffer=null;this.onended=null;this.stopped=false;this.timer=null;}
 start(at){
  if(this.buffer===null)throw new Error('No audio buffer');
  const millis=Math.max(1,(at+this.buffer.duration-this.ctx.currentTime)*100);
  this.timer=setTimeout(()=>{if(!this.stopped){this.stopped=true;this.onended?.();}},millis);
 }
 stop(){this.stopped=true;clearTimeout(this.timer)}
}
class Context {
 constructor(){this.state='running';this.started=Date.now();this.stoppedAt=0;this.destination={id:'speaker'};this.sources=[];this.sharedGains=[];Context.instances.push(this)}
 static instances=[];
 get currentTime(){return this.state==='suspended'?this.stoppedAt:(Date.now()-this.started)/100+this.stoppedAt}
 createGain(){let n=new Node(this);this.sharedGains.push(n);return n}
 createAnalyser(){const n=new Node(this);n.fftSize=256;return n}
 createBufferSource(){const s=new Source(this);this.sources.push(s);return s}
 createOscillator(){const s=new Source(this);s.buffer={duration:.05};s.type='sine';return s}
 async decodeAudioData(bytes){return {duration:new Uint8Array(bytes)[0],sampleRate:44100}}
 async resume(){if(this.state==='suspended'){this.started=Date.now();this.state='running'} }
 async suspend(){await sleep(3);if(this.state==='running'){this.stoppedAt=this.currentTime;this.state='suspended'}}
}
globalThis.AudioContext=Context;
let missing='';let delayMs=0;let fetches=[];
globalThis.fetch=async(url)=>{
 const file=String(url).split('/').pop();fetches.push(file);
 if(delayMs)await sleep(delayMs);
 if(file===missing)return {ok:false,status:404};
 if(!file?.endsWith('.mp3'))return {ok:false,status:404};
 const lengths={'intro.mp3':3,'01.mp3':4,'02.mp3':3,'outro.mp3':2,'near_end.mp3':2};
 const duration=lengths[file];
 return duration?{ok:true,arrayBuffer:async()=>new Uint8Array(2048).fill(duration).buffer}:{ok:false,status:404};
};
const {speechCaller}=await import(pathToFileURL(path.join(tmp,'speechCaller.js')).href);
const {audioSynthesizer}=await import(pathToFileURL(path.join(tmp,'audioSynthesizer.js')).href);
const pack={id:'test-pack',title:'Test',basePath:'testpack',maxNumber:90,preferredFormats:['mp3']};
speechCaller.setSoundpack(pack);
const timeline=[];let failures=[];
function event(name){timeline.push({name,at:Math.round(performance.now())})}
function err(message){failures.push(message);event('error:'+message)}

speechCaller.playIntro({onStart:()=>event('introStart'),onSongEnd:()=>{
  event('introEnd');speechCaller.playSongForNumber(1,{onStart:()=>event('01Start'),onReveal:()=>event('01Reveal'),onSongEnd:()=>{
    event('01End');speechCaller.playSongForNumber(2,{onStart:()=>event('02Start'),onReveal:()=>event('02Reveal'),onSongEnd:()=>{
      event('02End');speechCaller.playOutro({onStart:()=>event('outroStart'),onSongEnd:()=>event('outroEnd'),onError:err})
    },onError:err},'outro');
  },onError:err},'02','outro')
},onError:err},'01','02');
await sleep(1600);
assert.deepEqual(timeline.filter(x=>!x.name.startsWith('error')).map(x=>x.name),['introStart','introEnd','01Start','01Reveal','01End','02Start','02Reveal','02End','outroStart','outroEnd']);
assert.equal(failures.length,0);
const transitions=[['introEnd','01Start'],['01End','02Start'],['02End','outroStart']];
for (const [a,b] of transitions){
 const aat=timeline.find(x=>x.name===a).at, bat=timeline.find(x=>x.name===b).at;
 assert(bat-aat<20,`${a} -> ${b} callback gap ${bat-aat}ms`);
}
// Both effects and tracks must use SAME gain/context.
let bus=speechCaller.getEffectsBus();
audioSynthesizer.playClick();
assert.equal(Context.instances.length,1);
const effectsSource=Context.instances[0].sources.at(-1);
assert(effectsSource);
assert.equal(effectsSource.dest?.dest,bus.destination);
speechCaller.setVolume(.35);speechCaller.setEnabled(false);speechCaller.setEnabled(true);
assert.equal(speechCaller.getVolume(),.35);
// Slow fetching of following MUST postpone intro's start until next decoded.
speechCaller.stop();speechCaller.setSoundpack({...pack,id:'slow-test'});delayMs=120;
let startAt=Date.now();let enteredAt=0;
speechCaller.playIntro({onStart:()=>{enteredAt=Date.now()},onError:err},'01');
await sleep(60);assert.equal(enteredAt,0,'Intro started before preflight load completed');
await sleep(260);assert(enteredAt-startAt>=110,'Preflight not observed');
speechCaller.stop();delayMs=0;
// Missing following file is a hard visible error, not start-then-silent failure.
speechCaller.setSoundpack({...pack,id:'second-pack'});missing='01.mp3';
let startedMissing=false;let missingMsg='';
speechCaller.playIntro({onStart:()=>{startedMissing=true},onError:e=>{missingMsg=e}},'01');
await sleep(100);assert.equal(startedMissing,false);assert.match(missingMsg,/Không phát được/);
speechCaller.stop();
console.log(JSON.stringify({passed:true,events:timeline.map(e=>e.name),transitions,sourceInstances:Context.instances.length,visibleFailure:missingMsg.slice(0,70),fetches:fetches.slice(0,8)},null,2));
// A queued track that misses its cutoff must raise an error, never call onSongEnd.
speechCaller.stop();speechCaller.setSoundpack({...pack,id:'late-test'});missing='';delayMs=0;
let lateError='',lateEnded=false;
speechCaller.playIntro({onSongEnd:()=>{
  delayMs=500; // current song lasts 4 audio seconds = 400ms mock wall time
  speechCaller.playSongForNumber(1,{onSongEnd:()=>{lateEnded=true},onError:e=>{lateError=e}},'02');
},onError:err},'01');
await sleep(1000);
assert.equal(lateEnded,false,'Unexpectedly skipped a late queue');
assert.match(lateError,/Không có nhạc|Không kịp|Không phát được/);
speechCaller.stop();
console.log('LATE QUEUE: PASS',lateError.slice(0,110));

fs.rmSync(tmp,{recursive:true,force:true});
