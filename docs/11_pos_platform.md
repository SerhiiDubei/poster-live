# Poster API — POS Platform (JavaScript SDK)

Source: https://dev.joinposter.com/en/docs/v3/pos/index

POS Platform дозволяє вбудовувати додатки безпосередньо у POS-касу Poster.
Використовує JavaScript SDK (`PosterJS`).

---

## Початок роботи

1. Увімкнути **POS Platform** у налаштуваннях Application в developer account
2. Задеплоїти web-додаток (iframe)
3. Підключити до Development account для тестування

Docs для дебагу: https://dev.joinposter.com/en/docs/v3/pos/debug
Docs для деплою: https://dev.joinposter.com/en/docs/v3/pos/deploy

---

## Requests

### PosterJS.makeRequest — Cross Domain Request
Відправляє запит до стороннього домену з каси.

### PosterJS.makeApiRequest — Poster API Request
Відправляє запит до Poster Web API.

---

## Interface

| Метод | Опис |
|---|---|
| `interface.popup` | Показати попап |
| `interface.closePopup` | Закрити попап |
| `interface.showApplicationIconAt` | Показати іконку додатку |
| `interface.scanBarcode` | Сканувати штрихкод або QR |
| `interface.showNotification` | Показати повідомлення-сповіщення |
| `interface.showManageRightsModal` | Показати модал введення адмін-пароля |

---

## Customers (POS)

| Метод | Опис |
|---|---|
| `clients.get` | Отримати дані клієнта |
| `clients.create` | Створити клієнта на касі |
| `clients.find` | Знайти клієнта |

---

## Users (POS)

| Метод | Опис |
|---|---|
| `users.get` | Отримати дані юзера |
| `users.getActiveUser` | Поточний активний юзер |

---

## Orders (POS)

| Метод | Опис |
|---|---|
| `orders.create` | Створити замовлення |
| `orders.getActive` | Отримати поточне замовлення |
| `orders.setOrderBonus` | Встановити знижку |
| `orders.setOrderClient` | Додати клієнта |
| `orders.setOrderComment` | Встановити коментар |
| `orders.printReceipt` | Надрукувати чек |
| `orders.setPrintText` | Текст для принтера |
| `orders.addProduct` | Додати продукт/страву |
| `orders.changeProductCount` | Змінити кількість |
| `orders.setExtras` | Задати extras |
| `orders.sendToKitchen` | Відправити тікет на кухню |

---

## Products (POS)

| Метод | Опис |
|---|---|
| `products.getAll` | Всі продукти |
| `products.get` | Один продукт |
| `products.getFullName` | Повна назва продукту |

---

## Product Categories (POS)

| Метод | Опис |
|---|---|
| `categories.getAll` | Всі категорії |
| `categories.get` | Одна категорія |

---

## Events (підписка на події)

Підписка: `PosterJS.on(eventName, callback)`

### Order Events
| Подія | Опис |
|---|---|
| `orderOpen` | Створення замовлення |
| `orderProductChange` | Зміна продуктів у замовленні |
| `orderClientChange` | Зміна клієнта в замовленні |
| `startSplitting` | Початок розбивки рахунку |
| `endSplitting` | Кінець розбивки рахунку |
| `beforeOrderClose` | До закриття замовлення |
| `afterOrderClose` | Після закриття замовлення |

### Online Order Events
| Подія | Опис |
|---|---|
| `incomingOrderCreated` | Онлайн-замовлення прийшло на касу |
| `incomingOrderAccepted` | Онлайн-замовлення прийнято |
| `incomingOrderDeclined` | Онлайн-замовлення відхилено |

### App Events
| Подія | Опис |
|---|---|
| `applicationIconClicked` | Клік на іконку додатку |
| `afterPopupClosed` | Після закриття попапу |
| `notificationClick` | Клік на повідомлення |

### User Events
| Подія | Опис |
|---|---|
| `userLogin` | Авторизація юзера |
| `userLogout` | Вихід юзера |

### Fiscal Events
| Подія | Опис |
|---|---|
| `printFiscal` | Фіскальний чек надрукований |
| `failedPrintFiscal` | Помилка друку фіскального чеку |
| `returnFiscal` | Фіскальне повернення |
| `failedReturnFiscal` | Помилка повернення |

### Shift Events
| Подія | Опис |
|---|---|
| `shiftOpen` | Відкриття зміни |
| `shiftClose` | Закриття зміни |
| `finishedCooking` | Страва приготована |

---

## Data Types (POS)

| Тип | URL |
|---|---|
| Order | /en/docs/v3/pos/types/order |
| Online-order | /en/docs/v3/pos/types/incomingOrder |
| Client | /en/docs/v3/pos/types/client |
| User | /en/docs/v3/pos/types/user |
| Product | /en/docs/v3/pos/types/product |
| Category | /en/docs/v3/pos/types/category |
| Cash shift | /en/docs/v3/pos/types/shift |
| Device | /en/docs/v3/pos/types/device |
