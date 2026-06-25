/**
 * views/settings.js — Reader settings panel (bottom drawer).
 * Font size, line height, content width, font family.
 */

import { getSettings, saveSettings } from '../store.js';

let panelEl = null;
let overlayEl = null;
let onChangeCallback = null;

/**
 * Create the settings panel DOM and append it to body.
 * Call once when entering the reader view.
 */
export function initSettingsPanel(onChange) {
  onChangeCallback = onChange;

  // Clean up previous instance if any
  destroySettingsPanel();

  overlayEl = document.createElement('div');
  overlayEl.className = 'settings-overlay';
  overlayEl.id = 'settings-overlay';
  overlayEl.setAttribute('aria-hidden', 'true');
  overlayEl.addEventListener('click', closeSettings);

  panelEl = document.createElement('div');
  panelEl.className = 'settings-panel';
  panelEl.id = 'settings-panel';
  panelEl.setAttribute('role', 'dialog');
  panelEl.setAttribute('aria-label', 'Налаштування читання');
  panelEl.innerHTML = buildPanelHTML();

  document.body.appendChild(overlayEl);
  document.body.appendChild(panelEl);

  wirePanel();
}

export function destroySettingsPanel() {
  document.getElementById('settings-overlay')?.remove();
  document.getElementById('settings-panel')?.remove();
  panelEl = null;
  overlayEl = null;
}

export function openSettings() {
  if (!panelEl) return;
  refreshPanel();
  panelEl.classList.add('open');
  overlayEl.classList.add('open');
  overlayEl.setAttribute('aria-hidden', 'false');
}

export function closeSettings() {
  panelEl?.classList.remove('open');
  overlayEl?.classList.remove('open');
  overlayEl?.setAttribute('aria-hidden', 'true');
}

function buildPanelHTML() {
  const s = getSettings();
  return `
    <div class="settings-panel__handle" aria-hidden="true"></div>
    <div class="settings-panel__title">Налаштування читання</div>
    <div class="settings-panel__body">

      <!-- Font Family -->
      <div class="settings-row">
        <span class="settings-row__label">Шрифт</span>
        <div class="settings-row__controls">
          <div class="custom-select" id="font-family-select-wrap">
            <button class="custom-select__trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
              <span class="custom-select__trigger-label">${getFontName(s.fontFamily)}</span>
              <svg class="custom-select__arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div class="custom-select__dropdown" role="listbox">
              <div class="custom-select__option${s.fontFamily === 'serif' ? ' selected' : ''}" data-value="serif" role="option">Lora (Із засічками)</div>
              <div class="custom-select__option${s.fontFamily === 'literata' ? ' selected' : ''}" data-value="literata" role="option">Literata</div>
              <div class="custom-select__option${s.fontFamily === 'noto-serif' ? ' selected' : ''}" data-value="noto-serif" role="option">Noto Serif</div>
              <div class="custom-select__option${s.fontFamily === 'merriweather' ? ' selected' : ''}" data-value="merriweather" role="option">Merriweather</div>
              <div class="custom-select__option${s.fontFamily === 'sans-serif' ? ' selected' : ''}" data-value="sans-serif" role="option">Inter (Без засічок)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Font Size -->
      <div class="settings-row">
        <span class="settings-row__label">Розмір шрифту</span>
        <div class="settings-row__controls">
          <button class="settings-step" id="font-size-dec" aria-label="Зменшити шрифт">−</button>
          <span class="settings-row__value" id="font-size-val">${s.fontSize}px</span>
          <button class="settings-step" id="font-size-inc" aria-label="Збільшити шрифт">+</button>
        </div>
      </div>

      <!-- Line Height -->
      <div class="settings-row">
        <span class="settings-row__label">Міжрядковий інтервал</span>
        <div class="settings-row__controls">
          <button class="settings-step" id="line-height-dec" aria-label="Зменшити інтервал">−</button>
          <span class="settings-row__value" id="line-height-val">${s.lineHeight.toFixed(2)}</span>
          <button class="settings-step" id="line-height-inc" aria-label="Збільшити інтервал">+</button>
        </div>
      </div>

      <!-- Content Width -->
      <div class="settings-row">
        <span class="settings-row__label">Ширина тексту</span>
        <div class="settings-row__controls">
          <input
            type="range"
            class="settings-row__slider"
            id="content-width-slider"
            min="400" max="900" step="20"
            value="${s.contentWidth}"
            aria-label="Ширина тексту"
          />
          <span class="settings-row__value" id="content-width-val">${s.contentWidth}</span>
        </div>
      </div>

    </div>
  `;
}

