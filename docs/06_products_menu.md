# Poster API — Products / Menu

Source: https://dev.joinposter.com/en/docs/v3/web/menu/index

Всі методи починаються з `menu.`

---

## menu.getProducts — Список продуктів і страв

**GET** `https://joinposter.com/api/menu.getProducts`

### GET параметри

| Параметр | Опис |
|---|---|
| `category_id` | ID категорії продукту (необов'язково) |
| `type` | `products` — продукти, `batchtickets` — страви (необов'язково) |

### Поля відповіді (`response[]`)

| Поле | Опис |
|---|---|
| `product_id` | ID продукту |
| `product_name` | Назва |
| `type` | Тип: `1`=напівфабрикат, `2`=страва, `3`=продукт |
| `menu_category_id` | ID категорії |
| `category_name` | Назва категорії |
| `cost` | Собівартість у мінімальних одиницях (копійки) |
| `cost_netto` | Собівартість без ПДВ (якщо увімкнено) |
| `fiscal` | Фіскальний статус: `0`=ні, `1`=так |
| `workshop` | ID цеху |
| `nodiscount` | Знижки: `0`=не застосовувати, `1`=застосовувати |
| `photo` | Фото продукту |
| `photo_origin` | Оригінал фото |
| `product_code` | SKU |
| `sort_order` | Порядок сортування |
| `tax_id` | ID податку |
| `weight_flag` | Продається по вазі: `0`=ні, `1`=так |
| `color` | Колір картки на касі |
| `barcode` | Штрихкод |
| `unit` | Одиниця виміру |
| `ingredient_id` | ID інгредієнту (якщо продукт) |
| `cooking_time` | Час готування страви (секунди) |
| `out` | Кількість на виході (для страв) |
| `spots` | Масив локацій |
| `sources` | Масив джерел замовлень |
| `modifications` | Модифікатори (для продуктів) |
| `group_modifications` | Групові модифікатори (для страв) |
| `ingredients` | Склад страви (інгредієнти) |

### `spots[]` — Локації

| Поле | Опис |
|---|---|
| `spot_id` | ID локації |
| `price` | Ціна в мінімальних одиницях |
| `profit` | Чистий прибуток |
| `profit_netto` | Прибуток без ПДВ |
| `visible` | Видимість: `0`=не видно, `1`=видно |

### `sources[]` — Джерела замовлень

| Поле | Опис |
|---|---|
| `id` | ID джерела |
| `name` | Назва джерела |
| `price` | Ціна для цього джерела |
| `visible` | `0`/`1` |

### `group_modifications[]` — Групові модифікатори страви

| Поле | Опис |
|---|---|
| `dish_modification_group_id` | ID групи |
| `name` | Назва групи |
| `num_min` | Мінімальна кількість |
| `num_max` | Максимальна кількість |
| `is_deleted` | `0`/`1` |
| `modifications[]` | Масив модифікацій |

### `modifications[]` у групі

| Поле | Опис |
|---|---|
| `dish_modification_id` | ID модифікації |
| `name` | Назва |
| `ingredient_id` | ID інгредієнту |
| `type` | `1`=product, `2`=dish, `3`=prepack, `8`=product modification, `10`=ingredient, `0`=no ingredients |
| `brutto` | Брутто |
| `price` | Ціна |

### `ingredients[]` — Склад страви

| Поле | Опис |
|---|---|
| `structure_id` | ID елементу страви |
| `ingredient_id` | ID інгредієнту |
| `ingredient_name` | Назва інгредієнту |
| `ingredient_unit` | Одиниця: `l`=літри, `kg`=кг, `p`=штуки |
| `structure_type` | `1`=інгредієнт, `2`=напівфабрикат |
| `structure_brutto` | Брутто |
| `structure_netto` | Нетто |

---

## menu.getCategories — Список категорій

**GET** `https://joinposter.com/api/menu.getCategories`

---

## menu.createProduct — Створити продукт

**POST** `https://joinposter.com/api/menu.createProduct`

---

## menu.createDish — Створити страву

**POST** `https://joinposter.com/api/menu.createDish`

---

## menu.getIngredients — Список інгредієнтів

**GET** `https://joinposter.com/api/menu.getIngredients`

---

## menu.getWorkshops — Список цехів (станцій)

**GET** `https://joinposter.com/api/menu.getWorkshops`

---

## Типи продуктів

| Значення `type` | Тип |
|---|---|
| `1` | Напівфабрикат (prepack) |
| `2` | Страва (dish) |
| `3` | Продукт (product/товар) |
