# Poster API — Повний індекс ендпоінтів

Base URL: `https://joinposter.com/api/`
Docs: https://dev.joinposter.com/en/docs/v3/start/index

## Формат запитів
```
GET  https://joinposter.com/api/{method}?format=json&token={token}&param=val
POST https://joinposter.com/api/{method}?token={token}   (body: JSON або form-data)
```

---

## START — Налаштування

| Сторінка | URL |
|---|---|
| Introduction | /en/docs/v3/start/index |
| Developer Account | /en/docs/v3/start/account |
| Sending requests | /en/docs/v3/start/request |
| Authorization in API (OAuth2) | /en/docs/v3/start/authApi |
| FAQ | /en/docs/v3/start/faq |
| Apps Marketplace | /en/docs/v3/market/index |

---

## WEB API

### Webhooks & Errors
| Метод | URL |
|---|---|
| Webhooks | /en/docs/v3/web/webhooks |
| Error Codes | /en/docs/v3/web/errors |

### Reports (dash.)
| Метод | Опис |
|---|---|
| dash.getTransaction | Transaction Receiving |
| dash.getTransactions | Transaction List |
| dash.getTransactionProducts | List of Transaction Products |
| dash.getTransactionsProducts | List of products for all transactions |
| dash.getTransactionHistory | Transaction History |
| dash.getTransactionWriteOffs | Order Wastes |
| dash.getAnalytics | Sales Reports |
| dash.getProductsSales | Product Sales |
| dash.getCategoriesSales | Category Sales |
| dash.getClientsSales | Customer Sales |
| dash.getWaitersSales | Waiter Sales |
| dash.getSpotsSales | Location Sales |
| dash.getPaymentsReport | Billing Reports by Days/Months |

### Products (menu.)
| Метод | Опис |
|---|---|
| menu.getCategories | List of Product Categories |
| menu.getCategory | Product Category Properties |
| menu.createCategory | Create a Product Category |
| menu.updateCategory | Update the Product Category Properties |
| menu.removeCategory | Remove a Product Category |
| menu.recoverCategory | Recover a Product Category |
| menu.getProducts | List of Products and Dishes |
| menu.getProduct | Product or Dish Properties |
| menu.createProduct | Create a Product |
| menu.updateProduct | Update the Product Properties |
| menu.removeProduct | Remove a Product |
| menu.recoverProduct | Recover a Product |
| menu.createDish | Create a Dish |
| menu.updateDish | Update Dish Properties |
| menu.removeDish | Remove a Dish |
| menu.recoverDish | Recover a Dish |
| menu.getPrepacks | List of Semi-Finished Products |
| menu.getPrepack | The Semi-Finished Product Properties |
| menu.createPrepack | Create a Semi-Finished Product |
| menu.updatePrepack | Update the Semi-Finished Product Properties |
| menu.removePrepack | Remove a Semi-Finished Product |
| menu.getIngredients | List of Ingredients |
| menu.getIngredient | Ingredient Properties |
| menu.createIngredients | Create list of Ingredients |
| menu.createIngredient | Create an Ingredient |
| menu.updateIngredients | Update list of Ingredients |
| menu.updateIngredient | Update Ingredient Properties |
| menu.removeIngredient | Remove an Ingredient |
| menu.getCategoriesIngredients | List of Ingredient Categories |
| menu.getCategoryIngredients | Ingredient Category Properties |
| menu.createCategoryIngredients | Create an Ingredient Category |
| menu.updateCategoryIngredients | Update the Ingredient Category Properties |
| menu.removeCategoryIngredients | Remove the Ingredient Category |
| menu.getWorkshops | List of Stations |
| menu.getWorkshop | Station Properties |
| menu.createWorkshop | Create a Station |
| menu.updateWorkshop | Update Station Properties |
| menu.removeWorkshop | Remove a Station |

### Storage
| Метод | Опис |
|---|---|
| storage.getManufactures | List of Manufactures |
| storage.getManufacture | Manufacture Data |
| storage.getManufacturesWriteOffs | Manufacture Wastes |
| storage.createManufacture | Create a Manufacture |
| storage.updateManufacture | Update Manufacture Data |
| storage.deleteManufacture | Delete Manufacture |
| storage.getMoves | Get All Transfers |
| storage.getMove | Get the Transfer Content |
| storage.createMoving | Create a Transfer |
| storage.updateMoving | Update a Transfer |
| storage.deleteMoving | Remove a Transfer |
| storage.getSupplies | Get All Supplies |
| storage.getSupply | Get Supply |
| storage.getSupplyIngredients | Get the Supply Ingredients |
| storage.createSupply | Create Supply |
| storage.updateSupply | Update Supply |
| storage.deleteSupply | Remove Supply |
| storage.getSuppliers | Get all Suppliers |
| storage.createSupplier | Create a Supplier |
| storage.getIngredientWriteOff | Get Non-Manual Wastes |
| storage.createWriteOff | Create a Waste |
| storage.updateWriteOff | Update a Waste |
| storage.deleteWriteOff | Remove a Waste |
| storage.getPacks | List of Packs |
| storage.getPack | Get a Pack |
| storage.createPack | Create a Pack |
| storage.getWastes | List of Manual Wastes |
| storage.getWaste | Manual Waste Data |
| storage.getWasteReasons | List of Waste Reasons |
| storage.getInventoryIngredients | Get an Ingredient Inventory Check |
| storage.getStorageInventories | Get the Storage Inventory History |
| storage.getStorageLeftovers | Get all the Storage Inventories |
| storage.getStorages | Get All Storages |
| storage.getStorage | Get Storage |
| storage.createStorage | Create Storage |
| storage.updateStorage | Update Storage |
| storage.getReportMovement | Ingredients movements |
| storage.getButcheries | Get Butchery List |
| storage.getButchery | Get Butchery |
| storage.createButchery | Create Butchery |
| storage.updateButchery | Edit Butchery |
| storage.deleteButchery | Delete Butchery |

