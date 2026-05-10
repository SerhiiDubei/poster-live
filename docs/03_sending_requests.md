# Poster API — Формат запитів

Source: https://dev.joinposter.com/en/docs/v3/start/request

## Загальний формат URL

```
https://joinposter.com/api/{method}?format={format}&token={token}&param1=val1&param2=val2
```

| Параметр | Опис |
|---|---|
| `method` | Назва API методу, напр. `clients.getGroups` |
| `token` | Access token авторизації |
| `format` | Необов'язковий. `xml` або `json`. За замовчуванням: `json` |
| `param`, `val` | Додаткові параметри, індивідуальні для кожного методу |

## Протокол

Всі запити — HTTPS (GET або POST).
Майже всі методи Web API потребують `token` як GET-параметр.
Виняток — методи авторизації.

## Формат відповіді

Відповідь завжди містить або `response` (успіх), або `error` (помилка):

### Успішна відповідь
```json
{
  "response": {
    "client_groups_id": "1",
    "client_groups_name": "Favourite customer",
    "loyalty_type": "1",
    "client_groups_discount": "10"
  }
}
```

### Відповідь з помилкою
```json
{
  "error": {
    "code": 11,
    "message": "Bad access token"
  }
}
```

## Приклад GET запиту (cURL)

```bash
curl "https://joinposter.com/api/clients.getGroup?format=json&token=687409:4164553abf6a031302898da7800b59fb&group_id=1"
```

## Приклад POST запиту (cURL)

```bash
curl -X POST "https://joinposter.com/api/orders?token=687409:4164553abf6a031302898da7800b59fb" \
  -H "Content-Type: application/json" \
  -d '{"spotId": 1, "products": [{"id": 25, "count": 1}]}'
```

## Важливо

- **Ціни** зберігаються у мінімальних одиницях валюти (копійки, центи). Напр., `19000` = 190.00 грн
- **Token** формат: `{account_number}:{token_hash}`, напр. `687409:4164553abf6a031302898da7800b59fb`
- POST-запити приймають JSON body з `Content-Type: application/json`
- User-Agent рекомендується: `Poster (http://joinposter.com)`
