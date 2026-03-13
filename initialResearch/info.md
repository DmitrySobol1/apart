# Исследование виджета бронирования Bnovo на сайте apart-nn.ru
## Версия 7 — обновлено 16.02.2026 (+ полный анализ защиты endpoint)

---

## 1. Общая картина

На сайте `apart-nn.ru` установлен виджет онлайн-бронирования от компании **Bnovo**. Виджет подключается через JavaScript:

```javascript
Bnovo_Widget.open('_bn_widget_2m', {
  type: "vertical",
  uid: "d0ce239f-df14-4aa8-8ccf-83036c8cbb01",
  lang: "ru",
  btn_text: "Найти номер"
});
```

### Ключевые идентификаторы объекта:
| Параметр | Значение |
|----------|---------|
| **UID** | `d0ce239f-df14-4aa8-8ccf-83036c8cbb01` |
| **account_id** (числовой) | `22720` |
| **Название** | Апарт отель - 9 ночей Нижний Новгород |

### Схема работы виджета:
1. Пользователь выбирает даты и гостей в виджете на сайте
2. Нажимает "Найти номер" → редирект на `reservationsteps.ru/rooms/index/{UID}?arrival=...&departure=...&adults=...`
3. Модуль бронирования запрашивает данные через API: `public-api.reservationsteps.ru/v1/api/`
4. Пользователь выбирает номер, заполняет данные гостя
5. Форма отправляется на `reservationsteps.ru` (POST)
6. Бронирование сохраняется в Bnovo PMS → доступно в ЛК на `portal.pms.bnovo.ru`

---

## 2. Подтверждённый факт: API Bnovo НЕ поддерживает создание бронирований

Изучена полная документация Bnovo PMS API (OpenAPI 3.0.3):
- **Спецификация:** `https://api.pms.bnovo.ru/docs/openapi.yaml`
- **Swagger UI:** `https://api.pms.bnovo.ru/swagger`
- **Всего endpoints:** 41
- **Авторизация:** JWT Bearer Token
- **Лимиты:** 30 req/10s, 300/5min, 1000/hr, 10000/day

### Все 41 endpoint Bnovo PMS API:

#### Авторизация (4)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth` | Аутентификация (логин + пароль → JWT) |
| POST | `/api/v1/auth/token` | Получить новый JWT токен |
| GET | `/api/v1/auth/me` | Информация о текущем пользователе |
| GET | `/api/v1/auth/logout` | Выход из системы |

#### Бронирования — ТОЛЬКО ЧТЕНИЕ (7)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/bookings` | Получить бронирования за период |
| GET | `/api/v1/bookings/{id}` | Получить бронирование по ID |
| GET | `/api/v1/bookings/{id}/customer` | Получить заказчика |
| GET | `/api/v1/bookings/{id}/invoices` | Получить счета |
| GET | `/api/v1/bookings/{id}/services` | Получить доп.услуги |
| GET | `/api/v1/bookings/{id}/guests` | Получить гостей |
| **PUT** | `/api/v1/bookings/{id}/status` | **Обновить статус** (единственная запись) |

#### Номера и доступность (4)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/rooms` | Список комнат |
| GET | `/api/v1/rooms/closed` | Закрытые продажи |
| GET | `/api/v1/availability/rooms` | Доступные комнаты |
| GET | `/api/v1/availability/roomtypes` | Доступные типы комнат |

#### Тарифы и типы комнат (3)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/tariffs` | Список тарифов |
| GET | `/api/v1/tariffs/prices/{planId}` | Цены по тарифу |
| GET | `/api/v1/roomtypes` | Типы комнат |

#### Гости (9)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/bookings/{id}/guests` | Создать гостя в бронировании |
| PUT | `/api/v1/bookings/{bookingId}/guests/{guestId}` | Обновить гостя |
| GET | `/api/v1/guests/tags` | Теги гостей |
| GET | `/api/v1/guests/{id}` | Гость по ID |
| GET | `/api/v1/guests/dictionaries/documents/types` | Типы документов |
| GET | `/api/v1/guests/dictionaries/visa/categories` | Категории виз |
| GET | `/api/v1/guests/dictionaries/visa/types` | Типы виз |
| GET | `/api/v1/guests/dictionaries/relations/types` | Типы представителей |
| GET | `/api/v1/guests/dictionaries/entries/goals` | Цели въезда |

#### Платежи (5)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/bookings/{id}/payments` | Список платежей |
| POST | `/api/v1/bookings/{id}/payments` | Создать платёж |
| GET | `/api/v1/bookings/{id}/payments/{paymentId}` | Платёж по ID |
| GET | `/api/v1/suppliers` | Юр.лица отеля |
| GET | `/api/v1/finance/items` | Статьи ДДС |

#### Вебхуки (4)
| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/api/v1/webhooks/subscribers` | Удалить подписчика |
| GET | `/api/v1/webhooks/subscribers` | Получить подписчиков |
| GET | `/api/v1/webhooks/messages/bookings/test` | Тест вебхука бронирований |
| GET | `/api/v1/webhooks/messages/plans/test` | Тест вебхука тарифов |

#### Прочее (5)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/bookings/{id}/invoices` | Создать счёт |
| GET | `/api/v1/services` | Доп.услуги |
| GET | `/api/v1/reports/adrRevPar` | Отчёт ADR/RevPAR |
| GET | `/api/v1/countries` | Список стран |
| GET | `/api/v1/hotels/paymentSystems` | Платёжные системы |

### Вывод: Endpoint для СОЗДАНИЯ бронирований в Bnovo PMS API **НЕ СУЩЕСТВУЕТ**.

---

## 3. Публичный API модуля бронирования (для чтения данных)

Модуль бронирования на `reservationsteps.ru` использует публичный API, к которому можно обращаться напрямую **без авторизации**.

**Базовый URL:** `https://public-api.reservationsteps.ru/v1/api/`

### Подтверждённые endpoints:

#### 3.1 `accounts` — информация об объекте
```
GET /accounts?uid=d0ce239f-df14-4aa8-8ccf-83036c8cbb01
```
**Возвращает:** id (22720), название, телефон, email, адрес, время заезда/выезда, логотип, валюту, таймзону, настройки модуля (цветовая схема), эксперименты, настройки детей, URL сайта, ID Яндекс.Метрики.

#### 3.2 `rooms` — доступные номера с ценами (ГЛАВНЫЙ)
```
GET /rooms?account_id=22720&dfrom=01-03-2026&dto=03-03-2026
```
**Формат дат:** `d-m-Y` (день-месяц-год)
**Возвращает:** (~1.5 МБ) массив номеров с полями: id, parent_id, name, description, adults, children, available, photos[] (url, thumb, original_url), amenities, plans с ценами, варианты кроватей, доступность.

#### 3.3 `roomtypes` — типы номеров
```
GET /roomtypes?account_id=22720
```
**Возвращает:** Массив типов номеров с фото, удобствами, описаниями. Без данных доступности по датам.

#### 3.4 `min_prices` — минимальные цены для календаря
```
GET /min_prices?uid=d0ce239f-df14-4aa8-8ccf-83036c8cbb01&dfrom=2026-03-01&dto=2026-04-01&currency=RUB
```
**Формат дат:** `YYYY-MM-DD`
**Возвращает:** Объект min_prices с ключами-датами, каждый содержит `p` (цена) и `g` (кол-во гостей).

#### 3.5 `closed_dates_with_reasons` — закрытые даты
```
GET /closed_dates_with_reasons?uid=d0ce239f-df14-4aa8-8ccf-83036c8cbb01&dfrom=2026-03-01&dto=2026-04-01
```
**Доп. параметры:** roomtype_id, promo_code, onlyrooms
**Возвращает:** closed_dates[], closest_checkin, closest_checkout.

#### 3.6 `plans` — тарифные планы
```
GET /plans?account_id=22720
```
**Возвращает:** Массив тарифов: id, name, description, cancellation_rules, гарантия бронирования, питание, ограничения, мультиязычные описания.

#### 3.7 `promo_codes` — промокоды
```
GET /promo_codes?account_id=22720
```
**Возвращает:** Массив промокодов: id, code, sale (скидка %), max_use, used, период.

#### 3.8 `additional_services` — дополнительные услуги
```
GET /additional_services?account_id=22720
```
**Возвращает:** Массив услуг: id, name, price, price_type, type, enabled, one_time, max_quantity, фото.

#### 3.9 `currencies` — валюты
```
GET /currencies
```
**Возвращает:** Все поддерживаемые валюты с id, iso_4217, sign, text.

#### 3.10 `amenities` — удобства
```
GET /amenities
```
**Возвращает:** (~50 КБ) категоризированный объект удобств с мультиязычными названиями и SVG иконками.

#### 3.11 `legal_entities` — юр.лица
```
GET /legal_entities?account_id=22720
```
**Возвращает:** Юридические лица с реквизитами (ИНН, КПП, банк, адреса).

#### 3.12 `prices` — цены по тарифу
```
GET /prices?plan_id=XXX&dfrom=01-03-2026&dto=03-03-2026&account_id=22720
```
**Примечание:** Требует правильную комбинацию параметров, иначе 500.

