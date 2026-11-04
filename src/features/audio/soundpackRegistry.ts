/** Runtime soundpack registry. Add another pack by editing only public/soundpacks/catalog.json
 * and placing its 01..90, intro, near_end, outro audio files under public/<basePath>/.
 * No source-code changes are required to add a compatible soundpack.
 */
export type SoundpackDefinition = {
  id: string;
  title: string;
  basePath: string;
  maxNumber: 90;
  preferredFormats: Array<'mp3'|'webm'>;
  description?: string;
};

export const DEFAULT_SOUNDPACK: SoundpackDefinition = {
  id: 'hoi-cho-199x', title: 'Hò Lô Tô Hội Chợ 199x', basePath: 'soundpack',
  maxNumber: 90, preferredFormats: ['mp3', 'webm'],
  description: '90 bài hò, nhạc dạo, nhạc gần kết và nhạc kết.'
};

export function getSoundpackAssetUrl(pack: SoundpackDefinition, fileName: string): string {
  // Only fixed song identifiers and safe relative paths are allowed; no arbitrary URLs.
  if (!/^(?:\d\d|intro|near_end|outro)\.(?:mp3|webm)$/.test(fileName)) {
    throw new Error(`Tên file nhạc không hợp lệ: ${fileName}`);
  }
  return `${import.meta.env.BASE_URL}${pack.basePath}/${fileName}`;
}

function validatePack(raw: unknown): SoundpackDefinition | null {
  if (!raw || typeof raw !== 'object') return null;
  const pack = raw as Record<string, unknown>;
  if (typeof pack.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,48}$/.test(pack.id)) return null;
  if (typeof pack.title !== 'string' || !pack.title.trim()) return null;
  if (typeof pack.basePath !== 'string' || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(pack.basePath)) return null;
  if (pack.maxNumber !== 90) return null; // Game currently requires a complete 01–90 pack.
  if (!Array.isArray(pack.preferredFormats) || !pack.preferredFormats.length ||
      pack.preferredFormats.some(f => f !== 'mp3' && f !== 'webm')) return null;
  return {
    id: pack.id, title: pack.title, basePath: pack.basePath, maxNumber: 90,
    preferredFormats: [...new Set(pack.preferredFormats)] as Array<'mp3'|'webm'>,
    description: typeof pack.description === 'string' ? pack.description : undefined
  };
}

export async function loadSoundpackCatalog(): Promise<SoundpackDefinition[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}soundpacks/catalog.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Danh sách soundpack: HTTP ${response.status}`);
  const json: unknown = await response.json();
  if (!Array.isArray(json)) throw new Error('Danh sách soundpack không phải mảng JSON.');
  const result = json.map(validatePack).filter((p): p is SoundpackDefinition => p !== null);
  if (!result.some(p => p.id === DEFAULT_SOUNDPACK.id)) throw new Error('Thiếu soundpack mặc định.');
  if (new Set(result.map(p => p.id)).size !== result.length) throw new Error('ID soundpack bị trùng.');
  return result;
}