### Marketing / Clients (clients.)
| Метод | Опис |
|---|---|
| clients.getClients | List of Customers |
| clients.getClient | Customer Properties |
| clients.createClient | Create a Customer |
| clients.createClients | Create Group of Customers |
| clients.updateClient | Update Customer Properties |
| clients.removeClient | Remove a Customer |
| clients.removeClients | Remove a Group of Customers |
| clients.getClientPrizes | List of Products Issued by Promotions |
| clients.changeClientBonus | Update the Customer Points Count |
| clients.changeClientPayedSum | Update the Customer Total Purchase Sum |
| clients.getClientsAccumulations | Client's Accumulations for Promotion |
| clients.addClientsAccumulations | Update Client's Accumulations for Promotion |
| clients.getPromotions | List of Promotions |
| clients.getPromotion | Promotion Properties |
| clients.removePromotion | Remove Promotion |
| clients.getGroups | List of Customer Groups |
| clients.addEWalletPayment | Customer's e-Wallet top up |
| clients.addEWalletTransaction | Withdrawal from a Customer's e-Wallet |
| clients.getGroup | Customer Group Properties |
| clients.createGroup | Create a Customer Group |
| clients.updateGroup | Update the Customer Group Properties |
| clients.removeGroup | Remove a Customer Group |
| clients.getLoyaltyRules | Loyalty Rules |
| clients.createLoyaltyRules | Create Loyalty Rules |
| clients.updateLoyaltyRules | Update Loyalty Rules |
| clients.removeLoyaltyRules | Remove Loyalty Rules |
| clients.sendSms | Send an SMS from the Account |
| clients.feedbacks | Add Feedback |
| clients.getFeedbacksStats | Get Feedbacks Stats |
| clients.set1cClientId | Update the Customer ID in the 1C System |

### Orders (transactions.)
| Метод | Опис |
|---|---|
| transactions.getTransactions | Order List |
| transactions.getTransactionsWriteOffs | Order Wastes |
| transactions.getTransactionDishComposition | The Sold Dish Recipe |
| POST /api/orders | Create an Order (новий) |
| transactions.createTransaction | Create an Order (deprecated) |
| transactions.addTransactionProduct | Add a Product to an Order |
| transactions.changeTransactionProductCount | Update the Order Product Count |
| transactions.removeTransactionProduct | Remove a Product from an Order |
| transactions.changeClient | Add a Customer to an Order |
| transactions.changeComment | Add an Order Comment |
| transactions.changeFiscalStatus | Change fiscal status |
| transactions.closeTransaction | Close an Order |
| transactions.removeTransaction | Remove an Order |
| transactions.updateTransaction | Changing a delivery order |
| transactions.changeProductComment | Update Product Comment |

### Online Orders & Reservation (incomingOrders.)
| Метод | Опис |
|---|---|
| incomingOrders.createIncomingOrder | Create an Online Order |
| incomingOrders.getIncomingOrders | Online Order List |
| incomingOrders.getIncomingOrder | Online Order Properties |
| incomingOrders.getOwnIncomingOrders | Online Order List from your Application |
| incomingOrders.getOwnIncomingOrder | Online Order Properties from your Application |
| incomingOrders.createReservation | Create Reservation |
| incomingOrders.getTablesForReservation | Get Tables for Reservation |
| incomingOrders.getReservations | Reservation List |
| incomingOrders.getReservation | Reservation Properties |
| incomingOrders.getOwnReservations | Reservation List from your Application |
| incomingOrders.getOwnReservation | Reservation Properties from your Application |

### Locations (spots.)
| Метод | Опис |
|---|---|
| spots.getSpots | Locations List |
| spots.getSpot | Get a Location |
| spots.getSpotTablesHalls | Floor Sections List |
| spots.getTableHallTables | Table List |

