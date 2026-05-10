# Poster API — Clients / Marketing (CRM)

Source: https://dev.joinposter.com/en/docs/v3/web/clients/index

Всі методи починаються з `clients.`

---

## clients.getClients — Список клієнтів

**GET** `https://joinposter.com/api/clients.getClients`

### GET параметри

| Параметр | Опис |
|---|---|
| `num` | Кількість клієнтів |
| `offset` | Пропустити N клієнтів |
| `group_id` | ID групи клієнтів |
| `phone` | Телефон у міжнародному форматі |
| `birthday` | Дата народження у форматі `md` |
| `client_id_only` | `true` — повернути тільки `client_id` |
| `1c` | `true` — повернути ID в системі 1C |
| `order_by` | Поле для сортування (default: `client_id`) |
| `sort` | `asc`/`desc` (default: `desc`) |
| `loyalty_type` | `1`=бонусна, `2`=знижкова |

> Якщо `num` і `offset` не вказані — повертаються всі клієнти

### Поля відповіді

| Поле | Опис |
|---|---|
| `client_id` | ID клієнта |
| `firstname` / `lastname` / `patronymic` | Ім'я |
| `phone` / `phone_number` | Телефон |
| `email` | Email |
| `birthday` | Дата народження |
| `card_number` | Номер картки |
| `client_sex` | `0`=не вказано, `1`=чол, `2`=жін |
| `country` / `city` / `address` | Адреса |
| `addresses[]` | Масив адрес доставки |
| `discount_per` | Персональна знижка/бал |
| `bonus` | Поточна кількість бонусів (мінімальні одиниці) |
| `total_payed_sum` | Загальна сума покупок |
| `date_activale` | Дата створення |
| `comment` | Коментар |
| `client_groups_id` | ID групи |
| `client_groups_name` | Назва групи |
| `client_groups_discount` | Відсоток групи |
| `loyalty_type` | `1`=бонусна, `2`=знижкова |
| `birthday_bonus` | Бонуси на день народження |
| `delete` | `0`=активний, `1`=видалений |
| `ewallet` | Баланс електронного гаманця |

### `addresses[]`

| Поле | Опис |
|---|---|
| `id` | ID адреси |
| `delivery_zone_id` | ID зони доставки |
| `country` / `city` | Країна/місто |
| `address1` / `address2` | Адреса 1/2 |
| `comment` | Коментар |
| `lat` / `lng` | Координати |
| `zip_code` | Поштовий індекс |

---

## clients.createClient — Створити клієнта

**POST** `https://joinposter.com/api/clients.createClient`

---

## clients.updateClient — Оновити клієнта

**POST** `https://joinposter.com/api/clients.updateClient`

---

## clients.changeClientBonus — Змінити бонуси

**POST** `https://joinposter.com/api/clients.changeClientBonus`

---

## clients.addEWalletPayment — Поповнити гаманець

**POST** `https://joinposter.com/api/clients.addEWalletPayment`

---

## clients.addEWalletTransaction — Списати з гаманця

**POST** `https://joinposter.com/api/clients.addEWalletTransaction`

---

## clients.getGroups — Список груп клієнтів

**GET** `https://joinposter.com/api/clients.getGroups`

---

## clients.getPromotions — Список акцій

**GET** `https://joinposter.com/api/clients.getPromotions`

---

## clients.getLoyaltyRules — Правила лояльності

**GET** `https://joinposter.com/api/clients.getLoyaltyRules`

---

## clients.sendSms — Відправити SMS

**POST** `https://joinposter.com/api/clients.sendSms`

---

## Типи лояльності

| `loyalty_type` | Тип |
|---|---|
| `1` | Бонусна (нараховуються бали) |
| `2` | Знижкова (відсоток знижки) |