function getFontName(value) {
  switch (value) {
    case 'serif': return 'Lora (Із засічками)';
    case 'literata': return 'Literata';
    case 'noto-serif': return 'Noto Serif';
    case 'merriweather': return 'Merriweather';
    case 'sans-serif': return 'Inter (Без засічок)';
    default: return 'Lora (Із засічками)';
  }
}

function refreshPanel() {
  if (!panelEl) return;
  panelEl.innerHTML = buildPanelHTML();
  wirePanel();
}

function wirePanel() {
  if (!panelEl) return;
  const s = getSettings();

  // Font size
  panelEl.querySelector('#font-size-dec')?.addEventListener('click', () => {
    const cur = getSettings().fontSize;
    if (cur <= 14) return;
    applyAndSave({ fontSize: cur - 1 });
    panelEl.querySelector('#font-size-val').textContent = (cur - 1) + 'px';
  });

  panelEl.querySelector('#font-size-inc')?.addEventListener('click', () => {
    const cur = getSettings().fontSize;
    if (cur >= 28) return;
    applyAndSave({ fontSize: cur + 1 });
    panelEl.querySelector('#font-size-val').textContent = (cur + 1) + 'px';
  });

  // Line height
  panelEl.querySelector('#line-height-dec')?.addEventListener('click', () => {
    const cur = getSettings().lineHeight;
    if (cur <= 1.2) return;
    const next = Math.round((cur - 0.05) * 100) / 100;
    applyAndSave({ lineHeight: next });
    panelEl.querySelector('#line-height-val').textContent = next.toFixed(2);
  });

  panelEl.querySelector('#line-height-inc')?.addEventListener('click', () => {
    const cur = getSettings().lineHeight;
    if (cur >= 2.5) return;
    const next = Math.round((cur + 0.05) * 100) / 100;
    applyAndSave({ lineHeight: next });
    panelEl.querySelector('#line-height-val').textContent = next.toFixed(2);
  });

  // Content width
  const widthSlider = panelEl.querySelector('#content-width-slider');
  const widthVal = panelEl.querySelector('#content-width-val');
  widthSlider?.addEventListener('input', () => {
    widthVal.textContent = widthSlider.value;
    applyAndSave({ contentWidth: Number(widthSlider.value) });
  });

  // Custom font select
  const customSelect = panelEl.querySelector('#font-family-select-wrap');
  const trigger = customSelect?.querySelector('.custom-select__trigger');
  const options = customSelect?.querySelectorAll('.custom-select__option');

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = customSelect.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  options?.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.dataset.value;
      applyAndSave({ fontFamily: val });
      
      // Update UI
      trigger.querySelector('.custom-select__trigger-label').textContent = getFontName(val);
      options.forEach(o => o.classList.toggle('selected', o === opt));
      customSelect.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });
  });
}

// Close custom select dropdown on click outside
document.addEventListener('click', (e) => {
  const openSelect = document.querySelector('.custom-select.open');
  if (openSelect && !openSelect.contains(e.target)) {
    openSelect.classList.remove('open');
    openSelect.querySelector('.custom-select__trigger')?.setAttribute('aria-expanded', 'false');
  }
});

function applyAndSave(patch) {
  saveSettings(patch);
  applySettingsToDOM();
  onChangeCallback?.();
}

export function applySettingsToDOM() {
  const s = getSettings();
  const root = document.documentElement;
  root.style.setProperty('--reader-font-size', s.fontSize + 'px');
  root.style.setProperty('--reader-line-height', String(s.lineHeight));
  root.style.setProperty('--reader-content-width', s.contentWidth + 'px');
  
  let fontFamilyValue = "var(--font-reader)"; // default Lora
  if (s.fontFamily === 'sans-serif') fontFamilyValue = "var(--font-ui)"; // Inter
  else if (s.fontFamily === 'literata') fontFamilyValue = "'Literata', serif";
  else if (s.fontFamily === 'noto-serif') fontFamilyValue = "'Noto Serif', serif";
  else if (s.fontFamily === 'merriweather') fontFamilyValue = "'Merriweather', serif";
  
  root.style.setProperty('--reader-font-family', fontFamilyValue);
}