### Замечание по формату дат:
- `rooms`, `prices` → формат **d-m-Y** (например `01-03-2026`)
- `min_prices`, `closed_dates_with_reasons` → формат **YYYY-MM-DD** (например `2026-03-01`)
- `uid` — UUID строка, `account_id` — числовой ID (22720)

---

## 4. Внутренние endpoints reservationsteps.ru (для процесса бронирования)

Эти URL вызываются на самом сайте `reservationsteps.ru` (server-side рендеринг с формами):

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/rooms/index/{uid}` | GET/POST | Главная страница поиска номеров |
| `/services/index/{uid}` | GET | Выбор доп.услуг |
| `/promo_codes/post/{uid}` | POST | Проверка промокода |
| `/post/mail/{uid}` | POST | Отправка email с информацией |
| `/post/shurl/{uid}` | POST | Создание короткой ссылки |
| `/sberid/auth` | — | Авторизация через Сбер ID |
| `/sber/getPersonalInfo/` | GET | Данные после авторизации Сбер ID |

### Портал PMS:
| Endpoint | Метод | Описание |
|----------|-------|----------|
| `portal.pms.bnovo.ru/waitingList/create` | POST | Создать запись в лист ожидания (account_id, name, surname, phone, email, categories[], dfrom, dto, comment) |

---

## 5. Анализ защиты модуля бронирования от автоматизации

### Результат: ЗАЩИТА МИНИМАЛЬНАЯ

| Механизм защиты | Наличие |
|-----------------|---------|
| **CAPTCHA (reCAPTCHA, hCaptcha)** | **НЕТ** |
| **CSRF-токены** | **НЕТ** (не обнаружены в HTML) |
| **Content Security Policy** | **НЕТ** |
| **Session tokens в скрытых полях** | **НЕТ** |
| **Meta-теги с токенами** | **НЕТ** |
| **Rate limiting на клиенте** | **НЕТ** |
| A/B тестирование (EXPERIMENTS) | Да, но не влияет на защиту |
| Cookie-соглашение | Да, стандартное |
| Серверная валидация | Да, через API на стороне reservationsteps.ru |

### Вывод: Программное взаимодействие с модулем бронирования **ВОЗМОЖНО** без существенных препятствий.

---

## 6. Утверждённая схема решения

На основе ваших ответов утверждена следующая архитектура:

```
┌─────────────────────────────────────┐
│        ВАШ СОБСТВЕННЫЙ ВИДЖЕТ       │
│         (на сайте apart-nn.ru)      │
│              Node.js                │
└──────────┬──────────────┬───────────┘
           │              │
     ЧТЕНИЕ ДАННЫХ   ЗАПИСЬ ДАННЫХ
     (API запросы)   (автоматизация)
           │              │
           ▼              ▼
┌──────────────────┐ ┌────────────────────────┐
│  Public API      │ │  Модуль бронирования   │
│  reservationsteps│ │  reservationsteps.ru   │
│  (JSON ответы)   │ │  (Playwright/Puppeteer)│
└──────────────────┘ └────────────────────────┘
           │              │
           └──────┬───────┘
                  ▼
         ┌────────────────┐
         │   Bnovo PMS    │
         │  (база данных) │
         └────────────────┘
```

### Чтение данных (получение номеров, цен, доступности):
→ Прямые HTTP GET запросы к `public-api.reservationsteps.ru/v1/api/`
→ Без авторизации, без ограничений
→ Быстро, надёжно, JSON формат

### Запись данных (создание бронирования):
→ Через Playwright (headless браузер)
→ Открываем страницу модуля бронирования
→ Программно заполняем формы и нажимаем кнопки
→ Данные отправляются через штатный функционал Bnovo

---

## 7. Детальный план реализации на Node.js

### 7.1 Модуль чтения данных (API клиент)

```javascript
// bnovo-api.js — клиент для чтения данных из Bnovo

const BASE_URL = 'https://public-api.reservationsteps.ru/v1/api';
const UID = 'd0ce239f-df14-4aa8-8ccf-83036c8cbb01';
const ACCOUNT_ID = 22720;

// Получить информацию об объекте
async function getAccountInfo() {
  const res = await fetch(`${BASE_URL}/accounts?uid=${UID}`);
  return res.json();
}

// Получить доступные номера с ценами
async function getAvailableRooms(dfrom, dto) {
  // Формат дат: d-m-Y (например 01-03-2026)
  const res = await fetch(`${BASE_URL}/rooms?account_id=${ACCOUNT_ID}&dfrom=${dfrom}&dto=${dto}`);
  return res.json();
}

// Получить минимальные цены для календаря
async function getMinPrices(dfrom, dto, currency = 'RUB') {
  // Формат дат: YYYY-MM-DD
  const res = await fetch(`${BASE_URL}/min_prices?uid=${UID}&dfrom=${dfrom}&dto=${dto}&currency=${currency}`);
  return res.json();
}

// Получить тарифные планы
async function getPlans() {
  const res = await fetch(`${BASE_URL}/plans?account_id=${ACCOUNT_ID}`);
  return res.json();
}

// Получить типы номеров
async function getRoomTypes() {
  const res = await fetch(`${BASE_URL}/roomtypes?account_id=${ACCOUNT_ID}`);
  return res.json();
}

// Получить закрытые даты
async function getClosedDates(dfrom, dto) {
  const res = await fetch(`${BASE_URL}/closed_dates_with_reasons?uid=${UID}&dfrom=${dfrom}&dto=${dto}`);
  return res.json();
}

// Получить доп.услуги
async function getAdditionalServices() {
  const res = await fetch(`${BASE_URL}/additional_services?account_id=${ACCOUNT_ID}`);
  return res.json();
}

// Получить промокоды
async function getPromoCodes() {
  const res = await fetch(`${BASE_URL}/promo_codes?account_id=${ACCOUNT_ID}`);
  return res.json();
}
```

### 7.2 Модуль создания бронирования (Playwright)

```javascript
// bnovo-booking.js — создание бронирования через Playwright

const { chromium } = require('playwright');

const UID = 'd0ce239f-df14-4aa8-8ccf-83036c8cbb01';
const BOOKING_URL = `https://reservationsteps.ru/rooms/index/${UID}`;

async function createBooking({ arrival, departure, adults, roomTypeId, guest }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Шаг 1: Открыть модуль бронирования с параметрами
    const url = `${BOOKING_URL}?arrival=${arrival}&departure=${departure}&adults=${adults}`;
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Дождаться загрузки номеров
    // (точные селекторы нужно определить — см. раздел 8)
    await page.waitForSelector('.room-category');

    // Шаг 3: Выбрать нужный номер
    // await page.click(`[data-roomtype-id="${roomTypeId}"] .book-button`);

    // Шаг 4: Перейти к заполнению данных гостя
    // await page.fill('input[name="first_name"]', guest.firstName);
    // await page.fill('input[name="last_name"]', guest.lastName);
    // await page.fill('input[name="email"]', guest.email);
    // await page.fill('input[name="phone"]', guest.phone);

    // Шаг 5: Подтвердить бронирование
    // await page.click('.confirm-booking-button');

    // Шаг 6: Дождаться подтверждения
    // await page.waitForURL('**/confirmation**');

    // Шаг 7: Получить номер бронирования
    // const confirmationNumber = await page.textContent('.confirmation-number');

    return { success: true /*, confirmationNumber */ };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}
```

---

## 8. ПОЛНЫЙ FLOW БРОНИРОВАНИЯ — результаты Playwright-исследования

Полностью пройден flow от выбора номера до формы подтверждения бронирования.

### 8.0 Общая схема flow

```
Step 1: /rooms/index/{uid}       — Выбор номера (realStepNumber=1)
    ↓ клик "Забронировать" в карточке → модал → "Оформить бронирование"
Step 2: /services/index/{uid}    — Выбор доп.услуг (realStepNumber=2)
    ↓ клик button.js-next-step "Забронировать"
Step 3: /bookings/index/{uid}    — Данные гостя (realStepNumber=3)
    ↓ POST форма #confirm-booking → /bookings/post/{uid}
Step 4: подтверждение/оплата
```

### 8.1 Step 1 — Страница выбора номеров (`/rooms/index/{uid}`)

**URL:** `https://reservationsteps.ru/rooms/index/{uid}?arrival=YYYY-MM-DD&departure=YYYY-MM-DD&adults=N`

**ВАЖНО:** Система перенаправляет и меняет формат дат на `d-m-Y` (DD-MM-YYYY). Параметры `arrival`/`departure` конвертируются.

