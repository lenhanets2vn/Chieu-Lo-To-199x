/**
 * Family-friendly profanity & spam filter for Lô Tô 199x chat channels.
 * Masks offensive phrases and prevents chat flood / repeated spam.
 */

// Common offensive terms in Vietnamese and English with Unicode letter boundary protection
const PROFANE_PATTERNS: RegExp[] = [
  // Vietnamese curses & vulgarities
  /(?<![\p{L}\p{N}])(đ[iịítìĩỉ]+t|d[iịítìĩỉ]+t|d[iịítìĩỉ]+ch)(?![\p{L}\p{N}])/giu,
  /(?<![\p{L}\p{N}])(đ[iịítìĩỉ]+t\s*m[ẹeéèẽ]|d[iịítìĩỉ]+t\s*m[ẹeéèẽ]|dcm|đcm|đmm|dmm|đkm|dkm)(?![\p{L}\p{N}])/giu,
  /(?<![\p{L}\p{N}])(vcl|vl|vkl|vcc|vđ|vcll)(?![\p{L}\p{N}])/giu,
  /(?<![\p{L}\p{N}])(l[ồoõóọô][nz]|l[ồoõóọô]ng|c[ặaăáàạ]c|k[ặaăáàạ]c|b[uùúũụ]i|bu[ồoõóọ]i|d[áaàạ]i|ch[iíìịĩ]m)(?![\p{L}\p{N}])/giu,
  /(?<![\p{L}\p{N}])(ch[óoòọõ]\s*đ[ẻeéèẽ]|ch[óoòọõ]\s*ch[ếeéèẽ]t|s[úuùụ]c\s*v[ậaăáàạ]t|đ[iĩíìị]\s*th[ỏoõóọ]a|con\s*đ[iĩíìị]|đ[iĩíìị]\s*m[ẹeéèẽ]|đ[iĩíìị])(?![\p{L}\p{N}])/giu,
  /(?<![\p{L}\p{N}])(m[ẹeéèẽ]\s*ki[ếeéèẽ]p|m[ẹeéèẽ]\s*m[àaáạã]y|th[ằaăáàạ]ng\s*ch[óoòọõ]|đ[ùụuúũ]\s*m[ẹeéèẽ]|đ[ùụuúũ]|đ[ùụuúũ]\s*m[áàaạã]|du\s*ma)(?![\p{L}\p{N}])/giu,
  /(?<![\p{L}\p{N}])(ngu\s*vl|ngu\s*nh[uư]\s*ch[óoòọõ]|ngu\s*nh[uư]\s*b[òoóọõ]|th[ằaăáàạ]ng\s*ngu)(?![\p{L}\p{N}])/giu,
  // English vulgarities
  /(?<![\p{L}\p{N}])(fuck|fucking|fucker|shit|bitch|bastard|asshole|cunt|dick|pussy)(?![\p{L}\p{N}])/giu
];

interface SpamTracker {
  lastMessageTime: number;
  lastMessageText: string;
}

const userSpamState = new Map<string, SpamTracker>();

/**
 * Filter text for profanity and mask offensive words with ***.
 */
export function maskProfanity(text: string): string {
  let cleaned = text;
  for (const pattern of PROFANE_PATTERNS) {
    pattern.lastIndex = 0;
    cleaned = cleaned.replace(pattern, (match) => '*'.repeat(match.length));
  }
  return cleaned;
}

/**
 * Check if text contains any profane terms.
 */
export function hasProfanity(text: string): boolean {
  return PROFANE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

export interface FilterResult {
  allowed: boolean;
  filteredText: string;
  reason?: string;
}

/**
 * Validates message against profanity, message length and spam timing.
 */
export function validateAndFilterChatMessage(
  userId: string,
  rawText: string,
  channel: 'world' | 'room'
): FilterResult {
  const text = rawText.trim();

  // 1. Empty check
  if (!text) {
    return { allowed: false, filteredText: '', reason: 'Tin nhắn không được để trống.' };
  }

  // 2. Length check (Max 180 chars like 90s cyber net)
  if (text.length > 180) {
    return { allowed: false, filteredText: '', reason: 'Tin nhắn quá dài (tối đa 180 ký tự).' };
  }

  // 3. Spam Rate-limit check (at least 1.0s between messages)
  const now = Date.now();
  const channelUserKey = `${channel}:${userId}`;
  const tracker = userSpamState.get(channelUserKey) || { lastMessageTime: 0, lastMessageText: '' };

  const minInterval = channel === 'world' ? 1200 : 800; // World channel slightly stricter
  if (now - tracker.lastMessageTime < minInterval) {
    return {
      allowed: false,
      filteredText: '',
      reason: 'Bà con nhắn quá nhanh! Hãy chờ 1 giây trước khi gửi tiếp nhé.'
    };
  }

  // 4. Repeated spam check (same text sent back-to-back within 8s)
  if (tracker.lastMessageText.toLowerCase() === text.toLowerCase() && now - tracker.lastMessageTime < 8000) {
    return {
      allowed: false,
      filteredText: '',
      reason: 'Tránh gửi lặp lại cùng một câu liên tục trong chiếu!'
    };
  }

  // 5. Mask profanity politely
  const filteredText = maskProfanity(text);

  // Update spam tracker
  userSpamState.set(channelUserKey, {
    lastMessageTime: now,
    lastMessageText: text
  });

  return { allowed: true, filteredText };
}
