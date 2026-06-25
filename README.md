# Novel Reader

Приватна статична читалка Markdown-новел для GitHub Pages.

## Особливості

- 📚 Список новел із обкладинками та прогресом
- 📖 Читання Markdown-розділів у зручному форматі
- 🌙 Перемикач теми (світла / темна)
- 💾 Збереження прогресу читання (localStorage)
- 📱 Мобільна адаптація
- ⚙️ Налаштування читання: шрифт, розмір, міжрядковий інтервал, ширина
- ⚡ Без бекенду, без авторизації, без аналітики

## Структура контенту

```
ZFolder/
  index.json                          ← список новел
  heavenly-demon-broadcast/
    title.json                        ← конфіг новели
    cover.webp                        ← обкладинка
    chapter1_translation.md
    chapter2_translation.md
    ...
```

## Запуск локально

> ⚠️ Файли `type="module"` та `fetch()` не працюють через `file://`. Потрібен HTTP-сервер.

### Варіант 1 — вбудований сервер (Node.js)

```bash
node serve.js
# Відкрийте http://localhost:8080
```

### Варіант 2 — VS Code Live Server

Встановіть розширення **Live Server** і натисніть `Go Live`.

### Варіант 3 — Python

```bash
python -m http.server 8080
# Відкрийте http://localhost:8080
```

## Структура коду

```
index.html          ← точка входу SPA
styles.css          ← дизайн-система (CSS custom properties)
serve.js            ← простий локальний HTTP-сервер
src/
  app.js            ← bootstrap, оркестратор маршрутів
  router.js         ← hash-навігація (#/novel/id/chapter-id)
  store.js          ← localStorage (прогрес, налаштування, статуси)
  api.js            ← fetch-хелпери для ZFolder
  icons.js          ← inline SVG іконки
  views/
    home.js         ← головний екран
    title.js        ← сторінка тайтлу
    reader.js       ← екран читання
    settings.js     ← нижній drawer налаштувань
    shared.js       ← спільні утиліти
```

## Навігація (хеш-маршрути)

| URL | Сторінка |
|-----|---------|
| `#/` | Головний екран (список новел) |
| `#/novel/:id` | Сторінка тайтлу |
| `#/novel/:id/:chapterId` | Екран читання розділу |

## Деплой на GitHub Pages

Деплой відбувається автоматично через GitHub Actions при push у гілку `main`.
Файл: `.github/workflows/deploy-pages.yml`

Переконайтесь, що в налаштуваннях репозиторію → Settings → Pages вибрано **GitHub Actions** як джерело.

## Додавання нових розділів

1. Додайте Markdown-файл у `ZFolder/heavenly-demon-broadcast/`
2. Оновіть `ZFolder/heavenly-demon-broadcast/title.json` — додайте запис у масив `chapters`
3. Зробіть push → GitHub Pages автоматично оновиться

## Додавання нової новели

1. Створіть папку `ZFolder/your-novel-slug/`
2. Додайте `cover.webp`, `title.json`, Markdown-файли
3. Додайте запис у `ZFolder/index.json`
4. Зробіть push

## Локальні дані (localStorage)

| Ключ | Дані |
|------|------|
| `novelReader.settings` | Тема, шрифт, розмір, ширина |
| `novelReader.progress` | Прогрес по кожній новелі |
| `novelReader.chapterStatuses` | Статуси розділів |
| `novelReader.lastNovel` | Остання відкрита новела |
| `novelReader.schemaVersion` | Версія схеми даних |
