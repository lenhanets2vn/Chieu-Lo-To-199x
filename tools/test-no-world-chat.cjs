const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const app = read('src/App.tsx');
const menu = read('src/components/menu/MainMenu.tsx');
const chat = read('src/features/chat/firebaseChatService.ts');
const panel = read('src/features/chat/ChatPanel.tsx');
const firestore = read('firestore.rules');
const db = JSON.parse(read('database.rules.json'));
for (const value of [app,menu,chat,panel]) {
  assert(!/(?:worldChat|WorldChat|world_messages|worldMessages|chat_sessions|onOpenWorldChat|VITE_WORLD_CHAT_TRANSPORT)/i.test(value));
}
assert(!/subscribeToWorldChat|sendWorldChatMessage|beginWorldChatSession/.test(app));
assert(!/🌍 KÊNH CHAT|CHAT THẾ GIỚI/i.test(menu));
assert(/subscribeToRoomChat\(/.test(chat));
assert(/sendRoomChatMessage\(/.test(chat));
assert(/sendRoomBuzz\(/.test(chat));
assert(/subscribeToRoomReactions\(/.test(app));
assert(/sendRoomReaction\(/.test(app));
assert(/matchRightTab === 'chat' && currentRoom/.test(app));
assert(!('worldMessages' in db.rules));
assert(!('worldChatSessions' in db.rules));
assert('admission' in db.rules);
assert(/match \/world_messages\/\{messageId\}/.test(firestore));
assert(/match \/chat_sessions\/\{uid\}/.test(firestore));
assert(/allow read, write: if false;/.test(firestore));
console.log('PASS: World chat absent from frontend and denied by Rules; room chat/reactions/admission retained.');
