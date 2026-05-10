# Poster API — Getting Started

Source: https://dev.joinposter.com/en/docs/v3/start/index

## Що таке Poster API

Poster — POS-система для ресторанів і кафе (~23,000 локацій у 100 країнах).
API дозволяє:
- Синхронізувати замовлення і продукти між Poster і вашим сайтом
- Створювати кастомні звіти в адмін-панелі
- Вбудовувати додатки в POS-термінал і адмін-панель
- Підключати пристрої (фіскальні принтери, платіжні термінали)

## Платформи

| Платформа | Опис |
|---|---|
| Web API | REST API — отримання/редагування будь-яких даних акаунту |
| Manage Platform | Вбудовування у адмін-панель |
| POS Platform | Вбудовування у POS-касу |
| Device Platform | Інтеграція пристроїв (принтери, термінали) |

## Отримання access_token

### Особиста інтеграція (для тестування)
Йти в акаунті: **Access → Integrations** → взяти Personal Integration token.

### Для клієнтів Poster (OAuth2)
1. Зареєструватись на https://dev.joinposter.com/en/signup
2. Створити Application в developer account
3. Отримати `application_id` і `application_secret`
4. Реалізувати OAuth2 flow (детально в `02_authentication.md`)

## Створення Application

1. Зареєструватись або увійти на https://dev.joinposter.com
2. **Account → Create Application** → ввести: назва, категорія, опис → **Create**
3. В **Development** — додати акаунти для тестування
4. В **Settings** — знайти `application_id` і `application_secret`

## Developer Account — секції

| Секція | Призначення |
|---|---|
| Settings | Application ID, Secret, Access Categories, OAuth redirect_url |
| Description | Опис і логотип для маркетплейсу |
| Development | Акаунти для тестування без публікації |
| Publishing | Відправка на review для публікації в маркетплейс |
| Payments | Список акаунтів і платежів |
| Connections | Список підключених акаунтів |

## Реєстрація на dev.joinposter.com
URL: https://dev.joinposter.com/en/signup
