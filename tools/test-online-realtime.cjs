/* Offline contract test, no Firebase credentials / network required.
 * Run after npm install: node tools/test-online-realtime.cjs
 * Optionally set TYPESCRIPT_MODULE to a global TypeScript installation.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const ts = process.env.TYPESCRIPT_MODULE ? require(process.env.TYPESCRIPT_MODULE) : require('typescript');
const docs = new Map();
const metrics = { reads: 0, writes: 0, deletes: 0 };
const auth = { currentUser: { uid: 'host-a' } };
const db = {};
const document = (_, ...parts) => parts.join('/');
const collection = document;
const serverTimestamp = () => ({ serverTime: true });
function apply(op, id, value) {
  if (op === 'delete') { docs.delete(id); metrics.deletes++; return; }
  if (op === 'set') docs.set(id, structuredClone(value));
  if (op === 'merge') docs.set(id, { ...(docs.get(id)||{}), ...structuredClone(value) });
  if (op === 'update') {assert(docs.has(id), `Missing doc: ${id}`); docs.set(id, {...docs.get(id), ...structuredClone(value)});}
  metrics.writes++;
}
function snap(id) {metrics.reads++;return { id:id.split('/').at(-1), exists:()=>docs.has(id), data:()=>docs.get(id) };}
function batchMaker(){const operations=[];return {
  set:(id,obj)=>operations.push(['set',id,obj]),
  update:(id,obj)=>operations.push(['update',id,obj]),
  delete:id=>operations.push(['delete',id]),
  commit:async()=>operations.forEach(([op,id,v])=>apply(op,id,v))
}}
const fakeFirestore = {
  doc:document, collection, serverTimestamp, writeBatch:()=>batchMaker(),
  runTransaction: async (_, callback)=>{const ops=batchMaker();const tx={get:async id=>snap(id),set:ops.set,update:ops.update,delete:ops.delete};const result=await callback(tx);await ops.commit();return result;},
  getDocs:async q=>{const prefix=q.path+'/';const matches=[...docs.keys()].filter(id=>id.startsWith(prefix)&&!id.slice(prefix.length).includes('/')).slice(0,q.limit);metrics.reads+=matches.length;return {docs:matches.map(id=>({id:id.split('/').at(-1),data:()=>docs.get(id)}))};},
  query:(id,...filters)=>({path:id, limit:filters.find(x=>x?.limit)?.limit||100}),limit:n=>({limit:n}),
  where:()=>({}),orderBy:()=>({}),onSnapshot:()=>()=>{},addDoc:async()=>{},
  updateDoc:async(id,update)=>apply('update',id,update),setDoc:async(id,value,opt)=>apply(opt?.merge?'merge':'set',id,value),
  getDocFromServer:async id=>snap(id)
};
function importTS(filename, requireOverride) {
  const source=fs.readFileSync(path.join(root,filename),'utf8');
  const js=ts.transpileModule(source,{fileName:filename,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const m={exports:{}};
  new Function('require','exports','module','crypto',js)(requireOverride,m.exports,m,webcrypto);
  return m.exports;
}
const service=importTS('src/features/room/firebaseRoomService.ts', id=>{
  if(id==='firebase/firestore')return fakeFirestore;
  if(id==='../../services/firebase')return {db,auth};
  throw Error('Unexpected import '+id);
});
const engineModule=importTS('src/features/game/lotoEngine.ts', id=>{throw Error('Unexpected engine import '+id)});
const {LotoEngine}=engineModule;
function player(id){return {id,name:id,isHost:id==='host-a',isBot:false,characterId:'cu_teo',tickets:[],isReady:true,hasKinh:false,score:0}}
(async()=>{
  const room=await service.createOnlineRoom({name:'Test',isPrivate:false,maxPlayers:100,callSpeed:5},player('host-a'));
  assert.equal(docs.get(`rooms/${room.id}`).memberCount,1);
  auth.currentUser={uid:'guest-b'};
  let joined=await service.joinOnlineRoom(room.id,player('guest-b'));
  assert.equal(joined.success,true);
  assert.equal(docs.get(`rooms/${room.id}`).memberCount,2);
  // Maximum capacity (100) is NOT a minimum.
  auth.currentUser={uid:'host-a'};
  await service.publishRoomGameState(room.id,{status:'COUNTDOWN',countdownEndsAt:Date.now()+10000,calledHistory:[],roundId:'round-1'});
  assert.equal(docs.get(`rooms/${room.id}`).status,'COUNTDOWN');
  await service.publishRoomAudioEvent(room.id,'intro','intro','hoi-cho-199x');
  await service.publishRoomAudioEvent(room.id,'number','07','hoi-cho-199x',true);
  assert.equal(docs.get(`rooms/${room.id}`).status,'CALLING');
  await service.publishRoomGameState(room.id,{status:'CALLING',currentBallNumber:7,calledHistory:[7]});
  await service.publishRoomAudioEvent(room.id,'number','18','hoi-cho-199x');
  await service.publishRoomGameState(room.id,{status:'CALLING',currentBallNumber:18,calledHistory:[7,18]});
  assert.deepEqual(docs.get(`rooms/${room.id}/state/current`).calledHistory,[7,18]);
  auth.currentUser={uid:'guest-b'};
  await service.publishOwnRoomTickets(room.id,player('guest-b'),[{id:'ticket-one',grid:[]}]);
  assert.equal(docs.get(`rooms/${room.id}/members/guest-b`).isHost,false);
  assert.equal(docs.get(`rooms/${room.id}/members/guest-b`).joinedAt.serverTime,true);
  auth.currentUser={uid:'host-a'};
  const before = { ...metrics };
  // Deliberate exit transfers HOST and preserves room/state/history.
  await service.leaveOnlineRoom(room.id,'host-a',true);
  assert.equal(docs.get(`rooms/${room.id}`).hostId,'guest-b');
  assert.equal(docs.get(`rooms/${room.id}`).memberCount,1);
  assert.equal(docs.has(`rooms/${room.id}/members/host-a`),false);
  assert.equal(docs.get(`rooms/${room.id}/members/guest-b`).isHost,true);
  auth.currentUser={uid:'guest-b'};
  await service.publishOwnRoomTickets(room.id,player('guest-b'),[{id:'ticket-two',grid:[]}]);
  assert.equal(docs.get(`rooms/${room.id}/members/guest-b`).isHost,true, 'saving tickets after handoff MUST NOT downgrade HOST');
  assert.equal(docs.get(`rooms/${room.id}/members/guest-b`).joinedAt.serverTime,true, 'saving tickets must preserve joinedAt');
  assert.deepEqual(docs.get(`rooms/${room.id}/state/current`).calledHistory,[7,18]);
  assert.equal(metrics.deletes-before.deletes,1,'only the departing member should be deleted');
  auth.currentUser={uid:'guest-b'};
  await service.publishRoomGameState(room.id,{status:'GAME_OVER',winnerPlayerName:'guest-b',winnerRow:[7,18,22,45,62]});
  assert.equal(docs.get(`rooms/${room.id}`).status,'GAME_OVER');
  await service.leaveOnlineRoom(room.id,'guest-b',true);
  assert.equal(docs.has(`rooms/${room.id}`),false);
  assert.equal(docs.has(`rooms/${room.id}/state/current`),false);
  // Rebuild any new HOST's deck from the revealed history: no duplicate draws.
  for(let trial=0;trial<100;trial++){
    const engine=new LotoEngine(90);const known=[7,18,34,55,90];
    known.forEach(n=>engine.confirmCurrentBall(n));
    const result=[];for(let i=0;i<85;i++){const ball=engine.drawNextBall();assert(ball);assert(!known.includes(ball.number));assert(engine.confirmCurrentBall(ball.number));result.push(ball.number);}
    assert.equal(new Set([...known,...result]).size,90);
  }
  const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
  assert(!app.includes('handleAudioPauseToggle'));
  assert(!app.includes('Kết thúc chưa KINH'));
  assert(app.includes('subscribeToOwnRoomMember'));
  assert(app.includes('remoteAudioEventRef.current ='));
  assert(app.includes('takeoverHostRef.current ='));
  assert(app.includes('pendingKinhClaimsRef.current'));
  const rules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
  for(const fragment of ["'audioPhase'", "'audioStartedAt'", "'hostId','hostName','memberCount'",'getAfter(/databases/$(database)/documents/rooms/$(roomId)/state/current)']) assert(rules.includes(fragment),fragment);
  console.log(`PASS: create, 2/100 start, countdown, music transitions, called history, HOST handoff, winner, deletion, 100 deck-recovery trials; simulated I/O reads=${metrics.reads}, writes=${metrics.writes}, deletes=${metrics.deletes}.`);
})().catch(e=>{console.error(e);process.exitCode=1});
