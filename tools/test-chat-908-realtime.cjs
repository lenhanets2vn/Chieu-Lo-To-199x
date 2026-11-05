const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ts=require('typescript');
const base=path.join(__dirname,'..');
const code=ts.transpileModule(fs.readFileSync(path.join(base,'src/features/chat/firebaseChatService.ts'),'utf8'),{fileName:'firebaseChatService.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText.replaceAll('import.meta.env', '({})');
const auth={currentUser:{uid:'user-A',isAnonymous:false}};
let connected=false, writes=[], callbacks=new Set(), sessions=new Map(), chatListenerCount=0;
class Timestamp { constructor(ms){this.ms=ms;} toMillis(){return this.ms;} static fromMillis(ms){return new Timestamp(ms);} }
const firestore={Timestamp,collection:()=>{},query:()=>{},orderBy:()=>{},limit:()=>{},onSnapshot:()=>()=>{},addDoc:async()=>{},serverTimestamp:()=>777,doc:()=>{},setDoc:async()=>{},getDocFromServer:async()=>({data:()=>({joinedAt:Timestamp.fromMillis(777)})}),where:()=>{}};
const rtdb={
 ref:(_db,path)=>({path}),get:async ref=>({val:()=>sessions.get(ref.path)}),push:ref=>({path:ref.path+'/generated-id'}),
 set:async(ref,value)=>{writes.push({path:ref.path,value});if(ref.path.startsWith('worldChatSessions/'))sessions.set(ref.path,1710000000000);},
 query:ref=>ref,orderByChild:()=>{},startAt:()=>{},limitToLast:()=>{},
 onValue:(ref,cb)=>{if(ref.path!=='.info/connected')throw Error('Unexpected listener '+ref.path);callbacks.add(cb);cb({val:()=>connected});return()=>callbacks.delete(cb);},
 onChildAdded:()=>{chatListenerCount++;return()=>chatListenerCount--;},onChildRemoved:()=>()=>{},serverTimestamp:()=>({'.sv':'timestamp'})
};
const mocks={'firebase/firestore':firestore,'firebase/database':rtdb,'../../services/firebase':{db:{},auth},'../../services/realtime':{realtimeConfigured:true,realtimeDatabase:()=>({})},'./yahooEmojis':{renderChatEmojiCodes:x=>x},'./profanityFilter':{validateAndFilterChatMessage:(_id,t)=>({allowed:true,filteredText:t})}};
const moduleObj={exports:{}};
vm.runInNewContext(code,{module:moduleObj,exports:moduleObj.exports,require:k=>{if(!(k in mocks))throw Error('Unknown mock: '+k);return mocks[k];},console,setTimeout,clearTimeout,queueMicrotask,AbortController},{filename:'firebaseChatService.js'});
const chat=moduleObj.exports;
const emit=state=>{connected=state;for(const cb of [...callbacks])cb({val:()=>state});};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const abort=new AbortController();
 const pending=chat.beginWorldChatSession('user-A',abort.signal);
 await sleep(0);assert.equal(writes.length,0,'offline does not write session');
 emit(true);
 const session=await pending;assert.equal(session.toMillis(),1710000000000);assert.equal(writes.length,1);
 const statuses=[];const stop=chat.subscribeToWorldChat(()=>{},session,()=>{},x=>statuses.push(x));
 assert.equal(chatListenerCount,1);assert.equal(statuses.at(-1),true);
 const sender={id:'user-A',name:'A',characterId:'chi_ba'};
 assert.equal((await chat.sendWorldChatMessage(sender,'first')).allowed,true);
 emit(false);
 assert.equal((await chat.sendWorldChatMessage(sender,'offline')).allowed,false);
 emit(true);
 assert.equal((await chat.sendWorldChatMessage(sender,'second')).allowed,true);
 stop();assert.equal(chatListenerCount,0);
 // Session reuse: retry/opening the window after reconnect must not write again.
 emit(false);
 const again=await chat.beginWorldChatSession('user-A');
 assert.equal(again.toMillis(),session.toMillis());
 assert.equal(writes.filter(w=>w.path.startsWith('worldChatSessions/')).length,1);
 assert.equal(writes.length,3,'only actual messages and one session write');
 // Reaction listener must be independent of game phase; no silent send failure.
 const app=fs.readFileSync(path.join(base,'src/App.tsx'),'utf8');
 assert.match(app,/if \(!pageVisible \|\| !currentRoom\?\.id \|\| currentView !== 'GAME_MATCH'\) return;/);
 assert.doesNotMatch(app,/currentView !== 'GAME_MATCH' \|\| gameState !== 'CALLING'/);
 assert.match(app,/sendRoomReaction\(currentRoom\.id,[\s\S]*?\.catch\(/);
 const rooms=fs.readFileSync(path.join(base,'src/features/room/firebaseRoomService.ts'),'utf8');
 assert.match(rooms,/onError\?\.\(err\)/);
 const serviceCode=ts.transpileModule(rooms,{fileName:'firebaseRoomService.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 let feed=null, canceled=false, sent=0, failures=[];
 const roomFs={
   Timestamp, collection: (...x)=>x.join('/'), query:(...x)=>x, orderBy:(...x)=>x, limit:n=>n,
   onSnapshot:(_q,onMessage,onError)=>{feed={onMessage,onError};return()=>{canceled=true}},
   addDoc:async()=>{sent++}, serverTimestamp:()=>1710000000000,
 };
 const roomMod={exports:{}};
 vm.runInNewContext(serviceCode,{module:roomMod,exports:roomMod.exports,require:k=>{
   if(k==='firebase/firestore')return roomFs;
   if(k==='../../services/firebase')return {db:{},auth};
   throw Error('Unexpected room mock '+k);
 },console,Date},{filename:'firebaseRoomService.js'});
 const service=roomMod.exports;
 const received=[];
 const stopReaction=service.subscribeToRoomReactions('room-A',r=>received.push(r),error=>failures.push(error));
 const first=Date.now()-60000;
 feed.onMessage({docChanges:()=>[{type:'added',doc:{id:'old',data:()=>({senderId:'B',senderName:'B',emoji:'❤️',label:'Love',createdAt:Timestamp.fromMillis(first)})}}]});
 assert.equal(received.length,0,'old initial reaction is not replayed');
 // A receiver's wall clock may differ from the sender's; a NEW event still renders.
 feed.onMessage({docChanges:()=>[{type:'added',doc:{id:'fresh',data:()=>({senderId:'B',senderName:'B',emoji:'👍',label:'Great',createdAt:Timestamp.fromMillis(first)})}}]});
 assert.equal(received.length,1,'new reaction delivered regardless of sender clock drift');
 feed.onMessage({docChanges:()=>[{type:'added',doc:{id:'fresh',data:()=>({})}}]});
 assert.equal(received.length,1,'no duplicate animation');
 feed.onError({code:'permission-denied'});assert.equal(failures.length,1);
 await service.sendRoomReaction('room-A',{senderId:'user-A',senderName:'A',emoji:'👏',label:'Clap'});
 assert.equal(sent,1);
 stopReaction();assert.equal(canceled,true);
 console.log('PASS: realtime chat reconnection/session reuse; room reactions in all game phases, cross-device timestamps, listener errors');
})().catch(e=>{console.error(e);process.exit(1)});
