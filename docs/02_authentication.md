# Poster API — Авторизація (OAuth2)

Source: https://dev.joinposter.com/en/docs/v3/start/authApi

## Протокол: OAuth2

Результат авторизації — `access_token` для API-запитів. Токен дійсний **2 роки**.

---

## Step 1 — Редирект на Poster

```
https://joinposter.com/api/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code
```

Якщо відомий логін акаунту:
```
https://{account}.joinposter.com/api/auth?application_id={application_id}&redirect_uri={redirect_uri}&response_type=code
```

| Параметр | Значення |
|---|---|
| `application_id` | ID додатку з developer account |
| `redirect_uri` | URL повернення після авторизації (має точно збігатись з налаштуваннями) |
| `response_type` | `code` |

---

## Step 2 — Отримання code

Після входу і підтвердження дозволів юзер редиректиться на:
```
{redirect_uri}?code={code}&account={account}
```

| Параметр | Значення |
|---|---|
| `code` | 32-символьний код для Step 3 |
| `account` | Логін акаунту в Poster (використовувати для всіх наступних запитів) |

---

## Step 3 — Отримання access_token

**POST** `https://{account}.joinposter.com/api/v2/auth/access_token`

Body: `form-data`

```php
<?php
$account = $_GET['account'];
$code    = $_GET['code'];

$url  = "https://$account.joinposter.com/api/v2/auth/access_token";
$auth = [
    'application_id'     => 76,
    'application_secret' => '9642176a5cdfe3f65e6e00c27b668795',
    'grant_type'         => 'authorization_code',
    'redirect_uri'       => 'http://localhost:8080/',
    'code'               => $code,
];
$data = sendRequest($url, 'post', $auth);
```

### POST параметри

| Параметр | Значення |
|---|---|
| `application_id` | ID додатку |
| `application_secret` | Secret з developer account |
| `code` | Код з Step 2 |
| `grant_type` | `authorization_code` |
| `redirect_uri` | Має точно збігатись з налаштуваннями |

---

## Успішна відповідь

```json
{
  "access_token": "861052:02391570ff9af128e93c5a771055ba88",
  "account_number": "861052",
  "user": {
    "id": 4,
    "name": "Poster",
    "email": "dev@joinposter.com",
    "role_id": 3
  },
  "ownerInfo": {
    "email": "dev@joinposter.com",
    "phone": "+380684152664",
    "city": "",
    "country": "RU",
    "name": "Poster",
    "company_name": "dev-example"
  },
  "tariff": {
    "key": "pricing-plan-1",
    "next_pay_date": "2018-05-31 11:52:41",
    "price": 2
  }
}
```

| Параметр | Опис |
|---|---|
| `access_token` | Токен для API. Дійсний 2 роки. |
| `account_number` | Унікальний ідентифікатор акаунту в Poster |
| `user` | Об'єкт з даними працівника, що встановив додаток |
| `ownerInfo` | Об'єкт з даними власника акаунту |
| `tariff` | Інфо про тариф (якщо додаток прив'язаний до billing) |

### Об'єкт `user`
| Параметр | Опис |
|---|---|
| `id` | ID працівника в Poster |
| `name` | Ім'я працівника |
| `email` | Email |
| `role_id` | Роль. Власник акаунту: `role_id=3` |

### Об'єкт `ownerInfo`
| Параметр | Опис |
|---|---|
| `email` | Email власника |
| `phone` | Телефон |
| `city` | Місто |
| `country` | Код країни ISO 3166 (2 символи) |
| `name` | Ім'я |
| `company_name` | Назва закладу |

### Об'єкт `tariff`
| Параметр | Опис |
|---|---|
| `key` | Унікальний ключ тарифу |
| `date_trial` | Кількість тріал-днів |
| `next_pay_date` | Оплачено до (Y-m-d H:i:s) |
| `price` | Ціна тарифу в USD |
| `name` | Назва тарифу |

---

## Помилка авторизації

| Параметр | Опис |
|---|---|
| `code` | Код помилки |
| `error_type` | Тип помилки |
| `error_message` | Читабельне повідомлення |
