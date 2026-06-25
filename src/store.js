/**
 * store.js — Local storage management for Novel Reader.
 * All keys are prefixed with "novelReader." per SDR-001.
 */

const PREFIX = 'novelReader.';
const SCHEMA_VERSION = 1;

// ─── Helpers ────────────────────────────────────────────────────────────────

function read(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('[store] Не вдалося зберегти дані:', e);
  }
}

// ─── Schema version ──────────────────────────────────────────────────────────

export function ensureSchema() {
  const stored = read('schemaVersion');
  if (stored !== SCHEMA_VERSION) {
    write('schemaVersion', SCHEMA_VERSION);
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 18,
  lineHeight: 1.65,
  contentWidth: 680,
  fontFamily: 'serif',
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...(read('settings') ?? {}) };
}

export function saveSettings(patch) {
  const current = getSettings();
  write('settings', { ...current, ...patch });
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export function getTheme() {
  return getSettings().theme;
}

export function setTheme(theme) {
  saveSettings({ theme });
  applyTheme(theme);
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

// ─── Reading Progress ─────────────────────────────────────────────────────────

/**
 * progress = {
 *   [novelId]: {
 *     chapterId: string,
 *     scrollPercent: number,
 *     updatedAt: string (ISO),
 *   }
 * }
 */
export function getAllProgress() {
  return read('progress') ?? {};
}

export function getNovelProgress(novelId) {
  return getAllProgress()[novelId] ?? null;
}

export function saveProgress(novelId, chapterId, scrollPercent) {
  const all = getAllProgress();
  all[novelId] = {
    chapterId,
    scrollPercent: Math.round(scrollPercent),
    updatedAt: new Date().toISOString(),
  };
  write('progress', all);
}

// ─── Chapter Statuses ────────────────────────────────────────────────────────

/**
 * statuses = {
 *   [novelId]: {
 *     [chapterId]: 'not-started' | 'reading' | 'done'
 *   }
 * }
 */
export function getAllStatuses() {
  return read('chapterStatuses') ?? {};
}

export function getNovelStatuses(novelId) {
  return getAllStatuses()[novelId] ?? {};
}

export function getChapterStatus(novelId, chapterId) {
  return getNovelStatuses(novelId)[chapterId] ?? 'not-started';
}

export function setChapterStatus(novelId, chapterId, status) {
  const all = getAllStatuses();
  if (!all[novelId]) all[novelId] = {};
  all[novelId][chapterId] = status;
  write('chapterStatuses', all);
}

// ─── Last opened novel ───────────────────────────────────────────────────────

export function getLastNovel() {
  return read('lastNovel') ?? null;
}

export function setLastNovel(novelId) {
  write('lastNovel', novelId);
}
