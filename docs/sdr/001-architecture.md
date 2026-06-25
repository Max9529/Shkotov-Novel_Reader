# SDR 001 — Архітектура Novel Reader

## Статус

**Чернетка** | Дата: 2026-06-25

---

## 1. Контекст

Novel Reader — приватна статична читалка Markdown-новел, розгорнута на GitHub Pages. Без бекенду, без авторизації, без зовнішніх баз даних. Єдиний користувач — власник репозиторію.

---

## 2. Фактична структура репозиторію після підготовчого етапу

```
Shkotov-Novel_Reader/
├── ZFolder/                          # Папка всіх новел
│   ├── index.json                    # Індекс новел (список усіх тайтлів)
│   └── heavenly-demon-broadcast/     # Папка новели (slug без спецсимволів)
│       ├── cover.webp                # Обкладинка (перейменована з оригінального UUID-імені)
│       ├── title.json                # Конфігурація новели
│       ├── chapter1_translation.md
│       ├── chapter2_translation.md
│       ├── chapter3_translation.md
│       ├── chapter4_translation.md
│       ├── chapter5_translation.md
│       ├── chapter6_translation.md
│       ├── chapter7_translation.md
│       └── chapter8_translation.md
├── novel/                            # Стара папка (збережена, не видалена)
│   └── The Heavenly Demon's Broadcast From the Demon Realm/
│       └── ... (оригінальні файли)
├── src/
│   └── app.js                        # Стартовий шаблон JS
├── docs/
│   └── sdr/
│       └── 001-architecture.md       # Цей файл
├── requirements/
│   └── requirements.md
├── index.html                        # Точка входу застосунку
└── styles.css                        # Базові стилі
```

> **Примітка:** Папка `novel/` збережена без змін. Вона більше не є джерелом даних для застосунку. Після перевірки коректності роботи ZFolder її можна видалити.

---

## 3. Чому slug-папка замість оригінальної назви

Оригінальна назва `The Heavenly Demon's Broadcast From the Demon Realm` містить апостроф (`'`), що може спричиняти проблеми з URL-кодуванням на GitHub Pages, у PowerShell-скриптах і в `fetch()` запитах JavaScript.

Slug `heavenly-demon-broadcast` є безпечним для всіх середовищ.

---

## 4. Формат ZFolder/index.json

Файл `ZFolder/index.json` — точка входу застосунку. Застосунок читає його першим і дізнається, які новели існують.

```json
{
  "novels": [
    {
      "id": "heavenly-demon-broadcast",
      "folder": "heavenly-demon-broadcast",
      "config": "heavenly-demon-broadcast/title.json"
    }
  ]
}
```

| Поле     | Опис |
|----------|------|
| `id`     | Стабільний ідентифікатор новели. Використовується як ключ у localStorage. |
| `folder` | Назва папки всередині `ZFolder/`. |
| `config` | Відносний шлях до `title.json` від кореня `ZFolder/`. |

---

## 5. Формат title.json

Файл `title.json` — конфігурація конкретної новели.

```json
{
  "id": "heavenly-demon-broadcast",
  "title": "The Heavenly Demon's Broadcast From the Demon Realm",
  "titleUk": "Трансляція Небесного Демона з Демонічного Царства",
  "author": "",
  "translator": "Claude",
  "cover": "cover.webp",
  "description": "",
  "language": "uk",
  "chapters": [
    {
      "id": "chapter-1",
      "number": 1,
      "title": "Небесний Демон Чі Юлан",
      "file": "chapter1_translation.md"
    }
  ]
}
```

| Поле        | Обов'язкове | Опис |
|-------------|-------------|------|
| `id`        | так         | Унікальний slug новели. Збігається з id у `index.json`. |
| `title`     | так         | Оригінальна назва. |
| `titleUk`   | ні          | Українська назва, якщо відрізняється. |
| `author`    | ні          | Автор твору. |
| `translator`| ні          | Перекладач або інструмент перекладу. |
| `cover`     | так         | Шлях до обкладинки відносно папки новели. |
| `description`| ні         | Короткий опис. |
| `language`  | так         | Мова контенту (`uk`, `en` тощо). |
| `chapters`  | так         | Масив об'єктів розділів. |

### Поля розділу

| Поле     | Опис |
|----------|------|
| `id`     | Стабільний ідентифікатор розділу (напр. `chapter-1`). |
| `number` | Порядковий номер розділу. |
| `title`  | Назва розділу (з першого H1 Markdown-файлу). |
| `file`   | Назва Markdown-файлу відносно папки новели. |

---

## 6. Як завантажуються Markdown-розділи

На GitHub Pages немає серверного API для отримання списку файлів. Тому застосунок використовує явний конфіг `title.json`.

### Послідовність завантаження:

```
1. GET ZFolder/index.json
      ↓
2. GET ZFolder/{folder}/title.json
      ↓
3. При відкритті розділу:
   GET ZFolder/{folder}/{chapter.file}
```

Усі шляхи відносні до кореня репозиторію (або `baseURL` для GitHub Pages).

### Приклад fetch() у JS:

```javascript
// Базовий URL для GitHub Pages:
// https://username.github.io/Shkotov-Novel_Reader/

const BASE = import.meta.env?.BASE_URL ?? './';

async function loadIndex() {
  const res = await fetch(`${BASE}ZFolder/index.json`);
  return res.json();
}

async function loadTitle(folder) {
  const res = await fetch(`${BASE}ZFolder/${folder}/title.json`);
  return res.json();
}

async function loadChapter(folder, file) {
  const res = await fetch(`${BASE}ZFolder/${folder}/${file}`);
  return res.text(); // сирий Markdown
}
```

