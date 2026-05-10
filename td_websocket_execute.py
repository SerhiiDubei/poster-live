import json

DELAY_MS = 600  # ms between each product drop

def onReceiveText(dat, rowIndex, message, bytes, timeStamp):
    try:
        data = json.loads(message)
    except Exception:
        return

    products = data.get('products', [])
    if not products:
        return

    max_qty = max(p['quantity'] for p in products)
    if max_qty == 0:
        max_qty = 1

    # Rebuild full products table immediately
    table = op('products')
    table.clear()
    table.appendRow(['name', 'quantity', 'quantity_norm'])
    for p in products:
        norm = round(p['quantity'] / max_qty, 4)
        table.appendRow([p['name'], p['quantity'], norm])

    store('last_sum', data.get('sum', 0))

    # Fire each product as a separate delayed pulse
    for i, p in enumerate(products):
        norm = round(p['quantity'] / max_qty, 4)
        run(
            "store('drop_name', args[0]); store('drop_norm', args[1]); op('trigger').par.triggerpulse.pulse()",
            p['name'], norm,
            delayMilliSeconds=i * DELAY_MS
        )
