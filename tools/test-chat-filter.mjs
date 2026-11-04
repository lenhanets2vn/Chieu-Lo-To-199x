import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(relative) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const js = ts.transpileModule(source, {
    fileName: relative,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

const { maskProfanity, hasProfanity, validateAndFilterChatMessage } = load('src/features/chat/profanityFilter.ts');
const { QUICK_REACTIONS } = load('src/features/reactions/FloatingEmoteBar.tsx');

// Test 1: Profanity detection & masking
console.log('Testing profanity detection & masking...');
assert.equal(hasProfanity('chào bà con cô bác'), false);
assert.equal(hasProfanity('đù má vui quá'), true);
assert.equal(hasProfanity('vcl ghê vậy'), true);
assert.equal(hasProfanity('what the fuck'), true);

const masked1 = maskProfanity('thằng chó chết');
assert.ok(!masked1.includes('chó chết'));
assert.ok(masked1.includes('***'));

const masked2 = maskProfanity('đù má vcl');
assert.ok(!masked2.includes('vcl'));

// Test 2: Rate limit and spam validations
console.log('Testing spam validation...');
const userA = 'user-test-101';
// 1st valid message
const res1 = validateAndFilterChatMessage(userA, 'Chào cả phòng nhé!', 'world');
assert.equal(res1.allowed, true);
assert.equal(res1.filteredText, 'Chào cả phòng nhé!');

// Rapid 2nd message (< 1.2s in world channel) -> should be blocked by rate limit
const res2 = validateAndFilterChatMessage(userA, 'Tin nhắn thứ 2', 'world');
assert.equal(res2.allowed, false);
assert.ok(res2.reason.includes('nhanh') || res2.reason.includes('chờ'));

// Empty message
const resEmpty = validateAndFilterChatMessage('user-test-102', '   ', 'room');
assert.equal(resEmpty.allowed, false);

// Long message > 180 chars
const longStr = 'a'.repeat(185);
const resLong = validateAndFilterChatMessage('user-test-103', longStr, 'room');
assert.equal(resLong.allowed, false);
assert.ok(resLong.reason.includes('dài') || resLong.reason.includes('180'));

// Test 3: Quick reactions config
console.log('Testing quick reactions...');
assert.equal(QUICK_REACTIONS.length, 8);
const emojis = QUICK_REACTIONS.map(r => r.emoji);
assert.ok(emojis.includes('🤣'));
assert.ok(emojis.includes('😭'));
assert.ok(emojis.includes('👍'));
assert.ok(emojis.includes('❤️'));
assert.ok(emojis.includes('👏'));
assert.ok(emojis.includes('🔥'));
assert.ok(emojis.includes('🏮'));
assert.ok(emojis.includes('🍀'));

console.log('ALL UNIT TESTS PASSED: Profanity masking, rate-limiting spam defense, length check, and quick reaction configs verified.');