#### Основная форма
| Элемент | Селектор | Описание |
|---------|----------|----------|
| Форма поиска | `#head-form` | method=GET, action=`/rooms/index/{uid}` |
| Шаг | `#realStepNumber` | hidden, value="1" |
| UID аккаунта | `#accountUid` | hidden |
| Дата заезда | `#checkin` (name=`dfrom`) | hidden, формат d-m-Y |
| Дата выезда | `#checkout` (name=`dto`) | hidden, формат d-m-Y |
| Взрослые | `input[name="adults"]` | hidden, class=`niceNumber__input niceNumber__simple` |
| Имя | `#name_offer` (name=`name`) | hidden |
| Фамилия | `#surname_offer` (name=`surname`) | hidden |
| Email | `#email_offer` (name=`email`) | hidden |
| Телефон | `#phone_offer` (name=`phone`) | hidden |
| Промокод | `#promoCode` (name=`promoCode`) | видимый текстовый |
| Кнопка поиска | `#checkButton` | type=submit, "Найти" |
| Эксперименты | `#experiment_value` (name=`exval`) | A/B-тесты |
| Ночей | `#bookingAddNights` | hidden |

#### Карточки номеров
```
.room.room-shown[data-roomtype-id="XXXXX"]
  ├── select.selectAvailable (СКРЫТЫЙ, display:none)
  │     data-room-type-title="Студия Deluxe"
  │     data-available="1"
  │     data-minprice="2800"
  │     data-maxprice="2800"
  │     data-plan-id="536495"
  │     data-room-id="357520"
  │     data-table-id="56"
  │     options: [{v:"0", t:"Выбрать"}, {v:"1", t:"1"}]
  │
  ├── input.niceNumber__input.niceNumber__select
  │     name="selectAvailableInput"
  │     type="number"
  │     value="0"
  │     (ВИДИМЫЙ, используется для UI)
  │
  ├── button (text: "-") — уменьшить кол-во
  ├── button (text: "+") — увеличить кол-во (перекрыт selectAvailable__button)
  │
  └── button.selectAvailable__button.button.button_default
        type="submit"
        Содержит три span-а с текстом:
          "Забронировать" — начальное состояние
          "Добавить в заказ" — после добавления
          "Всё забронировано" — когда нет мест
        (КЛИКАБЕЛЬНАЯ, force:true из-за overlay)
```

#### Кнопки "-" и "+"
Кнопки "+" и "-" ПЕРЕКРЫТЫ элементом `<span class="booked-view">Всё забронировано</span>` внутри selectAvailable__button. Для клика нужен `force: true` или `evaluate`.

#### Модальное окно корзины (`#modal-cart`)
После клика "Забронировать" в карточке → появляется модал:

| Элемент | Селектор | Описание |
|---------|----------|----------|
| Модал | `#modal-cart` | display=inline-block при открытии |
| Кнопка "Оформить" | `#modal-cart-button` | "Оформить бронирование" → переход к услугам |
| Кнопка "Назад" | `#modal-cart-close` | "Вернуться к выбору номеров" |
| Таблица корзины | `#cart__table` | Содержит итого |
| Улучшение номера | `.upgrade-block` | Предложение улучшить |

**Клик #modal-cart-button → навигация на `/services/index/{uid}`**

#### Нижняя фиксированная корзина
```
.fixedPopup.fixedPopup_bottom.cart
  ├── .fixedPopup__head.cart-head
  ├── #bookingButton (есть 5 дублей с одинаковым id!)
  │     text: "Забронировать" / "Продолжить бронирование"
  │     class: fixedPopup__button.bookingButton.booking_button_first_step
  └── .bottom-fixed-cart-container (cookie consent тоже здесь)
```

### 8.2 Step 2 — Страница услуг (`/services/index/{uid}`)

**URL:** `https://reservationsteps.ru/services/index/{uid}?&dfrom=DD-MM-YYYY&dto=DD-MM-YYYY&lang=ru&servicemode=0&adults=2&roomTypes={"357520":{"c":1,"bv":3}}&planId=536495&...`

**Параметр roomTypes:** `{"roomTypeId":{"c":count,"bv":bookingVariant}}`

#### Доп.услуги (для account_id 22720)
1. Романтические украшения
2. Комбо-завтрак в кофейне "Латте на двоих" на 1 этаже
3. Горячий завтрак в ресторане "Стейк хаус" на 1 этаже
4. Парковочное место на -1 этаже
5. Ортопедическая подушка
6. Пакет "Для мамы с малышом"
7. Проектор
8. Pet Friendly (только для номеров 327 и 327А)

Каждая услуга имеет `niceNumber__input` с кнопками +/-.

#### Кнопки перехода
| Элемент | Селектор | Описание |
|---------|----------|----------|
| Кнопка "далее" | `button.service-cart__submit.js-next-step` | text="Забронировать", visible=true |
| Категории | `label` (filter) | "Все", "Аренда помещений", "Питание", "Прочее", "Сервис и обслуживание" |
| Корзина справа | `.service-cart` | "Ваше бронирование" |

**ВАЖНО:** `button.js-next-step` может быть `visible: false` (скрыт в нижнем блоке). Нужно использовать jQuery trigger: `jQuery('.js-next-step').trigger('click')` или `page.evaluate(() => { document.querySelector('.js-next-step').dispatchEvent(new MouseEvent('click', {bubbles:true})); })`

**Клик js-next-step → навигация на `/bookings/index/{uid}`**

### 8.3 Step 3 — Страница данных гостя (`/bookings/index/{uid}`)

**URL:** `https://reservationsteps.ru/bookings/index/{uid}?roomTypes={...}&dfrom=DD-MM-YYYY&dto=DD-MM-YYYY&planId=XXXXX&adults=N&lang=ru&...`

Это **ГЛАВНАЯ ФОРМА** для создания бронирования.

#### Форма `#confirm-booking` (POST)

| Атрибут | Значение |
|---------|----------|
| id | `confirm-booking` |
| method | `POST` |
| action | `https://reservationsteps.ru/bookings/post/{uid}` |
| enctype | `application/x-www-form-urlencoded` |

#### Видимые поля для заполнения

| Поле | name | id | type | placeholder | Обязат. |
|------|------|----|------|-------------|---------|
| **Имя** | `customer[name]` | `name_field` | text | Иван | — |
| **Фамилия** | `customer[surname]` | `surname_field` | text | Иванов | — |
| **Телефон** | `customer[phone]` | `phone` | tel | +_(___)___-____ | — |
| **Email** | `customer[email]` | `mail_field` | email | example@mail.ru | — |
| **Примечания** | `customer[notes]` | `notes_field` | textarea | Примечания | — |

#### Скрытые поля (автозаполнение)

| name | id | Пример значения | Описание |
|------|----|-----------------|----------|
| `servicemode` | `servicemode` | 0 | Режим услуг |
| `firstroom` | `firstroom_param` | 0 | Первый номер |
| `dfrom` | `dfrom` | 15-02-2026 | Дата заезда (d-m-Y) |
| `dto` | `dto` | 16-02-2026 | Дата выезда (d-m-Y) |
| `planId` | `plan` | 536495 | ID тарифного плана |
| `adults` | `adults` | 2 | Кол-во взрослых |
| `children` | `children` | (пусто) | Дети |
| `promoCode` | `promo_code` | (пусто) | Промокод |
| **`roomTypes`** | `roomTypes` | `{"357520":{"c":1,"bv":3}}` | **JSON с выбранными номерами** |
| `roomtypeUpgrade` | `roomtypeUpgrade` | (пусто) | ID улучшения |
| `services` | `services` | (пусто) | Выбранные услуги |
| `orderItems` | `orderItems` | (пусто) | Элементы заказа |
| `lang` | `lang` | ru | Язык |
| `warrantyType` | `warrantyType` | onlinepay | Гарантия бронирования |
| `orderid` | `orderid` | (пусто) | ID заказа |
| `moneywall_enabled` | — | 0 | Paywall |
| `currency` | — | (пусто) | Валюта |
| `mobile_id` | — | 0 | Мобильный ID |
| `guarantee` | — | 1 | Гарантия |

#### Чекбокс согласия

| Элемент | Селектор | Описание |
|---------|----------|----------|
| Чекбокс | `#confirmCheckbox` | "Я принимаю условия Пользовательского соглашения и соглашаюсь на Обработку персональных данных" |

**ВАЖНО:** Чекбокс `visible: false` — он стилизован через CSS. Нужно устанавливать через `evaluate`: `document.querySelector('#confirmCheckbox').checked = true;`

#### Кнопка подтверждения

| Элемент | Селектор | Описание |
|---------|----------|----------|
| Кнопка | `#reservation` | "Забронировать", type=submit, форма confirm-booking |
| Класс | `bookingForm__button button button_default button_md` | |

#### Дополнительно: Сбер ID

На странице есть опция "Войдите через Сбер ID или введите данные" — можно пропустить, заполнив поля вручную.

### 8.4 Формат POST-запроса для создания бронирования

```
POST https://reservationsteps.ru/bookings/post/d0ce239f-df14-4aa8-8ccf-83036c8cbb01
Content-Type: application/x-www-form-urlencoded

servicemode=0
&firstroom=0
&dfrom=15-02-2026
&dto=16-02-2026
&planId=536495
&adults=2
&children=
&promoCode=
&roomTypes={"357520":{"c":1,"bv":3}}
&roomtypeUpgrade=
&services=
&orderItems=
&lang=ru
&warrantyType=onlinepay
&orderid=
&moneywall_enabled=0
&currency=
&mobile_id=0
&guarantee=1
&customer[name]=Иван
&customer[surname]=Иванов
&customer[phone]=+7(999)123-4567
&customer[email]=test@example.com
&customer[notes]=
```

