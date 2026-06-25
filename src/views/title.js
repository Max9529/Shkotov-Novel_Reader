/**
 * views/title.js — Novel title page.
 * Shows cover, title, description, chapter list, progress.
 */

import { loadTitle, coverURL } from '../api.js';
import { navigateHome, navigateToChapter } from '../router.js';
import {
  getNovelProgress,
  getNovelStatuses,
  getChapterStatus,
  setLastNovel,
} from '../store.js';
import { iconArrowLeft, iconChevronRight } from '../icons.js';
import { renderThemeToggle, wireThemeToggle, escapeHtml, statusLabel } from './shared.js';

// We cache the loaded title per novelId for the session
const titleCache = {};

export async function renderTitle(container, novelId) {
  container.innerHTML = `
    <div class="page">
      <header class="topbar" role="banner">
        <div class="topbar__inner">
          <button class="topbar__back" id="back-home" aria-label="На головну">
            ${iconArrowLeft}
          </button>
          <span class="topbar__title" id="topbar-novel-title">Завантаження…</span>
          <div class="topbar__actions">
            ${renderThemeToggle('title-theme-btn')}
          </div>
        </div>
      </header>

      <main role="main">
        <div id="title-content">
          <div class="state-card">
            <div class="spinner"></div>
            <p class="state-card__text">Завантаження…</p>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('back-home').addEventListener('click', navigateHome);
  wireThemeToggle('title-theme-btn');

  const titleEl = document.getElementById('topbar-novel-title');
  const content = document.getElementById('title-content');

  // Find the folder for this novelId
  let entry;
  try {
    const { loadIndex } = await import('../api.js');
    const novels = await loadIndex();
    entry = novels.find(n => n.id === novelId);
    if (!entry) throw new Error(`Новелу "${novelId}" не знайдено в index.json`);
  } catch (err) {
    content.innerHTML = renderErrorState(err.message);
    return;
  }

  let title;
  try {
    title = titleCache[novelId] ?? await loadTitle(entry.folder);
    titleCache[novelId] = title;
  } catch (err) {
    content.innerHTML = renderErrorState(err.message);
    return;
  }

  titleEl.textContent = title.title;
  setLastNovel(novelId);

  const progress = getNovelProgress(novelId);
  const statuses = getNovelStatuses(novelId);

  const chapters = title.chapters ?? [];
  const totalChapters = chapters.length;
  const doneCount = chapters.filter(ch => statuses[ch.id] === 'done').length;
  const pct = totalChapters > 0 ? Math.round((doneCount / totalChapters) * 100) : 0;

  // Determine the "continue" chapter
  let continueChapterId = null;
  if (progress?.chapterId) {
    continueChapterId = progress.chapterId;
  } else if (chapters.length > 0) {
    // Find first unfinished
    const first = chapters.find(ch => statuses[ch.id] !== 'done') ?? chapters[0];
    continueChapterId = first.id;
  }

  const coverSrc = coverURL(entry.folder, title.cover);
  const titleUkHtml = title.titleUk ? `<p class="title-hero__novel-title-uk">${escapeHtml(title.titleUk)}</p>` : '';
  const descriptionHtml = title.description
    ? `<p class="title-hero__description">${escapeHtml(title.description)}</p>` : '';

  const isHeavenlyDemon = novelId === 'heavenly-demon-broadcast';
  const heroClass = isHeavenlyDemon ? 'title-hero title-hero--heavenly-demon' : 'title-hero';

  content.innerHTML = `
    <section class="${heroClass}" aria-label="Інформація про новелу">
      <div class="title-hero__inner">
        <div class="title-hero__cover">
          <img
            src="${escapeHtml(coverSrc)}"
            alt="Обкладинка: ${escapeHtml(title.title)}"
            loading="eager"
            onerror="this.style.display='none'"
          />
        </div>
        <div class="title-hero__info">
          <h1 class="title-hero__novel-title">${escapeHtml(title.title)}</h1>
          ${titleUkHtml}
          ${descriptionHtml}

          <div class="title-hero__stats">
            <div class="stat-chip">
              <span class="stat-chip__value">${totalChapters}</span>
              <span class="stat-chip__label">Розділів</span>
            </div>
            <div class="stat-chip">
              <span class="stat-chip__value">${doneCount}</span>
              <span class="stat-chip__label">Прочитано</span>
            </div>
            <div class="stat-chip">
              <span class="stat-chip__value">${pct}%</span>
              <span class="stat-chip__label">Виконано</span>
            </div>
          </div>

          <div class="title-hero__progress">
            <div class="title-hero__progress-label">
              <span>Загальний прогрес</span>
              <span>${doneCount} / ${totalChapters}</span>
            </div>
            <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar__fill" style="width:${pct}%"></div>
            </div>
          </div>

          ${continueChapterId ? `
          <div class="title-hero__actions">
            <button
              class="btn btn-primary"
              id="btn-continue"
              data-novel-id="${escapeHtml(novelId)}"
              data-chapter-id="${escapeHtml(continueChapterId)}"
            >
              ${progress?.chapterId ? 'Продовжити читання' : 'Читати з початку'}
            </button>
          </div>` : ''}
        </div>
      </div>
    </section>

    <section class="chapters-section" aria-label="Список розділів">
      <h2 class="chapters-section__heading">Розділи</h2>
      <div class="chapter-list" role="list" id="chapter-list">
        ${chapters.map(ch => renderChapterItem(ch, statuses[ch.id] ?? 'not-started')).join('')}
      </div>
    </section>
  `;

  // Wire continue button
  document.getElementById('btn-continue')?.addEventListener('click', (e) => {
    navigateToChapter(e.currentTarget.dataset.novelId, e.currentTarget.dataset.chapterId);
  });

  // Wire chapter items
  content.querySelectorAll('[data-chapter-id]').forEach(el => {
    if (el.id === 'btn-continue') return;
    el.addEventListener('click', () => {
      navigateToChapter(novelId, el.dataset.chapterId);
    });
  });
}

function renderChapterItem(chapter, status) {
  const statusClass = status === 'reading' ? 'chapter-item--reading'
    : status === 'done' ? 'chapter-item--done' : '';
  const statusText = statusLabel(status);

  return `
    <div
      class="chapter-item ${statusClass}"
      role="listitem"
      data-chapter-id="${escapeHtml(chapter.id)}"
      tabindex="0"
      aria-label="${escapeHtml(chapter.title)}"
    >
      <div class="chapter-item__num" aria-hidden="true">${chapter.number}</div>
      <div class="chapter-item__body">
        <div class="chapter-item__title">${escapeHtml(chapter.title)}</div>
        ${statusText ? `<div class="chapter-item__status">${statusText}</div>` : ''}
      </div>
      <div class="chapter-item__arrow" aria-hidden="true">${iconChevronRight}</div>
    </div>
  `;
}

function renderErrorState(message) {
  return `
    <div class="state-card">
      <div class="state-card__icon">⚠️</div>
      <p class="state-card__title">Помилка завантаження</p>
      <p class="state-card__text">${escapeHtml(message)}</p>
    </div>`;
}
