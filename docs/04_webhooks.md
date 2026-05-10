# Poster API — Webhooks

Source: https://dev.joinposter.com/en/docs/v3/web/webhooks

## Що таке Webhooks

Дозволяють миттєво отримувати інформацію про зміни об'єктів у Poster (нова позиція меню, закритий чек тощо).

## Налаштування

1. В developer account → **Applications → Poster for Developers** → **Edit**
2. В розділі **Webhooks** обрати сутності та вказати URL для надсилання
3. Підключити додаток до акаунту, з якого очікуєте webhooks
4. Будь-яка зміна сутності тригерить webhook

## Структура Webhook

```json
{
  "account": "api-demo",
  "account_number": "813932",
  "object": "transaction",
  "object_id": 1,
  "action": "added",
  "time": "1518794257",
  "verify": "a23sk3d9123ka31sd3k5asd9123sad93"
}
```

| Параметр | Опис |
|---|---|
| `account` | Логін акаунту, що створив подію |
| `account_number` | Номер акаунту |
| `object` | Сутність для якої спрацював webhook |
| `object_id` | Primary key об'єкту |
| `action` | Дія: `added`, `changed`, `removed`, `transformed` |
| `time` | Час відправки (Unix timestamp) |
| `verify` | Підпис запиту — md5 хеш з полів + secret |
| `data` | Додатковий параметр для деяких сутностей |

## Верифікація запиту (PHP приклад)

```php
// Ваш application secret
$client_secret = 'fe2bc8e865d8fc2236968ee53c3b2bd5';

$postJSON = file_get_contents('php://input');
$postData = json_decode($postJSON, true);

$verify_original = $postData['verify'];
unset($postData['verify']);

$verify = [
    $postData['account'],
    $postData['object'],
    $postData['object_id'],
    $postData['action'],
];

if (isset($postData['data'])) {
    $verify[] = $postData['data'];
}
$verify[] = $postData['time'];
$verify[] = $client_secret;

$verify = md5(implode(';', $verify));

if ($verify != $verify_original) {
    exit; // Невалідний запит
}

// Обов'язково відповісти, інакше Poster буде повторювати
echo json_encode(['status' => 'accept']);
```

> Webhook потребує відповіді HTTP 200. Інакше Poster повторюватиме до **15 разів протягом 2 днів**.

---

## Список сутностей для підписки

### Orders (Замовлення)
| Сутність | Опис |
|---|---|
| `transaction` | Замовлення |
| `incoming_order` | Онлайн-замовлення і резервації |

**`incoming_order`**: при `changed` включає `data`:
- `type`: `1` = online order, `2` = reservation

### Menu (Меню)
| Сутність | Опис |
|---|---|
| `product` | Продукти |
| `dish` | Страви |
| `category` | Категорії продуктів і страв |
| `prepack` | Напівфабрикати |
| `ingredient` | Інгредієнти |
| `workshop` | Цехи |
| `ingredients_category` | Категорії інгредієнтів |

### Marketing
| Сутність | Опис |
|---|---|
| `client` | Клієнти |
| `client_payed_sum` | Закриття замовлення з прив'язаним клієнтом |
| `clients_group` | Групи клієнтів |
| `promotion` | Акції |
| `promotion_prize` | Накопичення по акції |
| `client_ewallet` | Депозити клієнтів |
| `loyalty_rule` | Правила переходу між групами |

**`client_ewallet`** включає `data`:
- `value_relative`: зміна балансу депозиту
- `value_absolute`: фінальна сума на депозиті

### Warehouse (Склад)
| Сутність | Опис |
|---|---|
| `storage` | Склади |
| `stock` | Залишки продуктів/інгредієнтів |
| `supply` | Постачання |

**`stock`** включає `data`:
- `type`: `1`=ingredient, `2`=product, `3`=modifier, `4`=produced dish, `5`=produced semi-finished
- `element_id`: PK об'єкту
- `storage_id`: PK складу
- `value_relative`: зміна кількості
- `value_absolute`: фінальна кількість

### Finance
| Сутність | Опис |
|---|---|
| `book_transaction` | Фінансові транзакції |
| `cash_shift_transaction` | Касові транзакції |

### Access
| Сутність | Опис |
|---|---|
| `spot` | Заклади |
| `register` | Каси |
| `waiter` | Офіціанти |

### Settings & Applications
| Сутність | Опис |
|---|---|
| `configs` | Налаштування |
| `application` | Встановлення/видалення додатку |

**`application`** включає `data`:
- `user_id`: ID працівника, що встановив
- `access_token`: токен (при `action=added`)

---

## Чеклист якщо webhooks не приходять

1. URL відповідає HTTP 200 і приймає POST?
2. Зелена галочка при тестуванні в Poster for Developers?
3. Підписані на потрібні сутності?
4. Додаток підключений до акаунту з якого очікуєте webhooks?
5. Якщо попередні webhooks не отримали 200 — прийміть старі, і нові почнуть приходити
6. Крайній захід: видаліть всі сутності з **Receive webhooks by**, збережіть, додайте знову
