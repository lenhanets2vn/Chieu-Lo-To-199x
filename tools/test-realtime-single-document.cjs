'use strict';
// Offline contract test: no network, no Firebase credentials, no npm install required
// when TypeScript is available globally or in node_modules.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
let ts;
try { ts = require('typescript'); }
catch { ts = require(path.join(execFileSync('npm', ['root', '-g'], {encoding:'utf8'}).trim(), 'typescript')); }
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(root, 'src/features/room/firebaseRoomService.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
class Timestamp {
  constructor(v){this.value=v;}
  toMillis(){return this.value;}
}
const store = new Map();
const listeners = new Map();
const writes = [];
const reads = [];
const auth = {currentUser:{uid:'host'}};
const db = {};
const key = ref => ref.path;
const ref = (...segments)=>({path:segments.join('/')});
const data = (ref) => store.get(key(ref));
function transform(newData,previous={}){
  const next={...previous};
  for(const [k,v] of Object.entries(newData))next[k]=v&&v.__increment ? (next[k]||0)+v.__increment : v;
  return next;
}
function emitOne(ref){
  for(const callback of (listeners.get(key(ref))||[])) callback({exists:()=>store.has(key(ref)),data:()=>data(ref)});
}
function apply(type,ref,payload) {
  writes.push({type,path:key(ref)});
  if(type==='delete')store.delete(key(ref));
  else store.set(key(ref),transform(payload,type==='update'?data(ref):{}));
  emitOne(ref);
}
function query(ref,...ops){return {ref,ops};}
const api={
  collection:(...args)=>ref(...args.slice(1)),
  doc:(...args)=>ref(...args.slice(1)),
  query, where:(field,operator,val)=>({field,operator,val}),limit:(val)=>({limit:val}),
  orderBy:(field,direction)=>({orderBy:field,direction}),
  onSnapshot:(reference,options,callback)=>{
    if(typeof options==='function')callback=options;
    // The contract test listens only to one specific room document.
    const k=key(reference);
    if(!listeners.has(k))listeners.set(k,[]);
    listeners.get(k).push(callback);
    if(store.has(k))emitOne(reference);
    return ()=>listeners.set(k, (listeners.get(k)||[]).filter(x=>x!==callback));
  },
  serverTimestamp:()=>new Timestamp(Date.now()),
  Timestamp,
  FirestoreError:class{},
  increment:(n)=>({__increment:n}),
  updateDoc:async (r,p)=>apply('update',r,p),
  setDoc:async (r,p)=>apply('set',r,p),
  addDoc:async (r,p)=>{const id='auto'+(store.size+1);const out=ref(r.path,id);apply('set',out,p);return out;},
  getDocFromServer:async r=>({exists:()=>store.has(key(r)),data:()=>data(r)}),
  getDocs:async q=>({docs:[...store.entries()].filter(([k])=>k.startsWith(q.ref.path+'/')&&k.split('/').length===q.ref.path.split('/').length+1).slice(0,q.ops.find(x=>x.limit)?.limit||100).map(([k,v])=>({id:k.split('/').at(-1),data:()=>v}))}),
  writeBatch:()=>{let ops=[];return{set:(r,p)=>ops.push(['set',r,p]),update:(r,p)=>ops.push(['update',r,p]),delete:r=>ops.push(['delete',r]),commit:async()=>{for(const [t,r,p] of ops)apply(t,r,p);}};},
  runTransaction:async(_db,fn)=>{let ops=[];let seenWrite=false;
    const tx={get:async r=>{assert(!seenWrite,'Firestore transaction read after write');reads.push(key(r));return {exists:()=>store.has(key(r)),data:()=>data(r)};},
      set:(r,p)=>{seenWrite=true;ops.push(['set',r,p]);},update:(r,p)=>{seenWrite=true;ops.push(['update',r,p]);},delete:r=>{seenWrite=true;ops.push(['delete',r]);}};
    const result=await fn(tx);
    for(const[t,r,p]of ops)apply(t,r,p);
    return result;
  }
};
const testModule={exports:{}};
vm.runInNewContext(compiled,{module:testModule,exports:testModule.exports,require(name){
  if(name==='firebase/firestore')return api;
  if(name==='../../services/firebase')return {db,auth};
  if(name==='./types'||name==='../game/types')return {};
  throw Error('Unmocked: '+name);
},crypto:require('node:crypto').webcrypto,console,Date,Map,Set,Promise}, {filename:'firebaseRoomService.ts'});
const service=testModule.exports;
const player=(id,isHost=false)=>({id,name:'Member '+id,isHost,isBot:false,characterId:'cu_teo',tickets:[],isReady:true,hasKinh:false,score:0});
(async()=>{
  const room=await service.createOnlineRoom({name:'Test 100 Players',isPrivate:false,callSpeed:5,maxPlayers:100},player('host',true));
  const r=ref('rooms',room.id);
  assert.equal(writes.length,2,'create should write exactly room + HOST membership');
  assert.equal(store.has('rooms/'+room.id+'/state/current'),false);
  assert.equal(data(r).gameRevision,0);
  assert.equal(Object.keys(data(r).roster).length,1);
  let rooms=0, games=0;
  const cancel=service.subscribeToLiveRoom(room.id,()=>rooms++,()=>games++);
  assert.equal((listeners.get(key(r))||[]).length,1,'exactly ONE gameplay onSnapshot');
  assert.equal(rooms,1);assert.equal(games,1);
  const idleWrites=writes.length; await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(writes.length,idleWrites,'Idle single-document listener must make zero writes');
  const beforeJoin=writes.length;
  auth.currentUser.uid='guest1';
  let joined=await service.joinOnlineRoom(room.code,player('guest1'));
  assert(joined.success);assert.equal(writes.length-beforeJoin,2);
  assert.equal(rooms,2);assert.equal(games,1,'join only should not re-render gameplay');
  assert.equal(data(r).memberCount,2);
  const beforeLive=writes.length;
  auth.currentUser.uid='host';
  await service.publishRoomGameState(room.id,{status:'COUNTDOWN',countdownEndsAt:Date.now()+10000,calledHistory:[]});
  await service.publishRoomAudioEvent(room.id,'intro','intro','default');
  await service.publishRoomAudioEvent(room.id,'number','08','default');
  await service.publishRoomGameState(room.id,{status:'CALLING',currentBallNumber:8,calledHistory:[8]});
  assert.equal(writes.length-beforeLive,4,'4 actual transitions = 4 writes');
  assert.equal(data(r).gameRevision,4);assert.equal(games,5);
  // 100 seats are maximum, not minimum. Membership never mutates gameRevision.
  for(let i=2;i<100;i++){
    auth.currentUser.uid='guest'+i;
    const result=await service.joinOnlineRoom(room.code,player('guest'+i));
    // Already calling: no late joins. Test capacity separately in a WAITING room below.
    assert.equal(result.success,false);
  }
  auth.currentUser.uid='host';
  const oldW=writes.length;
  await service.leaveOnlineRoom(room.id,'host',true);
  assert.equal(data(r).hostId,'guest1','HOST should hand over, not delete room');
  assert.equal(data(r).memberCount,1);
  assert.equal(data(r).calledHistory[0],8);
  assert.equal(writes.length-oldW,3,'handoff writes successor, room, departing member');
  assert.equal(games,5,'HOST handoff alone must not publish a new ball');
  cancel(); assert.equal((listeners.get(key(r))||[]).length,0);
  // A separate waiting room may be filled to capacity 100; 101st user rejected.
  auth.currentUser.uid='host';
  const room2=await service.createOnlineRoom({name:'Capacity',isPrivate:true,callSpeed:5,maxPlayers:100},player('host',true));
  for(let i=1;i<100;i++){
    auth.currentUser.uid='person'+i;
    assert((await service.joinOnlineRoom(room2.code,player('person'+i))).success,`person ${i}`);
  }
  assert.equal(data(ref('rooms',room2.code)).memberCount,100);
  const sizeAt100 = Buffer.byteLength(JSON.stringify(data(ref('rooms',room2.code))), 'utf8');
  assert(sizeAt100 < 50_000, 'Public 100-player room metadata should remain compact');
  auth.currentUser.uid='late';
  const over=await service.joinOnlineRoom(room2.code,player('late'));
  assert.equal(over.success,false);assert.match(over.error,/đủ người/);
  auth.currentUser.uid='person1';
  await service.sendRoomKinhClaim(room.id,'person1',[1,2,3,4,5],'f723bc8a-1abc-4a12-bbfd-ff1234567890');
  assert([...store.keys()].some(k=>k.endsWith('f723bc8a-1abc-4a12-bbfd-ff1234567890_person1')));
  console.log('PASS: live room 1 listener, 2 create writes, 2 join writes, 1/game event, HOST handoff, 100 capacity, one claim ID/round');
  console.log('Events room=',rooms,'game=',games,'writes=',writes.length,'read operations in simulated transactions=',reads.length,'100-member doc bytes=',sizeAt100);
})().catch(err=>{console.error(err);process.exitCode=1;});
