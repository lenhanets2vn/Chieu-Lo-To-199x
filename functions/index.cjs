'use strict';

// This Cloud Function is installed separately from the Vite frontend.
// It runs once when a host closes a room, not on every chat message.
// This project uses the default Firestore database.
const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
initializeApp();

const DATABASE_ID = '(default)';

exports.cleanupClosedRoom = onDocumentDeleted({
  document: 'rooms/{roomId}',
  database: DATABASE_ID,
  // The Firebase project / Firestore database region must be checked at deploy time.
  // Do not hardcode an unverified database location here.
  memory: '256MiB',
  timeoutSeconds: 180,
  maxInstances: 3
}, async event => {
  if (!event.data) return;
  // Admin SDK recursiveDelete removes remaining messages, members, reactions,
  // claims and state from the closed room. It also handles already-deleted parent.
  // A deletion event can be retried; cleanup is safe to repeat.
  await event.data.ref.firestore.recursiveDelete(event.data.ref);
});
