/**
 * views/reader.js — Chapter reader view.
 *
 * Features:
 *  - Fetches and renders Markdown via marked.js
 *  - Reading progress bar (scroll %)
 *  - Scroll position save (debounced) and restore
 *  - Auto-mark chapter as "done" at 95% scroll
 *  - Prev / Next chapter navigation
 *  - Reader settings panel integration
 *  - Theme toggle
 */

import { loadIndex, loadTitle, loadChapter } from '../api.js';
import { navigateToNovel, navigateToChapter } from '../router.js';
import {
  getNovelProgress,
  saveProgress,
  setChapterStatus,
  getChapterStatus,
} from '../store.js';
import { iconArrowLeft, iconChevronLeft, iconChevronRight, iconSettings } from '../icons.js';
import { renderThemeToggle, wireThemeToggle, escapeHtml } from './shared.js';
import {
  initSettingsPanel,
  destroySettingsPanel,
  openSettings,
  applySettingsToDOM,
} from './settings.js';

// Session-level caches
const _indexCache = { loaded: false, novels: [] };
const _titleCache = {};

const SCROLL_DEBOUNCE_MS = 600;
const DONE_THRESHOLD_PCT = 95;

export async function renderReader(container, novelId, chapterId) {
  // Apply saved reader settings before anything paints
  applySettingsToDOM();

  container.innerHTML = `
    <div class="reader-page" id="reader-page">

      <header class="reader-topbar" role="banner">
        <div class="reader-topbar__inner">
          <button class="reader-topbar__back" id="reader-back" aria-label="До сторінки новели">
            ${iconArrowLeft}
          </button>
          <span class="reader-topbar__chapter-title" id="reader-chapter-title">Завантаження…</span>
          <div class="reader-topbar__actions">
            ${renderThemeToggle('reader-theme-btn')}
            <button
              class="btn-theme"
              id="reader-settings-btn"
              aria-label="Налаштування читання"
              title="Налаштування"
            >${iconSettings}</button>
          </div>
        </div>
        <div
          class="reading-progress-bar"
          role="progressbar"
          aria-label="Прогрес розділу"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="0"
        >
          <div class="reading-progress-bar__fill" id="reading-bar-fill" style="width:0%"></div>
        </div>
      </header>

      <div id="reader-body" style="flex:1">
        <div class="state-card">
          <div class="spinner"></div>
          <p class="state-card__text">Завантаження розділу…</p>
        </div>
      </div>

      <nav class="reader-nav" role="navigation" aria-label="Навігація між розділами">
        <div class="reader-nav__inner">
          <button class="reader-nav__btn reader-nav__btn--prev" id="btn-prev" disabled aria-label="Попередній розділ">
            ${iconChevronLeft} <span>Попередній</span>
          </button>
          <span class="reader-nav__pos" id="reader-pos" aria-live="polite"></span>
          <button class="reader-nav__btn reader-nav__btn--next" id="btn-next" disabled aria-label="Наступний розділ">
            <span>Наступний</span> ${iconChevronRight}
          </button>
        </div>
      </nav>

    </div>
  `;

  // Wire static elements
  document.getElementById('reader-back').addEventListener('click', () => {
    cleanup();
    navigateToNovel(novelId);
  });

  wireThemeToggle('reader-theme-btn');
  document.getElementById('reader-settings-btn').addEventListener('click', openSettings);

  // Init settings panel (bottom drawer)
  initSettingsPanel(() => applySettingsToDOM());

  // ── Load index & title ──────────────────────────────────────────────────

  let entry, title;
  try {
    if (!_indexCache.loaded) {
      _indexCache.novels = await loadIndex();
      _indexCache.loaded = true;
    }
    entry = _indexCache.novels.find(n => n.id === novelId);
    if (!entry) throw new Error(`Новелу "${novelId}" не знайдено в index.json`);

    if (!_titleCache[novelId]) {
      _titleCache[novelId] = await loadTitle(entry.folder);
    }
    title = _titleCache[novelId];
  } catch (err) {
    document.getElementById('reader-body').innerHTML = errHTML(err.message);
    return;
  }

  const chapters = title.chapters ?? [];
  const chapterIndex = chapters.findIndex(ch => ch.id === chapterId);

  if (chapterIndex === -1) {
    document.getElementById('reader-body').innerHTML = errHTML(`Розділ "${chapterId}" не знайдено`);
    return;
  }

  const chapter   = chapters[chapterIndex];
  const prevChapter = chapterIndex > 0                  ? chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

  // Update header
  document.getElementById('reader-chapter-title').textContent = chapter.title;
  document.title = `${chapter.title} — Novel Reader`;
  document.getElementById('reader-pos').textContent = `${chapterIndex + 1} / ${chapters.length}`;

  // Wire prev/next
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (prevChapter) {
    btnPrev.disabled = false;
    btnPrev.addEventListener('click', () => {
      cleanup();
      navigateToChapter(novelId, prevChapter.id);
    });
  }

  if (nextChapter) {
    btnNext.disabled = false;
    btnNext.addEventListener('click', () => {
      cleanup();
      navigateToChapter(novelId, nextChapter.id);
    });
  }

  // Mark chapter as reading (if not already done)
  if (getChapterStatus(novelId, chapterId) === 'not-started') {
    setChapterStatus(novelId, chapterId, 'reading');
  }

  // ── Load Markdown ────────────────────────────────────────────────────────

  let markdown;
  try {
    markdown = await loadChapter(entry.folder, chapter.file);
  } catch (err) {
    document.getElementById('reader-body').innerHTML = errHTML(err.message);
    return;
  }

  // Render: strip H1 (it appears in header) then parse
  const mdBody = markdown.replace(/^#[^\n]*\n?/, '');

  let htmlContent;
  if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: false, gfm: true });
    htmlContent = marked.parse(mdBody);
  } else {
    // Bare-bones fallback (no marked.js)
    htmlContent = mdBody
      .split(/\n{2,}/)
      .filter(p => p.trim())
      .map(p => {
        const line = p.trim();
        if (line.startsWith('---') || line.startsWith('————')) {
          return '<hr>';
        }
        return `<p>${escapeHtml(line).replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');
  }

  document.getElementById('reader-body').innerHTML = `
    <article class="reader-content" id="reader-content" role="article">
      <h1 class="reader-chapter-heading">${escapeHtml(chapter.title)}</h1>
      <div class="prose" id="prose-content">
        ${htmlContent}
      </div>
    </article>
  `;

  // Wire click/tap on prose text to toggle top/bottom bars
  let barsHidden = false;
  function setBarsHidden(hidden) {
    barsHidden = hidden;
    const topbar = container.querySelector('.reader-topbar');
    const nav = container.querySelector('.reader-nav');
    if (topbar) {
      topbar.classList.toggle('reader-topbar--hidden', hidden);
    }
    if (nav) {
      nav.classList.toggle('reader-nav--hidden', hidden);
    }
  }

  const readerContent = document.getElementById('reader-content');
  if (readerContent) {
    readerContent.addEventListener('click', (e) => {
      // Don't toggle if clicking on interactive elements (links, buttons)
      if (e.target.closest('a') || e.target.closest('button')) return;
      setBarsHidden(!barsHidden);
    });
  }

  // Assign paragraph IDs for future bookmarks/comments
  assignParagraphIds(chapterId);

  // Restore saved scroll position
  restoreScrollPosition(novelId, chapterId);

  // ── Scroll tracking ──────────────────────────────────────────────────────

  const barFill = document.getElementById('reading-bar-fill');
  const progressBar = document.querySelector('.reading-progress-bar');
  let saveTimer = null;
  let lastScrollY = window.scrollY;

  function onScroll() {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? Math.min(100, (scrollTop / maxScroll) * 100) : 0;

    barFill.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', Math.round(pct));

    // Hide bars on scroll down, show on scroll up
    const scrollDelta = scrollTop - lastScrollY;
    if (scrollTop > 50) {
      if (scrollDelta > 10 && !barsHidden) {
        setBarsHidden(true);
      } else if (scrollDelta < -10 && barsHidden) {
        setBarsHidden(false);
      }
    } else {
      if (barsHidden) {
        setBarsHidden(false);
      }
    }
    lastScrollY = scrollTop;

    // Auto-complete at 95%
    if (pct >= DONE_THRESHOLD_PCT && getChapterStatus(novelId, chapterId) !== 'done') {
      setChapterStatus(novelId, chapterId, 'done');
    }

    // Debounced save
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveProgress(novelId, chapterId, pct);
    }, SCROLL_DEBOUNCE_MS);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  function cleanup() {
    window.removeEventListener('scroll', onScroll);
    clearTimeout(saveTimer);
    destroySettingsPanel();
  }

  // Clean up on next navigation
  window.addEventListener('hashchange', cleanup, { once: true });
}

/** Assign stable paragraph IDs: {chapterId}-p-{index} */
function assignParagraphIds(chapterId) {
  const prose = document.getElementById('prose-content');
  if (!prose) return;
  prose.querySelectorAll('p').forEach((p, i) => {
    p.id = `${chapterId}-p-${i}`;
  });
}

/** Scroll to the saved reading position for this chapter. */
function restoreScrollPosition(novelId, chapterId) {
  const progress = getNovelProgress(novelId);
  if (!progress || progress.chapterId !== chapterId) return;

  const pct = progress.scrollPercent;
  if (!pct || pct < 2) return; // near the top → don't restore

  requestAnimationFrame(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (pct / 100) * maxScroll, behavior: 'smooth' });
  });
}

function errHTML(msg) {
  return `
    <div class="state-card">
      <div class="state-card__icon">⚠️</div>
      <p class="state-card__title">Помилка завантаження</p>
      <p class="state-card__text">${escapeHtml(msg)}</p>
    </div>`;
}
