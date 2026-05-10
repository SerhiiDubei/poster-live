# Poster API — Online Orders & Reservation

Source: https://dev.joinposter.com/en/docs/v3/web/incomingOrders/index

Всі методи починаються з `incomingOrders.`

---

## incomingOrders.createIncomingOrder — Створити онлайн-замовлення

**POST** `https://joinposter.com/api/incomingOrders.createIncomingOrder?token={token}`

### POST параметри

| Параметр | Опис |
|---|---|
| `spot_id` | **Обов'язково.** ID локації |
| `client_id` | ID клієнта (або передати `phone`) |
| `first_name` / `last_name` | Ім'я/прізвище |
| `phone` | Телефон (обов'язково якщо немає `client_id`) |
| `email` | Email |
| `sex` | Стать: `0`=не вказано, `1`=чол, `2`=жін |
| `birthday` | Дата народження: `Y-m-d` |
| `client_address_id` | ID адреси клієнта |
| `client_address` | Об'єкт адреси (детально нижче) |
| `service_mode` | `1`=dine-in, `2`=takeout, `3`=delivery |
| `delivery_price` | Ціна доставки у мінімальних одиницях (тільки для `service_mode=3`) |
| `comment` | Коментар до замовлення |
| `products` | **Обов'язково.** Масив продуктів |
| `payment` | Інформація про передоплату |
| `promotion` | Масив акцій |
| `delivery_time` | Час доставки: `YYYY-MM-DD hh:mm:ss` |
| `skip_phone_validation` | `true`/`false` — пропустити валідацію телефону |

### `products[]`

| Параметр | Опис |
|---|---|
| `product_id` | ID продукту |
| `modificator_id` | ID модифікатора |
| `modification` | JSON-рядок модифікацій: `[{"m": id, "a": count}]` |
| `count` | **Обов'язково.** Кількість |
| `price` | Ціна у мінімальних одиницях (за замовч. — ціна закладу) |

### `client_address` об'єкт

| Параметр | Опис |
|---|---|
| `address1` | Вулиця і будинок |
| `address2` | Під'їзд, поверх, квартира |
| `comment` | Коментар |
| `lat` / `lng` | Координати |

### `payment` об'єкт

| Параметр | Опис |
|---|---|
| `type` | `0`=передоплата не зроблена, `1`=зроблена |
| `sum` | Сума у мінімальних одиницях |
| `currency` | ISO код валюти: `UAH`, `USD`, тощо |

### `promotion[]`

| Параметр | Опис |
|---|---|
| `id` | ID акції |
| `involved_products` | Продукти, що беруть участь: `[{id, count, modification?}]` |
| `result_products` | Продукти-результат: `[{id, count, modification?}]` (тільки для бонусних акцій) |

---

### Відповідь

```json
{
  "response": {
    "incoming_order_id": 2,
    "type": "1",
    "spot_id": "1",
    "status": 0,
    "client_id": 0,
    "phone": null,
    "comment": null,
    "created_at": "2017-10-27 11:47:19",
    "transaction_id": null,
    "service_mode": 1,
    "delivery_price": 0,
    "delivery_time": "0000-00-00 00:00:00",
    "products": [...]
  }
}
```

| Поле | Опис |
|---|---|
| `incoming_order_id` | ID онлайн-замовлення |
| `type` | `1`=online order, `2`=reservation |
| `status` | `0`=нове, `1`=прийняте, `7`=скасоване |
| `transaction_id` | ID пов'язаного замовлення на касі |

---

## incomingOrders.getIncomingOrders — Список онлайн-замовлень

**GET** `https://joinposter.com/api/incomingOrders.getIncomingOrders`

---

## incomingOrders.createReservation — Створити резервацію

**POST** `https://joinposter.com/api/incomingOrders.createReservation`

---

## incomingOrders.getTablesForReservation — Столи для резервації

**GET** `https://joinposter.com/api/incomingOrders.getTablesForReservation`

---

## Статуси онлайн-замовлення

| Статус | Опис |
|---|---|
| `0` | Нове |
| `1` | Прийняте |
| `7` | Скасоване |
