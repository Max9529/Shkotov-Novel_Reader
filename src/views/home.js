/**
 * views/home.js — Home page: list of novels.
 */

import { loadIndex, loadTitle, coverURL } from '../api.js';
import { navigateToNovel, navigateToChapter } from '../router.js';
import { getNovelProgress, getNovelStatuses, setLastNovel } from '../store.js';
import { iconBook, iconChevronRight } from '../icons.js';
import { renderThemeToggle, wireThemeToggle, escapeHtml } from './shared.js';

export async function renderHome(container) {
  container.innerHTML = `
    <div class="page">
      <header class="topbar" role="banner">
        <div class="topbar__inner">
          <span class="topbar__logo">Novel <span>Reader</span></span>
          <div class="topbar__actions">
            ${renderThemeToggle('home-theme-btn')}
          </div>
        </div>
      </header>

      <div class="home-hero">
        <h1 class="home-hero__heading">Моя бібліотека</h1>
        <p class="home-hero__sub">Виберіть новелу для читання</p>
      </div>

      <main class="novels-grid" id="novels-grid" role="main">
        <div class="state-card">
          <div class="spinner"></div>
          <p class="state-card__text">Завантаження новел…</p>
        </div>
      </main>
    </div>
  `;

  wireThemeToggle('home-theme-btn');

  const grid = container.querySelector('#novels-grid');

  try {
    const novelEntries = await loadIndex();

    if (!novelEntries.length) {
      grid.innerHTML = `
        <div class="state-card">
          <div class="state-card__icon">${iconBook}</div>
          <p class="state-card__title">Новел не знайдено</p>
          <p class="state-card__text">Додайте новели до папки ZFolder і оновіть index.json.</p>
        </div>`;
      return;
    }

    // Load all title.json files in parallel
    const titles = await Promise.all(
      novelEntries.map(entry => loadTitle(entry.folder).catch(() => null))
    );

    const cards = novelEntries.map((entry, i) => {
      const title = titles[i];
      if (!title) return renderErrorCard(entry.id);
      return renderNovelCard(entry, title);
    });

    grid.innerHTML = cards.join('');

    // Wire up open buttons
    grid.querySelectorAll('[data-open-novel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const novelId = btn.dataset.openNovel;
        setLastNovel(novelId);
        navigateToNovel(novelId);
      });
    });

    // Wire up continue buttons
    grid.querySelectorAll('[data-continue-novel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const novelId = btn.dataset.continueNovel;
        const chapterId = btn.dataset.chapterId;
        setLastNovel(novelId);
        navigateToChapter(novelId, chapterId);
      });
    });

  } catch (err) {
    grid.innerHTML = `
      <div class="state-card">
        <div class="state-card__icon">⚠️</div>
        <p class="state-card__title">Помилка завантаження</p>
        <p class="state-card__text">${escapeHtml(err.message)}</p>
      </div>`;
  }
}

function renderNovelCard(entry, title) {
  const progress = getNovelProgress(entry.id);
  const statuses = getNovelStatuses(entry.id);

  const totalChapters = title.chapters?.length ?? 0;
  const doneCount = title.chapters?.filter(ch => statuses[ch.id] === 'done').length ?? 0;
  const pct = totalChapters > 0 ? Math.round((doneCount / totalChapters) * 100) : 0;

  const coverSrc = coverURL(entry.folder, title.cover);
  const hasProgress = !!(progress?.chapterId);

  const continueBtn = hasProgress ? `
    <button
      class="btn btn-primary btn-sm"
      data-continue-novel="${escapeHtml(entry.id)}"
      data-chapter-id="${escapeHtml(progress.chapterId)}"
      aria-label="Продовжити читання ${escapeHtml(title.title)}"
    >
      ▶ Продовжити
    </button>` : '';

  const titleUkHtml = title.titleUk
    ? `<p class="novel-card__title-uk">${escapeHtml(title.titleUk)}</p>` : '';

  return `
    <article class="novel-card" role="article">
      <div class="novel-card__cover-wrap" data-open-novel="${escapeHtml(entry.id)}">
        <img
          class="novel-card__cover"
          src="${escapeHtml(coverSrc)}"
          alt="Обкладинка: ${escapeHtml(title.title)}"
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="novel-card__cover-placeholder" style="display:none" aria-hidden="true">📖</div>
      </div>

      <div class="novel-card__body">
        <h2 class="novel-card__title" data-open-novel="${escapeHtml(entry.id)}">${escapeHtml(title.title)}</h2>
        ${titleUkHtml}

        <div class="novel-card__meta">
          <span class="novel-card__meta-item">
            <span aria-hidden="true">📚</span>
            ${totalChapters} розділів
          </span>
          ${doneCount > 0 ? `<span class="novel-card__meta-item">
            <span aria-hidden="true">✓</span>
            ${doneCount} прочитано
          </span>` : ''}
        </div>

        ${totalChapters > 0 ? `
        <div class="novel-card__progress-wrap">
          <div class="novel-card__progress-label">
            <span>Прогрес</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-bar" role="progressbar"
               aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar__fill" style="width:${pct}%"></div>
          </div>
        </div>` : ''}

        <div class="novel-card__actions">
          ${continueBtn}
          <button
            class="btn btn-secondary btn-sm"
            data-open-novel="${escapeHtml(entry.id)}"
            aria-label="${hasProgress ? 'До списку розділів' : 'Відкрити'} ${escapeHtml(title.title)}"
          >
            ${hasProgress ? 'До списку' : 'Відкрити'}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderErrorCard(id) {
  return `
    <div class="novel-card">
      <div class="novel-card__body">
        <p class="novel-card__title">⚠️ Не вдалося завантажити</p>
        <p style="color:var(--color-text-muted);font-size:13px">${escapeHtml(id)}</p>
      </div>
    </div>`;
}