### Шляхи до обкладинки:

```javascript
// У HTML img:
`${BASE}ZFolder/${novel.folder}/${title.cover}`
// Наприклад: ./ZFolder/heavenly-demon-broadcast/cover.webp
```

---

## 7. Як застосунок працює на GitHub Pages

GitHub Pages роздає статичні файли з репозиторію. Застосунок є Single-Page Application (SPA) або Multi-Page Application з навігацією через `hash` (`#`).

### Рекомендований підхід: Hash-навігація

```
index.html#/                        → головний екран
index.html#/novel/heavenly-demon-broadcast    → сторінка тайтлу
index.html#/novel/heavenly-demon-broadcast/chapter-3  → читання розділу
```

**Причина**: GitHub Pages не підтримує server-side routing. При прямому переході на `/novel/...` сервер поверне 404. Hash-навігація вирішує це без `404.html` трюків.

### Базовий URL

Якщо репозиторій розгорнутий як `https://username.github.io/Shkotov-Novel_Reader/`, усі fetch-запити мають починатися з `/Shkotov-Novel_Reader/ZFolder/...`.

Це вирішується через `<base href="/Shkotov-Novel_Reader/">` у `<head>` або через змінну `BASE_URL`.

---

## 8. Де зберігатимуться локальні дані (майбутні етапи)

| Тип даних              | Сховище        | Ключ / Store |
|------------------------|---------------|--------------|
| Налаштування читача    | `localStorage` | `novelReader.settings` |
| Прогрес читання        | `localStorage` | `novelReader.progress` |
| Статуси розділів       | `localStorage` | `novelReader.chapterStatuses` |
| Закладки               | `localStorage` | `novelReader.bookmarks` |
| Коментарі              | `localStorage` | `novelReader.comments` |
| Версія схеми даних     | `localStorage` | `novelReader.schemaVersion` |
| Офлайн-копії розділів  | `IndexedDB` або `Cache API` | `novelReader-offline` |

### Поточна версія схеми

```javascript
const SCHEMA_VERSION = 1;
```

При зміні структури даних у майбутніх версіях потрібно виконувати міграцію зі старих ключів.

---

## 9. Обмеження через відсутність бекенду

| Обмеження | Наслідок |
|-----------|----------|
| Немає серверного API | Неможливо отримати список файлів у папці без `index.json`. |
| Прогрес тільки у браузері | Дані не синхронізуються між пристроями автоматично. |
| Офлайн тільки з Cache API / IndexedDB | Потрібне попереднє збереження, автоматичного кешу немає. |
| Немає бази даних | Закладки та коментарі зберігаються тільки на поточному пристрої. |
| GitHub Pages підтримує тільки GET | Неможливо зберігати дані на сервер. |
| Очищення браузера | Видаляє весь прогрес, закладки і коментарі. |

---

## 10. Наступні кроки після цього підготовчого етапу

### Етап 2 — Базова читалка (мінімально прийнятний продукт)

- [ ] Реалізувати `index.html` як SPA з hash-навігацією.
- [ ] Підключити Markdown-парсер (marked.js або markdown-it через CDN або локально).
- [ ] Реалізувати `loadIndex()` і `loadTitle()`.
- [ ] Реалізувати головний екран: список новел із карткою.
- [ ] Реалізувати сторінку тайтлу: обкладинка, назва, список розділів.
- [ ] Реалізувати екран читання: fetch розділу, рендеринг Markdown.
- [ ] Реалізувати навігацію між розділами.
- [ ] Зберігати останній відкритий розділ у `localStorage`.

### Етап 3 — Прогрес читання

- [ ] Присвоювати параграфам стабільні ідентифікатори (напр. `chapter-3-p-42`).
- [ ] Зберігати `scrollPercent` і `paragraphId` у `localStorage`.
- [ ] Автопрокрутка до останньої позиції при відкритті розділу.
- [ ] Статуси розділів: `not-started`, `reading`, `finished`, `favorite`.

### Етап 4 — Закладки та коментарі

- [ ] Взаємодія з абзацом (tap на телефоні / hover на ПК).
- [ ] Створення та видалення закладок.
- [ ] Створення, редагування та видалення коментарів.
- [ ] Список закладок і коментарів на сторінці тайтлу.
- [ ] Перехід до абзацу з підсвіткою.

### Етап 5 — Налаштування та теми

- [ ] Теми: світла, темна, сепія, темна фіолетова.
- [ ] Параметри читання: шрифт, розмір, відступи, ширина колонки.
- [ ] Збереження налаштувань у `localStorage`.

### Етап 6 — Офлайн і JSON-перенесення

- [ ] Cache API або IndexedDB для офлайн-копій розділів.
- [ ] Кнопка `Зберегти для офлайн` на сторінці тайтлу.
- [ ] Експорт / імпорт JSON з усіма локальними даними.
- [ ] Скидання даних із потрійним підтвердженням і обов'язковим експортом.

### Етап 7 — Деплой

- [ ] Налаштувати GitHub Actions workflow для GitHub Pages.
- [ ] Перевірити `base href` або `BASE_URL` для коректних шляхів.
- [ ] Перевірити, що всі fetch-запити до `ZFolder/` працюють через HTTPS.

---

## 11. Нотатка щодо папки `novel/`

Стара папка `novel/The Heavenly Demon's Broadcast From the Demon Realm/` збережена без змін. Вона не використовується застосунком. Її можна видалити після того, як буде перевірено коректну роботу нової структури `ZFolder/`.
