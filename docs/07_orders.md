# Poster API — Orders (Замовлення)

Source: https://dev.joinposter.com/en/docs/v3/web/transactions/index

Всі методи починаються з `transactions.`

---

## POST /api/orders — Створити замовлення (новий метод)

**POST** `https://joinposter.com/api/orders?token={token}`

### Тіло запиту

```json
{
  "spotId": 1,
  "tableId": 1,
  "waiterId": 4,
  "guestsCount": 1,
  "serviceMode": 3,
  "autoAccept": false,
  "client": {
    "id": 1,
    "firstName": "Test",
    "lastName": "Test",
    "phone": "+380501111111",
    "email": "test@gmail.com",
    "address": {
      "street": "address1",
      "additionalInfo": "address2",
      "comment": "Some comment",
      "lat": "",
      "lng": ""
    }
  },
  "comment": "Some comment",
  "products": [
    { "id": 25, "count": 2, "price": 33.11, "comment": "..." },
    { "id": 35, "count": 0.04 },
    { "id": 18, "count": 3, "modificatorId": 1 },
    { "id": 39, "count": 1, "modification": [{ "id": 6, "count": 1 }] }
  ],
  "delivery": {
    "courierId": 1,
    "processingStatus": 40,
    "deliveryPrice": 100.66,
    "time": "2024-07-15 16:30:02",
    "paymentMethodId": 2
  },
  "payments": [{ "sum": 762.86 }]
}
```

### Параметри запиту

| Параметр | Опис |
|---|---|
| `spotId` | ID локації |
| `tableId` | ID стола |
| `waiterId` | ID офіціанта |
| `guestsCount` | Кількість гостей |
| `serviceMode` | `1`=dine-in, `2`=takeout, `3`=delivery |
| `autoAccept` | `false`=ручне підтвердження, `true`=автопідтвердження (default: `true`) |
| `comment` | Коментар |
| `products` | Масив продуктів |
| `delivery` | Об'єкт доставки |
| `payments` | Масив оплат |

### `client` об'єкт

| Параметр | Опис |
|---|---|
| `id` | ID клієнта в Poster |
| `firstName` / `lastName` | Ім'я/прізвище |
| `phone` | Телефон (обов'язковий якщо немає `id`) |
| `email` | Email |
| `address.street` | Вулиця і будинок |
| `address.additionalInfo` | Під'їзд, поверх, квартира |
| `address.lat` / `lng` | Координати |

### `products[]`

| Параметр | Опис |
|---|---|
| `id` | ID продукту |
| `count` | Кількість (обов'язково) |
| `modificatorId` | ID модифікатора |
| `modification` | Модифікації страви: `[{id, count}]` |
| `comment` | Коментар до продукту |
| `price` | Ціна (у валюті акаунту) |

### `delivery` об'єкт

| Параметр | Опис |
|---|---|
| `courierId` | ID кур'єра |
| `processingStatus` | `40`=в дорозі, `50`=доставлено |
| `deliveryPrice` | Ціна доставки |
| `time` | Час доставки: `YYYY-MM-DD hh:mm:ss` |
| `paymentMethodId` | ID способу оплати |

### Відповідь

```json
{
  "response": {
    "id": 156,
    "status": 0,
    "sum": 343.72,
    "spotId": 1,
    "serviceMode": 3,
    "products": [...]
  }
}
```

---

## transactions.closeTransaction — Закрити замовлення

**POST** `https://joinposter.com/api/transactions.closeTransaction?token={token}`

### POST параметри

| Параметр | Опис |
|---|---|
| `spot_id` | ID локації |
| `spot_tablet_id` | ID каси |
| `transaction_id` | ID замовлення |
| `payed_cash` | Сума оплати готівкою (мінімальні одиниці) |
| `payed_card` | Сума оплати карткою |
| `payed_cert` | Сума оплати подарунковою карткою |
| `tip_included` | Чайові: `1`=включено, `2`=не включено |
| `tip_sum` | Сума чайових |
| `reason` | Причина закриття без оплати: `1`=клієнт пішов, `2`=на халяву, `3`=помилка офіціанта |
| `print_fiscal` | `0`=не друкувати, `1`=друкувати фіскальний чек |
| `time` | Час операції у microtime форматі |
| `payment_method_id` | ID кастомного способу оплати |

### Відповідь

```json
{ "response": { "err_code": 0 } }
```

---

## transactions.getTransactions — Список замовлень

**GET** `https://joinposter.com/api/transactions.getTransactions`

---

## transactions.addTransactionProduct — Додати продукт до замовлення

**POST** `https://joinposter.com/api/transactions.addTransactionProduct`

---

## transactions.changeTransactionProductCount — Змінити кількість

**POST** `https://joinposter.com/api/transactions.changeTransactionProductCount`

---

## transactions.removeTransactionProduct — Видалити продукт

**POST** `https://joinposter.com/api/transactions.removeTransactionProduct`

---

## transactions.changeClient — Прив'язати клієнта

**POST** `https://joinposter.com/api/transactions.changeClient`

---

## transactions.removeTransaction — Видалити замовлення

**POST** `https://joinposter.com/api/transactions.removeTransaction`

---

## Service Modes (режими обслуговування)

| Значення | Режим |
|---|---|
| `1` | Dine-in (в залі) |
| `2` | Takeout (на виніс) |
| `3` | Delivery (доставка) |