### Finance (finance.)
| Метод | Опис |
|---|---|
| finance.getCashShifts | Register Shift List |
| finance.getCashShift | Register Shift Properties |
| finance.openCashShift | Open a Register Shift |
| finance.closeCashShift | Close a Register Shift |
| finance.getCashShiftTransactions | A Register Shift Transaction List |
| finance.getCashShiftTransaction | Register Shift Transaction Properties |
| finance.createCashShiftTransaction | Create a Register Shift Transaction |
| finance.updateCashShiftTransaction | Update the Register Shift Transaction Properties |
| finance.removeCashShiftTransaction | Remove the Register Shift Transaction |
| finance.getTransactions | Get All Transactions |
| finance.getTransaction | Get Transaction |
| finance.createTransactions | Create a New Transaction |
| finance.updateTransactions | Update a Transaction |
| finance.getAccounts | Get Accounts |
| finance.getAccount | Get Account Properties |
| finance.createAccount | Create a New Account |
| finance.updateAccount | Update an Account |
| finance.getCategories | Get an Account Category List |
| finance.createCategory | Create a New Financial Category |
| finance.updateCategory | Update a Financial Category |
| finance.getReport | Category Report |
| finance.getTaxes | Tax List |
| finance.getTax | Tax Properties |
| finance.createTax | Create a Tax |
| finance.updateTax | Update Tax Properties |
| finance.removeTax | Remove a Tax |

### Access (access.)
| Метод | Опис |
|---|---|
| access.getEmployees | Employee List |
| access.createEmployee | Create an Employee |
| access.updateEmployee | Update Employee Properties |
| access.getTablets | Register List |
| access.updateTablet | Update Register Properties |
| access.getSpots | Locations List |
| access.updateSpot | Update Location Properties |

### Account Settings (settings.)
| Метод | Опис |
|---|---|
| settings.getAllSettings | Account Settings |
| settings.changeSettings | Update Properties of Customer Account Settings |
| settings.getOrderSources | Get an Order Sources List |
| settings.getOrderSource | Get an Order Source |
| settings.getPaymentMethods | Get a Payment Methods List |
| settings.getPaymentMethod | Get a Payment Method |
| settings.createPaymentMethod | Create a New Payment Method |
| settings.updatePaymentMethod | Update a Payment Method |
| settings.removePaymentMethod | Remove a Payment Method |

### Application (application.)
| Метод | Опис |
|---|---|
| application.setEntityExtras | Update Additional Entity Data |
| application.deleteEntityExtras | Delete Additional Entity Data |
| application.getInfo | Get application data |
| application.changeTariff | Changing the application tariff plan |

### Franchises
| Метод | Опис |
|---|---|
| franchise.getSpots | List of Franchisee Locations |

---

## POS Platform (JavaScript SDK)
Docs: /en/docs/v3/pos/index

### Requests
- `PosterJS.makeRequest` — Cross Domain Request
- `PosterJS.makeApiRequest` — Poster API Request

### Interface
- `interface.popup` — Show a Popup
- `interface.closePopup` — Close the Popup
- `interface.showApplicationIconAt` — Show the Application Icon
- `interface.scanBarcode` — Scan a Barcode or a QR Code
- `interface.showNotification` — Show a Popup Notification
- `interface.showManageRightsModal` — Show an Admin Password Modal

### Orders (POS)
- `orders.create` / `orders.getActive` / `orders.addProduct`
- `orders.changeProductCount` / `orders.setOrderClient`
- `orders.setOrderBonus` / `orders.setOrderComment`
- `orders.printReceipt` / `orders.setPrintText`
- `orders.setExtras` / `orders.sendToKitchen`

### Events (POS)
- `orderOpen`, `orderProductChange`, `orderClientChange`
- `beforeOrderClose`, `afterOrderClose`
- `incomingOrderCreated`, `incomingOrderAccepted`, `incomingOrderDeclined`
- `userLogin`, `userLogout`
- `shiftOpen`, `shiftClose`
- `printFiscal`, `failedPrintFiscal`, `returnFiscal`, `failedReturnFiscal`
- `applicationIconClicked`, `afterPopupClosed`, `notificationClick`
- `startSplitting`, `endSplitting`, `finishedCooking`

---

## Device Platform
Docs: /en/docs/v3/device/index

### Thermal Printer
- `printer.getAll` — Get Printers
- `printer.printText` — Print Text

### Fiscal Printer
- `fiscal.create` / `fiscal.getAllFiscal` / `fiscal.getDevice`
- `fiscal.setDefault` / `fiscal.setOnline`
- `fiscal.printFiscalReceipt` / `fiscal.printFiscalRefund`
- `fiscal.printXReport` / `fiscal.printZReport`
- `fiscal.printPeriodicReport` / `fiscal.printCashFlow`

### Payment Terminal
- `payTerminal.validateDevice` / `payTerminal.createPayTerminal`
- `payTerminal.makePayment` / `payTerminal.revertPayment`
- `payTerminal.XReport` / `payTerminal.ZReport` / `payTerminal.interrupt`
