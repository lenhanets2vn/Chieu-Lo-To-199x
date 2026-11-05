import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const read = rel => readFileSync(resolve(import.meta.dirname, '..', rel), 'utf8');
const app=read('src/App.tsx'), svc=read('src/features/chat/firebaseChatService.ts'),
  admission=read('src/features/capacity/onlineAdmission.ts'), real=read('src/services/realtime.ts'), panel=read('src/features/chat/ChatPanel.tsx');
const checks = [
  ['admission opt-in', real.includes('VITE_ENABLE_SPARK_ADMISSION') && real.includes("=== 'true'")],
  ['App admission opt-in', app.includes('if (!sparkAdmissionEnabled || !readyUserId) return;')],
  ['App gating opt-in', app.includes('const needsOnlineAdmission = sparkAdmissionEnabled')],
  ['world chat fallback', svc.includes("worldTransport = 'firestore';") && svc.includes('getFirestoreWorldSession(uid)')],
  ['world chat fallback cache', svc.includes('firestoreWorldSessionPromise')],
  ['bounded fallback list', svc.includes("orderBy('createdAt', 'desc'), limit(40)")],
  ['no parallel chat subscriptions after error', svc.includes('stopRtdb();')],
  ['world chat socket protected from admission goOffline', admission.includes('isRealtimeWorldChatSubscribed()')],
  ['manual chat retry UI', panel.includes('onRetry') && app.includes('worldChatRetryKey')],
  ['no new heartbeat in chat', !svc.includes('setInterval(')]
];
let bad=0;
for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} — ${label}`);if(!ok)bad++;}
if(bad)process.exitCode=1;
