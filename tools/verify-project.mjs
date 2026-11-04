/** Source + soundpack audit. Run with node; no npm modules required. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = relative => fs.existsSync(path.join(root,relative));
const errors = [];
const required = [
  'package.json','index.html','src/main.tsx','src/App.tsx',
  'src/features/audio/LotoAudioControls.tsx',
  'src/features/audio/speechCaller.ts',
  'src/features/audio/soundpackRegistry.ts',
  'src/features/audio/audioSynthesizer.ts',
  'src/features/game/FiveNumberPicker.tsx',
  'public/soundpacks/catalog.json'
];
for (const file of required) if(!exists(file)) errors.push(`MISSING ${file}`);
if(exists('public/soundpacks/catalog.json')){
  let packs=[];
  try { packs=JSON.parse(fs.readFileSync(path.join(root,'public/soundpacks/catalog.json'),'utf8')); }
  catch(e){errors.push(`SOUNDPACK CATALOG INVALID JSON ${e}`)}
  if(!Array.isArray(packs) || !packs.length) errors.push('SOUNDPACK CATALOG EMPTY');
  else {
    const seen=new Set();
    for(const pack of packs){
      if(!/^[a-z0-9][a-z0-9-]{1,48}$/.test(pack.id??'')) errors.push(`BAD PACK ID ${pack.id}`);
      if(seen.has(pack.id)) errors.push(`DUPLICATE PACK ID ${pack.id}`);seen.add(pack.id);
      if(!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(pack.basePath??'')){
        errors.push(`UNSAFE PACK PATH ${pack.basePath}`);continue;
      }
      if(pack.maxNumber!==90) errors.push(`PACK ${pack.id} MUST COVER 1-90`);
      const formats=pack.preferredFormats;
      if(!Array.isArray(formats) || !formats.length || formats.some(x=>!['mp3','webm'].includes(x))) {
        errors.push(`PACK ${pack.id} INVALID FORMATS`);continue;
      }
      for(const name of [...Array.from({length:90},(_,i)=>String(i+1).padStart(2,'0')),'intro','near_end','outro']){
        if(!formats.some(ext=>exists(`public/${pack.basePath}/${name}.${ext}`))) errors.push(`PACK ${pack.id} MISSING TRACK ${name}`);
      }
      console.log(`Soundpack ${pack.id} (${pack.title}): configured ${formats.join('/')} — 90 numbers, intro/near_end/outro`);
    }
  }
}
const caller=fs.readFileSync(path.join(root,'src/features/audio/speechCaller.ts'),'utf8');
const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
const synth=fs.readFileSync(path.join(root,'src/features/audio/audioSynthesizer.ts'),'utf8');
if(/speechSynthesis|\.speak\(/.test(caller+app))errors.push('TTS FOUND IN PLAYER OR APP');
if(synth.includes('this.ctx.destination'))errors.push('EFFECTS BYPASS MASTER VOLUME');
if(!caller.includes('queueNextTrack'))errors.push('MISSING NEXT TRACK SUPPORT');
if(!app.includes('ticketCount: 1'))errors.push('TICKET COUNT MUST BE 1');
if(errors.length){console.error('FAILED — '+errors.length+' issue(s)');for(const e of errors)console.error(e);process.exitCode=1;}
else console.log('PASS — entrypoints, game settings, soundpack(s), audio architecture.');
