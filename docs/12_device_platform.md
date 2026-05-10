# Poster API — Device Platform

Source: https://dev.joinposter.com/en/docs/v3/device/index

Device Platform дозволяє підключати або створювати віртуальні пристрої:
- Термопринтери
- Фіскальні принтери
- Платіжні термінали

---

## Getting Started

1. Увімкнути **Device Platform** у налаштуваннях Application
2. Реалізувати обробники команд від Poster

Docs: https://dev.joinposter.com/en/docs/v3/device/start

---

## Thermal Printer (printer.)

| Метод | Опис | HTTP |
|---|---|---|
| `printer.getAll` | Отримати список принтерів | GET |
| `printer.printText` | Надрукувати текст | POST |

---

## Fiscal Printer (fiscal.)

| Метод | Опис | HTTP |
|---|---|---|
| `fiscal.create` | Створити фіскальний принтер | POST |
| `fiscal.getAllFiscal` | Список всіх пристроїв | GET |
| `fiscal.getDevice` | Дані пристрою | GET |
| `fiscal.setDefault` | Встановити як принтер за замовч. | POST |
| `fiscal.setOnline` | Встановити пристрій онлайн | POST |
| `fiscal.printFiscalReceipt` | Надрукувати фіскальний чек | POST |
| `fiscal.printFiscalRefund` | Надрукувати фіскальне повернення | POST |
| `fiscal.printXReport` | Надрукувати X-звіт | POST |
| `fiscal.printZReport` | Надрукувати Z-звіт | POST |
| `fiscal.printPeriodicReport` | Надрукувати звіт за період | POST |
| `fiscal.printCashFlow` | Фіскальний прихід/витрата | POST |

---

## Payment Terminal (payTerminal.)

| Метод | Опис | HTTP |
|---|---|---|
| `payTerminal.validateDevice` | Пошук пристрою в мережі | GET |
| `payTerminal.createPayTerminal` | Створити термінал | POST |
| `payTerminal.makePayment` | Здійснити оплату | POST |
| `payTerminal.revertPayment` | Скасувати оплату | POST |
| `payTerminal.XReport` | X-звіт | POST |
| `payTerminal.ZReport` | Z-звіт | POST |
| `payTerminal.interrupt` | Перервати оплату | POST |