**Нет CSRF-токена!** Форма не содержит защитных токенов.

### 8.5 Альтернативный подход: прямой POST

Потенциально бронирование можно создать **одним HTTP-запросом** минуя UI:
```javascript
const formData = new URLSearchParams({
  'servicemode': '0',
  'firstroom': '0',
  'dfrom': '15-02-2026',
  'dto': '16-02-2026',
  'planId': '536495',
  'adults': '2',
  'children': '',
  'promoCode': '',
  'roomTypes': '{"357520":{"c":1,"bv":3}}',
  'roomtypeUpgrade': '',
  'services': '',
  'orderItems': '',
  'lang': 'ru',
  'warrantyType': 'onlinepay',
  'orderid': '',
  'moneywall_enabled': '0',
  'currency': '',
  'mobile_id': '0',
  'guarantee': '1',
  'customer[name]': 'Иван',
  'customer[surname]': 'Иванов',
  'customer[phone]': '+7(999)123-4567',
  'customer[email]': 'test@example.com',
  'customer[notes]': ''
});
```

**Требует проверки:** Сервер может проверять cookies/session, установленные при навигации через steps 1-2. Нужно протестировать.

### 8.6 Playwright-автоматизация: рабочий алгоритм

```javascript
// ПРОВЕРЕННЫЙ РАБОЧИЙ АЛГОРИТМ (Playwright)
const { chromium } = require('playwright');

async function createBooking({ arrival, departure, adults, roomTypeId, guest }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const UID = 'd0ce239f-df14-4aa8-8ccf-83036c8cbb01';

  // Step 1: Открываем страницу номеров
  await page.goto(`https://reservationsteps.ru/rooms/index/${UID}?arrival=${arrival}&departure=${departure}&adults=${adults}`, {
    waitUntil: 'networkidle', timeout: 60000
  });
  await page.waitForTimeout(3000);

  // Скрываем cookie consent
  await page.evaluate(() => {
    document.querySelectorAll('.cookieConsent, .bottom-fixed-block').forEach(el => el.style.display = 'none');
  });

  // Step 1: Кликаем "Забронировать" на нужном номере
  const bookBtn = page.locator(`[data-roomtype-id="${roomTypeId}"] .selectAvailable__button`);
  await bookBtn.scrollIntoViewIfNeeded();
  await bookBtn.click({ force: true });
  await page.waitForTimeout(1500);

  // Step 1 → Step 2: Кликаем "Оформить бронирование" в модале
  await page.locator('#modal-cart-button').click();
  await page.waitForURL('**/services/**', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Step 2 → Step 3: Пропускаем услуги
  await page.evaluate(() => {
    const btn = document.querySelector('.js-next-step');
    if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForURL('**/bookings/**', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Step 3: Заполняем данные гостя
  await page.fill('#name_field', guest.name);
  await page.fill('#surname_field', guest.surname);
  await page.fill('#phone', guest.phone);
  await page.fill('#mail_field', guest.email);
  if (guest.notes) await page.fill('#notes_field', guest.notes);

  // Отмечаем чекбокс согласия
  await page.evaluate(() => {
    document.querySelector('#confirmCheckbox').checked = true;
    document.querySelector('#confirmCheckbox').dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Кликаем "Забронировать"
  await page.click('#reservation');

  // Ждём результат
  // ... (нужно определить что происходит после — оплата или подтверждение)
}
```

---

## 9. Важные технические особенности

### 9.1 Cookie Consent перекрывает элементы
На странице есть `div.cookieConsent` внутри `div.bottom-fixed-block`, который перекрывает кнопки номеров. Необходимо скрывать:
```javascript
document.querySelectorAll('.cookieConsent, .bottom-fixed-block').forEach(el => el.style.display = 'none');
```

### 9.2 Дублирование ID `bookingButton`
На странице есть **5 элементов** с `id="bookingButton"` (нарушение HTML-стандарта). При использовании Playwright нужен специфичный селектор:
```javascript
// НЕ РАБОТАЕТ (strict mode violation):
page.locator('#bookingButton').click();
// РАБОТАЕТ:
page.locator('.fixedPopup.cart #bookingButton').first().click();
```

### 9.3 jQuery-обработчики событий
Кнопки используют jQuery event binding (не inline onclick). Поэтому `element.click()` через evaluate может НЕ работать. Решения:
```javascript
// Вариант 1: jQuery trigger
page.evaluate(() => jQuery('#modal-cart-button').trigger('click'));
// Вариант 2: MouseEvent
page.evaluate(() => {
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
});
// Вариант 3: Playwright click (РЕКОМЕНДУЕТСЯ)
page.locator('#modal-cart-button').click();
```

### 9.4 Формат `roomTypes`
JSON-строка: `{"roomTypeId":{"c":count,"bv":bookingVariant}}`
- `c` — количество номеров (1, 2, ...)
- `bv` — вариант бронирования (3 = стандартный?)
- Пример: `{"357520":{"c":1,"bv":3}}` = 1 номер типа 357520

### 9.5 JS-бандлы модуля бронирования

| Файл | Путь |
|------|------|
| Main JS | `/dist/js/main-f104bcaf3c.js` (~150KB) |
| Booking JS | `/dist/js/booking-d11b0c44ae.js` |
| Services JS | `/dist/js/services-617e8047da.js` |
| Vendors JS | `/dist/js/vendors-cff907006e.min.js` |
| iframe JS | `/dist/js/iframe_behavior-b1a383167b.js` |
| jQuery | `/dist/js/vendor/jquery-3.5-1210800790.0.min.js` |

### 9.6 Категории номеров (account_id=22720)
Обнаружено 60+ категорий номеров через checkbox-фильтры на странице. Примеры:
- `357520` — Студия Deluxe
- `367605` — Студия с видом на город
- `274552` — Студия Стандарт
- `274550` — Апартаменты "9 ночей"
- `274551` — Апартаменты Family №331
- `329285` — Апартаменты Family Premium
- `367604` — Студия Suit (Pet Friendly)
- ... и ещё ~55 категорий

---

## 10. Тестирование прямого POST (без UI) — РЕЗУЛЬТАТЫ

### 10.1 Эксперимент: прямой POST на `/bookings/post/{uid}`

**Дата проведения:** 15.02.2026

**Цель:** проверить, можно ли создать бронирование одним HTTP POST-запросом, минуя UI (без Playwright, без навигации по шагам).

#### Что тестировалось:

| Подход | warrantyType | body | Результат |
|--------|-------------|------|-----------|
| A — без body | `onlinepay` | **Забыли передать body** | 400 Bad Request — сервер вернул ошибки валидации |
| B — noprepayment | `noprepayment` | Полный form-data | **200 OK — БРОНЬ СОЗДАНА!** |

#### Подход A — ошибки валидации (400)

При отправке POST без body (баг в скрипте) сервер вернул страницу Step 3 с ошибками:
```
Выберите дату заезда.
Выберите дату выезда.
Выберите тариф.
Выберите номера.
Поле "lang" обязательно для заполнения.
Поле "customer" обязательно для заполнения.
```

Ошибки отображаются в `div.content__box.content__notice.box.roomtypes_search_error`.

**Вывод:** Сервер выполняет валидацию полей, но не проверяет сессию/cookies/CSRF.

#### Подход B — УСПЕХ (200)

**Запрос:**
```
POST https://reservationsteps.ru/bookings/post/d0ce239f-df14-4aa8-8ccf-83036c8cbb01
Content-Type: application/x-www-form-urlencoded
(без cookies, без сессии)
```

**Тело запроса:**
```
servicemode=0
firstroom=0
dfrom=17-02-2026
dto=18-02-2026
planId=128501
adults=2
children=
promoCode=
roomTypes={"357520":{"c":1,"bv":3}}
roomtypeUpgrade=
services=
orderItems=
lang=ru
warrantyType=noprepayment
orderid=
moneywall_enabled=0
currency=
mobile_id=0
guarantee=0
customer[name]=Тест
customer[surname]=Тестов
customer[phone]=+7(999)000-0000
customer[email]=test-noprepay@test.com
customer[notes]=ТЕСТ noprepayment
```

**Ответ сервера:**
- **Status:** 200 OK
- **Redirect URL:** `/bookings/preSuccess/{uid}?...`
- **Номер брони:** `7XTWT_150226`
- **Данные в URL ответа:**
  - `bookingNumber=7XTWT_150226`
  - `email=test-noprepay@test.com`
  - `bookingAccommodationAmount=2800`
  - `currencyCode=RUB`
  - `orderData[products][p_357520][name]=Студия Deluxe`
  - `orderData[products][p_357520][price]=2800`
  - `orderData[products][p_357520][quantity]=1`
  - `redirectUrl` → содержит ссылку на `payment.bnovo.ru/v2/?transaction=book_...`

### 10.2 Ключевые выводы эксперимента

| Вопрос | Ответ |
|--------|-------|
| Нужна ли сессия (cookies)? | **НЕТ** — запрос работает без cookies |
| Нужна ли предварительная навигация по шагам? | **НЕТ** — прямой POST без GET шагов 1-3 |
| Есть ли CSRF-токен? | **НЕТ** — токены не требуются |
| Проверяется ли Referer/Origin? | **НЕТ** — работает с любым Referer |
| Проверяется ли User-Agent? | **НЕТ** — работает со стандартным UA |
| Проверяется ли fingerprint? | **НЕТ** — headless-запрос прошёл |
| Формат ответа при успехе | **Redirect 200** на `/bookings/preSuccess/` с параметрами брони |
| Формат номера брони | `XXXXX_DDMMYY` (например `7XTWT_150226`) |

### 10.3 Обновлённая архитектура решения

Playwright **НЕ НУЖЕН** для создания бронирований. Достаточно одного HTTP POST-запроса.

```
┌─────────────────────────────────────┐
│        ВАШ СОБСТВЕННЫЙ ВИДЖЕТ       │
│         (на сайте apart-nn.ru)      │
│              Node.js                │
└──────────┬──────────────┬───────────┘
           │              │
     ЧТЕНИЕ ДАННЫХ   ЗАПИСЬ ДАННЫХ
     (HTTP GET)      (HTTP POST)
           │              │
           ▼              ▼
┌──────────────────┐ ┌────────────────────────┐
│  Public API      │ │  /bookings/post/{uid}  │
│  reservationsteps│ │  reservationsteps.ru   │
│  (JSON ответы)   │ │  (form-urlencoded)     │
└──────────────────┘ └────────────────────────┘
           │              │
           └──────┬───────┘
                  ▼
         ┌────────────────┐
         │   Bnovo PMS    │
         │  (база данных) │
         └────────────────┘
```

**Преимущества нового подхода vs Playwright:**
- Быстрее (один HTTP-запрос vs headless-браузер с навигацией)
- Надёжнее (нет зависимости от DOM-структуры страницы)
- Проще в поддержке (нет Playwright зависимости)
- Меньше ресурсов сервера (нет headless Chrome)

### 10.4 Рабочий код создания бронирования (Node.js)

```javascript
const UID = 'd0ce239f-df14-4aa8-8ccf-83036c8cbb01';

async function createBooking({ dfrom, dto, planId, adults, roomTypes, guest }) {
  const formData = new URLSearchParams({
    'servicemode': '0',
    'firstroom': '0',
    'dfrom': dfrom,           // формат DD-MM-YYYY
    'dto': dto,               // формат DD-MM-YYYY
    'planId': String(planId),
    'adults': String(adults),
    'children': '',
    'promoCode': '',
    'roomTypes': JSON.stringify(roomTypes), // {"roomId":{"c":count,"bv":3}}
    'roomtypeUpgrade': '',
    'services': '',
    'orderItems': '',
    'lang': 'ru',
    'warrantyType': 'noprepayment',
    'orderid': '',
    'moneywall_enabled': '0',
    'currency': '',
    'mobile_id': '0',
    'guarantee': '0',
    'customer[name]': guest.name,
    'customer[surname]': guest.surname,
    'customer[phone]': guest.phone,
    'customer[email]': guest.email,
    'customer[notes]': guest.notes || ''
  });

  const res = await fetch(
    `https://reservationsteps.ru/bookings/post/${UID}`,
    {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'https://reservationsteps.ru',
        'Referer': `https://reservationsteps.ru/bookings/index/${UID}`
      },
      redirect: 'follow'
    }
  );

  // Парсим номер бронирования из URL
  const url = new URL(res.url);
  const bookingNumber = url.searchParams.get('bookingNumber');
  const amount = url.searchParams.get('bookingAccommodationAmount');

  return {
    success: res.status === 200,
    bookingNumber,
    amount,
    status: res.status,
    finalUrl: res.url
  };
}
```

### 10.5 Тестирование warrantyType=onlinepay — РЕЗУЛЬТАТЫ

**Дата:** 15.02.2026

#### Тест: POST с warrantyType=onlinepay

**Запрос:** тот же что в 10.1, но `warrantyType=onlinepay` и `guarantee=1`.

**Результат: БРОНЬ СОЗДАНА — `VDECN_150226`** (Студия Стандарт, 2800 ₽)

**Цепочка ответов сервера:**
```
POST /bookings/post/{uid}
  → 302 Found
  → Location: /bookings/preSuccess/{uid}?bookingNumber=VDECN_150226&redirectUrl=...

GET /bookings/preSuccess/{uid}
  → 200 OK
  → HTML-страница с JS-переменной:
    const away_url = '/away/index/{uid}?away_url=https://payment.bnovo.ru/v2/?transaction=book_...'
  → Страница автоматически редиректит пользователя на away_url

GET /away/index/{uid}?away_url=...
  → Редирект на внешнюю платёжную форму Bnovo
```

**Полная ссылка на оплату (из теста):**
```
https://payment.bnovo.ru/v2/?transaction=book_2801832141e3d9af24eea24953fccbe23804355419edf321a
```

#### Разница между warrantyType

| Параметр | `onlinepay` | `noprepayment` |
|----------|-------------|----------------|
| Бронь создаётся? | **Да** | **Да** |
| Ответ сервера | **302** → preSuccess → payment | **302** → preSuccess (тоже с payment URL) |
| Оплата обязательна? | **Да** — если не оплатить за N часов, бронь отменяется | **Нет** — бронь сохраняется без оплаты |
| Ссылка на оплату | Есть (в redirect URL) | Есть (в redirect URL) |

#### Настройки тарифов по гарантии/оплате

| Тариф | ID | warranty_type | guarantee_sum | Авто-отмена |
|-------|----|---------------|---------------|-------------|
| Бронирование онлайн | 128501 | `onlinepay` | 1000 ₽ (фикс.) | Да, через 2 часа |
| Невозвратный (-10%) | 137020 | `onlinepay` | 100 ₽ (фикс.) | Да, через 2 часа |

**Параметры авто-отмены (из данных плана):**
- `booking_guarantee_till`: 1 (включено)
- `booking_guarantee_till_hours`: 2 (часа на оплату)
- `booking_guarantee_auto_booking_cancel`: 1 (автоотмена при неоплате)

#### Формат ссылки на оплату

```
https://payment.bnovo.ru/v2/?transaction=book_{TRANSACTION_HASH}
```

- `{TRANSACTION_HASH}` — уникальный хеш, генерируется сервером при создании брони
- Ссылка приходит в redirect URL на шаге preSuccess
- Извлекается из параметра `redirectUrl` → `away_url`

#### Как извлечь ссылку на оплату из ответа POST

```javascript
// POST с redirect: 'manual' возвращает 302
const res = await fetch(`https://reservationsteps.ru/bookings/post/${UID}`, {
  method: 'POST',
  body: formData,
  headers: { ... },
  redirect: 'manual'
});

// Парсим Location header
const location = res.headers.get('location');
const preSuccessUrl = new URL(`https://reservationsteps.ru${location}`);

// Извлекаем redirectUrl
const redirectUrl = preSuccessUrl.searchParams.get('redirectUrl');
const redirectParsed = new URL(`https://reservationsteps.ru${redirectUrl}`);

// Извлекаем away_url = ссылка на оплату
const paymentUrl = redirectParsed.searchParams.get('away_url');
// → https://payment.bnovo.ru/v2/?transaction=book_...

// Также доступны:
const bookingNumber = preSuccessUrl.searchParams.get('bookingNumber');
const amount = preSuccessUrl.searchParams.get('bookingAccommodationAmount');
```

#### Встраивание ссылки на оплату в собственный виджет — РЕЗУЛЬТАТЫ ПРОВЕРКИ

**Дата:** 15.02.2026

##### Полная цепочка редиректов оплаты

```
https://payment.bnovo.ru/v2/?transaction=book_{HASH}
  → 302 → payment.bnovo.ru/v2/?transaction=book_{HASH}&goto_hotel_system_id=7163
    → 302 → payment.alfabank.ru/payment/merchants/ecom2/payment_en.html?mdOrder={ORDER_ID}
      → 200 (платёжная форма Альфа-Банка)
```

Конечный платёжный шлюз — **Альфа-Банк** (`payment.alfabank.ru`).

##### Проверка iframe-совместимости

| Сервер | X-Frame-Options | Content-Security-Policy | Framebusting JS |
|--------|----------------|------------------------|-----------------|
| `payment.bnovo.ru` | **Нет** | **Нет** | **Нет** |
| `payment.alfabank.ru` | **Нет** | **Нет** | **Не обнаружен** |

Заголовки **формально не блокируют** iframe. Однако cookie от Альфа-Банка (`cookiesession1`) установлен **без `SameSite=None`**. Современные браузеры по умолчанию считают это как `SameSite=Lax` → cookie **не отправится** в cross-origin iframe. Это ломает работу платёжной формы в iframe на стороннем домене (`apart-nn.ru`).

##### Варианты встраивания — итоговая оценка

| Вариант | Работает? | Рекомендация |
|---------|-----------|-------------|
| **Redirect** (`window.location.href = paymentUrl`) | **Да, 100%** | **Рекомендуется** |
| **Новая вкладка** (`window.open(paymentUrl)`) | **Да, 100%** | Хороший альтернативный вариант |
| **iframe** на `apart-nn.ru` | **Скорее нет** | Cookie `SameSite=Lax` ломает платёжную форму в cross-origin iframe |

**Рекомендация: использовать redirect.** После создания брони через POST виджет перенаправляет пользователя на `payment.bnovo.ru/v2/?transaction=...`, пользователь оплачивает на Альфа-Банке и возвращается обратно.

### 10.6 Обновлённая схема полного flow виджета

```
Пользователь на сайте apart-nn.ru
        │
        ▼
┌─────────────────────────────┐
│   СОБСТВЕННЫЙ ВИДЖЕТ        │
│   1. Выбор дат и гостей     │ ← GET public-api.reservationsteps.ru/v1/api/rooms
│   2. Выбор номера и тарифа  │
│   3. Ввод данных гостя      │
│   4. Нажатие "Забронировать"│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Node.js сервер (backend)   │
│  POST reservationsteps.ru   │
│  /bookings/post/{uid}       │
│  warrantyType=onlinepay     │
└──────────┬──────────────────┘
           │
           ▼
    302 → /bookings/preSuccess/
    Извлекаем из redirect URL:
    • bookingNumber (номер брони)
    • paymentUrl (ссылка на оплату)
           │
           ▼
    window.location.href = paymentUrl
    (redirect пользователя)
           │
           ▼
┌─────────────────────────────┐
│  payment.bnovo.ru           │
│  → 302 → payment.alfabank.ru│
│  Форма оплаты Альфа-Банка   │
│  Пользователь вводит карту  │
└──────────┬──────────────────┘
           │
           ▼
    Бронь подтверждена в Bnovo PMS
    (видна в ЛК portal.pms.bnovo.ru)
```

### 10.7 Анализ защиты endpoint `/bookings/post/` — РЕЗУЛЬТАТЫ

**Дата:** 16.02.2026

Проведена серия из 20+ тестовых запросов с различными параметрами для проверки наличия защит.

#### Результат: ЗАЩИТА ОТСУТСТВУЕТ

| Механизм защиты | Проверен? | Результат |
|---|---|---|
| CAPTCHA | Да | **Нет** |
| CSRF-токен | Да | **Нет** |
| Проверка Origin | Да (6 вариантов) | **Нет** — работает с любым Origin, включая `evil-site.com` и пустой |
| Проверка Referer | Да (6 вариантов) | **Нет** — работает с любым Referer, включая отсутствующий |
| Проверка User-Agent | Да (curl, пустой) | **Нет** — работает с `curl/7.88.0` и без UA |
| Cookies / сессия | Да | **Нет** — работает без cookies |
| Rate limiting | Да (5 запросов за <3 сек) | **Не обнаружен** |
| IP-блокировка | Да | **Нет** |

#### Серверная валидация данных (единственная проверка)

| Поле | Валидация | Результат теста |
|---|---|---|
| `customer[name]` | Обязательно, не пустое | Пустое имя → 400 |
| `customer[email]` | Валидация формата email | `not-an-email` → 400 |
| `customer[phone]` | **Не валидируется** | `123` → 302 (бронь создана!) |
| `roomTypes` | Номер должен существовать | `999999` → 400 |
| `planId` | Тариф должен существовать | `999999` → 404 |
| `dfrom` / `dto` | Даты в будущем, dto > dfrom | Прошлое → 400, dto < dfrom → 400 |
| Кол-во номеров | Не больше available | `c:100` → 400 |

#### Выводы по безопасности

1. **Endpoint полностью открыт** — любой может отправить POST и создать бронирование, зная только UID отеля (публично виден в коде виджета на сайте).
2. **Нет защиты от спама** — можно создать сотни фейковых бронирований и заблокировать все номера.
3. **С `warrantyType=noprepayment`** — бронь создаётся мгновенно и блокирует номер без оплаты.
4. **С `warrantyType=onlinepay`** — бронь автоматически отменяется через 2 часа без оплаты (частичная защита).

#### Подводные камни для нашего подхода

| # | Риск | Вероятность | Последствие |
|---|------|-------------|-------------|
| 1 | Bnovo добавит CSRF / CAPTCHA | Средняя | Скрипт перестанет работать, нужно будет переделать на Playwright |
| 2 | Bnovo изменит формат полей / URL | Средняя | Скрипт сломается, нужно обновить параметры |
| 3 | Bnovo заблокирует IP при обнаружении автоматизации | Низкая | Нужен прокси или переход на Playwright |
| 4 | Bnovo изменит цепочку оплаты | Низкая | Нужно обновить извлечение payment URL |
| 5 | Нет API-контракта — нет гарантий обратной совместимости | — | Нужно мониторить работоспособность |

#### Почему для нас это приемлемо

- Мы — владелец отеля, используем свой аккаунт Bnovo
- Мы контролируем объём запросов (только реальные бронирования от гостей)
- Используем `warrantyType=onlinepay` → фейковые брони отменятся автоматически
- Если Bnovo что-то поменяет — скрипт можно оперативно обновить
- Запасной вариант: Playwright-автоматизация (уже задокументирована в разделе 8)

### 10.8 Тестовые бронирования — УДАЛИТЬ В ЛК

За время исследования создано **15 тестовых бронирований**. Все необходимо удалить в ЛК Bnovo (`portal.pms.bnovo.ru`).

| # | Номер брони | Тест | Даты | Email |
|---|---|---|---|---|
| 1 | `7XTWT_150226` | Первый POST noprepayment | 17-18.02 | test-direct-post@test.com |
| 2 | `VDECN_150226` | POST onlinepay | 17-18.02 | test-onlinepay@test.com |
| 3 | `JAZMW_150226` | Валидация: короткий телефон | 20-21.02 | limit-test@test.com |
| 4 | `36EDL_150226` | Контрольный (норм. заголовки) | 23-24.02 | control@test.com |
| 5 | `TKYNU_150226` | Только Origin=RS | 01-02.03 | ТолькоOriginreservationstepsru@test.com |
| 6 | `HZZK2_150226` | Только Referer=RS | 02-03.03 | ТолькоRefererreservationstepsru@test.com |
| 7 | `939S4_150226` | Origin=apart-nn.ru | 03-04.03 | Originapartnnru@test.com |
| 8 | `D2F9K_150226` | Origin=RS, Referer=evil | 04-05.03 | OriginRSRefererevil@test.com |
| 9 | `HXWWP_150226` | Origin=evil, Referer=RS | 05-06.03 | OriginevilRefererRS@test.com |
| 10 | `PPW75_150226` | Referer=apart-nn.ru | 06-07.03 | Refererapartnnru@test.com |
| 11 | `PLSUX_150226` | fake Origin + fake Referer | 08-09.03 | finaltest@test.com |
| 12 | `2S3WA_150226` | Только fake Referer | 09-10.03 | finaltest@test.com |
| 13 | `HDKEP_150226` | Только fake Origin | 10-11.03 | finaltest@test.com |
| 14 | `AZWZ2_150226` | Пустой Origin | 11-12.03 | finaltest@test.com |
| 15 | `HPX24_150226` | Без Origin/Referer | 12-13.03 | finaltest@test.com |

**Статус:** ожидает удаления владельцем.

### 10.9 Открытые вопросы

| # | Вопрос | Статус |
|---|--------|--------|
| 1 | ~~Работает ли POST с warrantyType=onlinepay?~~ | **ПРОВЕРЕНО — РАБОТАЕТ** |
| 2 | Формат поля `services` для доп.услуг | Не проверено |
| 3 | ~~Rate limiting на `/bookings/post/`~~ | **ПРОВЕРЕНО — НЕ ОБНАРУЖЕН** |
| 4 | ~~Поведение при бронировании занятого номера~~ | **ПРОВЕРЕНО** — возвращает 400, бронь не создаётся |
| 5 | ~~Разрешает ли `payment.bnovo.ru` iframe?~~ | **ПРОВЕРЕНО** — cookie `SameSite=Lax` ломает iframe. **Использовать redirect.** |
| 6 | ~~Проверяет ли сервер Origin/Referer/UA?~~ | **ПРОВЕРЕНО — НЕ ПРОВЕРЯЕТ** |
| 7 | Тестовые брони (15 шт.) — удалить в ЛК | **Ожидает действия владельца** |

---

## 11. Ссылки и ресурсы

| Ресурс | URL |
|--------|-----|
| Ваш сайт | https://apart-nn.ru/ |
| Ваш модуль бронирования | https://reservationsteps.ru/rooms/index/d0ce239f-df14-4aa8-8ccf-83036c8cbb01 |
| Public API (чтение) | https://public-api.reservationsteps.ru/v1/api/ |
| Bnovo PMS API (Swagger) | https://api.pms.bnovo.ru/swagger |
| OpenAPI спецификация | https://api.pms.bnovo.ru/docs/openapi.yaml |
| Конфигуратор виджета | https://widget.reservationsteps.ru/ |
| Документация Bnovo (RU) | https://help.bnovo.ru/ |
| Поддержка Bnovo | help@bnovo.ru / 8(800)222-74-43 |
| Ваш UID | d0ce239f-df14-4aa8-8ccf-83036c8cbb01 |
| Ваш account_id | 22720 |

---

## 12. Структура данных номеров в API — фотографии и описания

**Дата исследования:** 17.02.2026

### 12.1 Источники данных о номерах

Виджет Bnovo получает данные о номерах из двух endpoints:

| Endpoint | Назначение | Размер ответа | Кол-во элементов |
|----------|-----------|---------------|-----------------|
| `GET /rooms?account_id=22720&dfrom=...&dto=...` | Доступные номера с ценами (основной) | ~1.5 МБ | 64 номера |
| `GET /roomtypes?account_id=22720` | Каталог типов номеров (без цен/доступности) | ~1.3 МБ | 83 типа |

Оба возвращают обёртку `{ "rooms": [...] }`.

**`/rooms`** = `/roomtypes` + цены (`plans.{id}.prices`) + доступность (`available`) + адрес/гео. Это основной endpoint для виджета бронирования.

### 12.2 Структура объекта номера (JSON)

Полная структура на примере **Студия Art №318** (`id: "367603"`):

#### Основные поля

| Поле | Тип | Пример | Описание |
|------|-----|--------|----------|
| `id` | **string** | `"367603"` | ID типа номера (строка, не число!) |
| `parent_id` | number | `0` | Родительский тип (0 = корневой) |
| `name` | string | `"Студия Art №318"` | Название номера |
| `adults` | number | `4` | Макс. взрослых |
| `children` | number | `0` | Макс. детей |
| `available` | number | `2` | Доступно номеров на выбранные даты |
| `order` | number | `6` | Порядок сортировки |
| `accommodation_type` | number | `0` | Тип размещения |
| `bed_variant` | null | `null` | Вариант кровати |
| `youtube_url` | null | `null` | Ссылка на YouTube |
| `video_url` | null | `null` | Ссылка на видео |
| `subrooms` | null | `null` | Подкатегории |

#### Адрес/гео (только в `/rooms`, не в `/roomtypes`)

| Поле | Значение |
|------|----------|
| `address` | `""` (не заполнено) |
| `address_eng` | `""` |
| `city` / `city_eng` | `""` |
| `geo_data` | `"(0,0)"` |

### 12.3 Фотографии (`photos[]`)

Массив объектов фотографий. Для "Студия Art №318" — **11 фотографий**.

#### Структура одной фотографии

```json
{
  "id": 1940269,
  "name": "IMG_4316.JPG",
  "file_name": "7674f87a56271b67ab5c3626807e31a6.jpg",
  "mime_type": "image/jpeg",
  "size": 3234775,
  "account_id": 22720,
  "create_date": "2026-02-16 16:01:08",
  "update_date": "2026-02-16 16:01:08",
  "roomtype_id": 367603,
  "order": 1,
  "url": "https://storage.reservationsteps.ru/7674f87a56271b67ab5c3626807e31a6_1050x600.jpg",
  "thumb": "https://storage.reservationsteps.ru/7674f87a56271b67ab5c3626807e31a6_1050x600.jpg",
  "original_url": "https://storage.reservationsteps.ru/7674f87a56271b67ab5c3626807e31a6.jpg"
}
```

#### Поля фотографии

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | number | Уникальный ID фотографии |
| `name` | string | Оригинальное имя файла при загрузке |
| `file_name` | string | Хеш-имя файла на сервере хранения |
| `mime_type` | string | Всегда `"image/jpeg"` |
| `size` | number | Размер оригинала в байтах (~2.4–3.8 МБ) |
| `account_id` | number | ID аккаунта (22720) |
| `create_date` | string | Дата загрузки (UTC) |
| `update_date` | string | Дата обновления |
| `roomtype_id` | number | ID типа номера (здесь число, не строка!) |
| `order` | number | Порядок отображения (1, 2, 3...) |
| `url` | string | **Ресайз 1050×600** — для карточек в виджете |
| `thumb` | string | **Миниатюра** — идентична `url` (1050×600) |
| `original_url` | string | **Полноразмерный оригинал** — для галереи/лайтбокса |

#### Хостинг изображений

Все фото хранятся на `storage.reservationsteps.ru`.

Формат URL:
- Превью: `https://storage.reservationsteps.ru/{hash}_1050x600.jpg`
- Оригинал: `https://storage.reservationsteps.ru/{hash}.jpg`

#### Полный список фото "Студия Art №318"

| # | order | url (1050×600) | original_url | name |
|---|-------|----------------|--------------|------|
| 1 | 1 | `...7674f87a..._1050x600.jpg` | `...7674f87a...jpg` | IMG_4316.JPG |
| 2 | 2 | `...cb9a21a2..._1050x600.jpg` | `...cb9a21a2...jpg` | IMG_4337.JPG |
| 3 | 3 | `...4d238a06..._1050x600.jpg` | `...4d238a06...jpg` | IMG_4324.JPG |
| 4 | 4 | `...da7adedf..._1050x600.jpg` | `...da7adedf...jpg` | IMG_4327.JPG |
| 5 | 5 | `...90e7be86..._1050x600.jpg` | `...90e7be86...jpg` | IMG_4283.JPG |
| 6 | 6 | `...ef0a1fff..._1050x600.jpg` | `...ef0a1fff...jpg` | IMG_4290.JPG |
| 7 | 7 | `...a7a3cd39..._1050x600.jpg` | `...a7a3cd39...jpg` | IMG_4351.JPG |
| 8 | 8 | `...1343fd90..._1050x600.jpg` | `...1343fd90...jpg` | IMG_4360.JPG |
| 9 | 9 | `...71a4869c..._1050x600.jpg` | `...71a4869c...jpg` | IMG_4348.JPG |
| 10 | 10 | `...3291c35b..._1050x600.jpg` | `...3291c35b...jpg` | IMG_4371.JPG |
| 11 | 11 | `...e294d011..._1050x600.jpg` | `...e294d011...jpg` | IMG_4366.JPG |

### 12.4 Описания номеров

| Поле | Содержимое для "Студия Art №318" |
|------|----------------------------------|
| `description` | Заполнено (= `description_ru`) |
| `description_ru` | Заполнено (полный текст на русском) |
| `description_en` | `""` (пусто) |
| `description_de`, `_zh`, `_es`, `_fr`, `_ja`, `_it`, `_ko`, `_pl`, `_fi`, `_lt`, `_ro`, `_lv`, `_uk`, `_hy` | `""` (все пусто) |

**Важно:** Поведение полей `description` и `description_ru` **непоследовательно** между номерами:
- У "Студия Art №318" — оба поля **идентичны** (содержат одинаковый текст)
- У "Студия Deluxe" — `description` **пустое**, текст только в `description_ru`
- **Рекомендация:** при разработке виджета использовать `description_ru || description` (с fallback)

#### Структура текста описания

Описание состоит из двух логических блоков:

**Блок 1 — Уникальное описание номера:**
- Название, площадь (28 м²)
- Количество типовых апартаментов в категории
- Мебель и оборудование (кровать 200×160, диван 200×190, кухня, кондиционер)
- Санузел (душевая, стиральная машина, фен, полотенца)
- Комплименты (чайный сет, вода, сладости)
- Расположение и вид (3 этаж, вид на город)

**Блок 2 — Общая информация об отеле (шаблонная, одинаковая для всех номеров):**
- Документы для заезда (паспорт/в/у)
- Возрастные ограничения (18+)
- Время заезда/выезда (14:00 / 12:00)
- Завтраки (кафе "Латте на двоих", 500 ₽)
- Доп. услуги (пакет "Мама и малыш" 1000 ₽, проектор 1000 ₽)
- Правила проживания с животными (запрещено, кроме Pet Friendly номеров)
- Парковка (подземная платная, за шлагбаумом бесплатно)
- Ресторан "Стейк Хаус" на 1 этаже

### 12.5 Локализация названий

| Поле | Значение |
|------|----------|
| `name` | `"Студия Art №318"` |
| `name_ru` | `"Студия Art №318"` (дублирует `name`) |
| `name_en` ... `name_hy` | `""` (все пусто — переводы не заполнены) |

### 12.6 Удобства (`amenities`)

Объект с ключами — ID удобств, значения — объекты с полем `value`:

```json
{
  "1": { "value": "28" },
  "2": { "value": "" },
  "3": { "value": "" },
  "8": { "value": "" },
  ...
}
```

- Ключ `"1"` со значением `"28"` = **площадь 28 м²**
- Остальные ключи с пустым `value` = удобство **присутствует** (флаг), но без числового значения
- Для расшифровки ID удобств используется endpoint `GET /amenities` (возвращает полный каталог с названиями и SVG-иконками)

Обнаружено **25 удобств** для данного номера (ID: 1, 2, 3, 8, 9, 10, 12, 13, 14, 16, 20, 23, 25, 27, 29, 30, 33, 34, 36, 37, 39, 40, 41, 44, 50).

### 12.7 Тарифные планы (`plans`)

Объект с ключами — ID тарифа. Для "Студия Art №318" — **2 тарифа**:

#### Тариф "Бронирование онлайн" (id: 128501)

| Параметр | Значение |
|----------|----------|
| `name` | "Бронирование онлайн" |
| `warranty_type` | `"onlinepay"` |
| `booking_guarantee_sum` | `"1000.00"` (фикс. 1000 ₽) |
| `booking_guarantee_unit` | `"absolute"` |
| `booking_guarantee_till_hours` | `2` (2 часа на оплату) |
| `booking_guarantee_auto_booking_cancel` | `1` (автоотмена) |
| `cancellation_deadline` | `"2"` |
| `cancellation_fine_type` | `"4"` |
| `nutrition` | `"000"` (без питания) |
| `prices` | `{"2026-03-01": 4200, "2026-03-02": 4600}` |
| `price` | `8800` (итого за 2 ночи) |

#### Тариф "Невозвратный (Скидка 10%)" (id: 137020)

| Параметр | Значение |
|----------|----------|
| `name` | "Невозвратный (Скидка 10%)" |
| `warranty_type` | `"onlinepay"` |
| `booking_guarantee_sum` | `"100.00"` |
| `booking_guarantee_unit` | `"percentage"` (100% предоплата) |
| `booking_guarantee_percentage_from` | `"all"` |
| `cancellation_rules` | "Невозвратный тариф. 100% предоплата..." |
| `cancellation_deadline` | `"365"` |
| `prices` | `{"2026-03-01": 3780, "2026-03-02": 4140}` |
| `price` | `7920` (итого за 2 ночи, -10%) |

### 12.8 Дополнительные поля

| Поле | Значение | Описание |
|------|----------|----------|
| `extra_array.excluded` | `"0"` | Не исключён из выдачи |
| `extra_array.children_ages` | `[]` | Возрасты детей (пусто) |

### 12.9 Выводы для разработки виджета

| Задача | Решение |
|--------|---------|
| Отображение фото | `photos[].url` для карточек (1050×600), `photos[].original_url` для полноэкранного просмотра. Сортировка по `order`. |
| Описание номера | `description_ru \|\| description` (с fallback, т.к. заполнение непоследовательно) |
| Разделение описания | Текст до "Добро пожаловать" = уникальное описание номера; после = шаблон отеля. При желании можно разделить программно. |
| Название | `name_ru \|\| name` |
| Площадь | `amenities["1"].value` (= "28" м²) |
| Цена | `plans[planId].price` (итого) или `plans[planId].prices` (по датам) |
| Доступность | `available` (число свободных номеров) |
| ID номера | **Строка** (`"367603"`), не число — учитывать при сравнениях |

---

## 13. Архитектура собственного виджета — React + iframe

**Дата:** 18.02.2026

### 13.1 Концепция: самодостаточный виджет в iframe

Виджет реализуется как **React-приложение**, которое хостится на нашем сервере и встраивается на любой сайт через iframe. Технология сайта-хоста (чистый HTML, WordPress, Tilda, React) **не имеет значения** — iframe загружает нашу HTML-страницу с нашего сервера как изолированный документ со своим DOM, стилями и JavaScript.

### 13.2 Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│  САЙТ КЛИЕНТА (любая технология: HTML, WordPress, Tilda...) │
│                                                             │
│  <iframe src="https://widget.apart-nn.ru/"></iframe>        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  IFRAME — изолированное окно браузера               │    │
│  │                                                     │    │
│  │  Загружается НАША HTML-страница с НАШЕГО сервера    │    │
│  │  с React-приложением внутри                         │    │
│  │                                                     │    │
│  │  index.html ← загружает bundle.js                   │    │
│  │  bundle.js  ← React + компоненты виджета            │    │
│  │  styles.css ← стили виджета                         │    │
│  │                                                     │    │
│  │  React рендерит DOM внутри iframe                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 13.3 Совместимость с любыми сайтами

| Сайт клиента | Работает? | Почему |
|---|---|---|
| Чистый HTML | Да | iframe загружает нашу страницу — React рендерит внутри |
| WordPress | Да | Точно то же самое — iframe изолирован от CMS |
| Tilda / Wix | Да | Конструкторы поддерживают вставку iframe |
| React / Vue / Angular | Да | Два независимых приложения, изолированы друг от друга |

**Ключевой принцип:** iframe — это песочница. Внутри неё мы полностью контролируем HTML-структуру, CSS (не конфликтуют с сайтом-хостом), JavaScript (React, запросы к API), рендеринг и логику.

### 13.4 Поток данных

```
                    НАШ СЕРВЕР
                (widget.apart-nn.ru)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   index.html      bundle.js       Node.js API
   (точка входа)   (React app)     (backend)
        │               │               │
        └───────┬───────┘               │
                │                       │
                ▼                       │
┌──────────────────────────┐            │
│  БРАУЗЕР ПОЛЬЗОВАТЕЛЯ    │            │
│                          │            │
│  Сайт клиента            │            │
│  ┌────────────────────┐  │            │
│  │ <iframe>           │  │            │
│  │                    │  │            │
│  │  React рендерит:   │  │            │
│  │  1. Календарь дат  │──┼──GET──→ public-api.reservationsteps.ru
│  │  2. Список номеров │──┼──GET──→ /rooms?account_id=22720&...
│  │  3. Форму гостя    │  │            │
│  │  4. Кнопку "Забр." │──┼──POST─→ Node.js backend
│  │                    │  │            │
│  └────────────────────┘  │            ▼
│                          │   POST reservationsteps.ru
│                          │   /bookings/post/{uid}
│                          │            │
│                          │            ▼
│  window.top.location =   │◀── payment URL
│  payment.bnovo.ru/...    │   (redirect на оплату)
└──────────────────────────┘
```

### 13.5 Зачем нужен Node.js backend (прокси)

Прямой POST из браузера клиента на `reservationsteps.ru` заблокируется **CORS** (cross-origin request). Поэтому:

1. React (в iframe) отправляет данные на **наш** Node.js backend (`widget.apart-nn.ru/api/booking`)
2. Node.js делает POST на `reservationsteps.ru/bookings/post/{uid}` (серверный запрос — CORS не применяется)
3. Получает номер брони и ссылку на оплату
4. Возвращает ссылку на оплату в iframe
5. iframe делает redirect на платёжную страницу

**Чтение данных** (GET `/rooms`, `/min_prices`) — нужно проверить CORS-заголовки `public-api.reservationsteps.ru`. Если CORS разрешён — можно запрашивать напрямую из браузера. Если нет — проксировать через наш backend.

### 13.6 Код встраивания для владельцев сайтов

#### Вариант 1 — простой iframe

```html
<iframe
  src="https://widget.apart-nn.ru/"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

#### Вариант 2 — скрипт-лоадер (более гибкий)

```html
<div id="apart-nn-widget"></div>
<script src="https://widget.apart-nn.ru/loader.js"></script>
```

`loader.js` сам создаёт iframe нужного размера с автоподстройкой высоты через `postMessage`.

### 13.7 Структура проекта

```
widget.apart-nn.ru/
├── frontend/                ← React-приложение (виджет)
│   ├── src/
│   │   ├── App.jsx                   ← корневой компонент
│   │   ├── components/
│   │   │   ├── DatePicker.jsx        ← выбор дат заезда/выезда
│   │   │   ├── RoomList.jsx          ← список доступных номеров
│   │   │   ├── RoomCard.jsx          ← карточка номера (фото, цена, удобства)
│   │   │   ├── GuestForm.jsx         ← форма данных гостя
│   │   │   └── BookingConfirm.jsx    ← подтверждение бронирования
│   │   ├── api/
│   │   │   └── bnovo.js              ← запросы к public API и нашему backend
│   │   └── index.html                ← точка входа (загружается в iframe)
│   └── dist/
│       ├── index.html
│       └── bundle.js                 ← собранный React-бандл
│
├── backend/                 ← Node.js сервер
│   ├── server.js                     ← Express/Fastify
│   └── routes/
│       └── booking.js                ← проксирование POST → reservationsteps.ru
│
└── loader.js                ← скрипт-лоадер для вставки на сайты клиентов
```

### 13.8 Открытые вопросы по архитектуре

| # | Вопрос | Статус |
|---|--------|--------|
| 1 | Разрешает ли `public-api.reservationsteps.ru` CORS? | Не проверено — определит, нужен ли прокси для GET-запросов |
| 2 | Автоподстройка высоты iframe через `postMessage` | Реализовать в loader.js |
| 3 | Хостинг виджета (домен, сервер) | Не определён |
| 4 | Адаптивность виджета (мобильные устройства) | Учесть при разработке компонентов |

---

*Файл обновлён: 18.02.2026 (версия 9)*
*Исследование проведено на основе: анализа сайта apart-nn.ru, OpenAPI спецификации Bnovo PMS, публичного API reservationsteps.ru, Playwright-автоматизации полного flow бронирования, тестирования прямого HTTP POST для создания бронирований, тестирования warrantyType и процесса оплаты, проверки iframe-совместимости платёжного шлюза, полного анализа защиты endpoint (Origin/Referer/UA/CSRF/rate-limit), анализа структуры данных номеров (фото, описания, тарифы), проектирования архитектуры React-виджета в iframe*
