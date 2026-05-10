# Poster API — Locations, Finance, Settings

---

## LOCATIONS (spots.)

Source: https://dev.joinposter.com/en/docs/v3/web/spots/index

### spots.getSpots — Список локацій

**GET** `https://joinposter.com/api/spots.getSpots`

```json
{
  "response": [
    { "spot_id": 1, "name": "Cafe on Polyanka", "address": "Kyiv, Polyanka St., 44" },
    { "spot_id": 2, "name": "Lviv Coffee House", "address": "Lviv, Rynok Square, 11" }
  ]
}
```

| Поле | Опис |
|---|---|
| `spot_id` | ID локації |
| `name` | Назва |
| `address` | Адреса |

### spots.getSpot — Дані локації

**GET** `https://joinposter.com/api/spots.getSpot?spot_id={id}`

### spots.getSpotTablesHalls — Зони залу

**GET** `https://joinposter.com/api/spots.getSpotTablesHalls`

### spots.getTableHallTables — Столи

**GET** `https://joinposter.com/api/spots.getTableHallTables`

---

## FINANCE (finance.)

Source: https://dev.joinposter.com/en/docs/v3/web/finance/index

### Зміни каси
| Метод | Опис |
|---|---|
| `finance.getCashShifts` | Список змін |
| `finance.getCashShift` | Дані зміни |
| `finance.openCashShift` | Відкрити зміну |
| `finance.closeCashShift` | Закрити зміну |
| `finance.getCashShiftTransactions` | Транзакції зміни |
| `finance.createCashShiftTransaction` | Створити транзакцію |
| `finance.updateCashShiftTransaction` | Оновити транзакцію |
| `finance.removeCashShiftTransaction` | Видалити транзакцію |

### Фінансові рахунки
| Метод | Опис |
|---|---|
| `finance.getAccounts` | Список рахунків |
| `finance.createAccount` | Створити рахунок |
| `finance.updateAccount` | Оновити рахунок |
| `finance.getCategories` | Категорії рахунків |
| `finance.createCategory` | Нова фінансова категорія |
| `finance.getReport` | Звіт по категорії |

### Податки
| Метод | Опис |
|---|---|
| `finance.getTaxes` | Список податків |
| `finance.getTax` | Дані податку |
| `finance.createTax` | Створити |
| `finance.updateTax` | Оновити |
| `finance.removeTax` | Видалити |

---

## ACCOUNT SETTINGS (settings.)

Source: https://dev.joinposter.com/en/docs/v3/web/settings/index

### settings.getAllSettings — Налаштування акаунту

**GET** `https://joinposter.com/api/settings.getAllSettings`

| Поле | Опис |
|---|---|
| `COMPANY_ID` | Логін акаунту |
| `FIZ_ADRESS_CITY` | Адреса закладу |
| `FIZ_ADRESS_PHONE` | Телефон |
| `uses_tables` | Використовує план столів: `0`/`1` |
| `uses_cash_shifts` | Використовує зміни каси: `0`/`1` |
| `uses_taxes` | Використовує податки: `0`/`1` |
| `uses_multiprice` | Різні ціни по локаціях: `0`/`1` |
| `tip_amount` | Розмір сервісного збору (%) |
| `uses_bookkeeping` | Бухгалтерія: `0`/`1` |
| `uses_manufacturing` | Виробництво: `0`/`1` |
| `company_name` | Назва закладу |
| `company_type` | `1`=кафе, `2`=магазин |
| `timezones` | Часовий пояс |
| `logo` | Шлях до логотипу |
| `lang` | Мова (ISO 639; UA = `ua`) |
| `pos_phone` | Телефон власника |
| `uses_fiscality` | Фіскалізація: `0`/`1` |
| `email` | Email власника |
| `currency` | Об'єкт валюти |

### `currency` об'єкт

| Поле | Опис |
|---|---|
| `currency_id` | ID валюти |
| `currency_name` | Назва валюти |
| `currency_code` | Код на касі |
| `currency_symbol` | Unicode символ (напр. `₴`) |
| `currency_code_iso` | ISO 4217 код (напр. `UAH`) |

### Способи оплати
| Метод | Опис |
|---|---|
| `settings.getPaymentMethods` | Список способів оплати |
| `settings.getPaymentMethod` | Дані способу |
| `settings.createPaymentMethod` | Створити |
| `settings.updatePaymentMethod` | Оновити |
| `settings.removePaymentMethod` | Видалити |

### Джерела замовлень
| Метод | Опис |
|---|---|
| `settings.getOrderSources` | Список джерел |
| `settings.getOrderSource` | Дані джерела |

---

## ACCESS (access.)

Source: https://dev.joinposter.com/en/docs/v3/web/access/index

| Метод | Опис |
|---|---|
| `access.getEmployees` | Список працівників |
| `access.createEmployee` | Створити |
| `access.updateEmployee` | Оновити |
| `access.getTablets` | Список кас |
| `access.updateTablet` | Оновити касу |
| `access.getSpots` | Список локацій (з налаштуваннями) |
| `access.updateSpot` | Оновити локацію |
