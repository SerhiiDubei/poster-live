require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const API = 'https://joinposter.com/api';

// ─── Multi-store support ────────────────────────────────────────────────────
// Priority: STORES_JSON env var → config/stores.json → POSTER_TOKEN single-store
function loadStores() {
  if (process.env.STORES_JSON) {
    try {
      return JSON.parse(process.env.STORES_JSON);
    } catch (err) {
      console.error('STORES_JSON parse error:', err.message);
    }
  }
  const configPath = path.join(__dirname, 'config', 'stores.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  if (process.env.POSTER_TOKEN) {
    return [{ account: 'default', token: process.env.POSTER_TOKEN, label: 'Default Store' }];
  }
  return [];
}

const stores = loadStores();
const storeByAccount = Object.fromEntries(stores.map(s => [s.account, s]));

// Product cache per store: { account: { product_id: name } }
const productCaches = {};

// Порожня відповідь тут — не виняток, а звичайний успішний запит без даних.
// Без ретраю сервер лишився б із порожнім меню до ручного рестарту.
async function loadProductCache(store, attempt = 0) {
  const retry = () => new Promise(r => setTimeout(() => r(loadProductCache(store, attempt + 1)), 5000));
  try {
    const res = await axios.get(`${API}/menu.getProducts?token=${store.token}`);
    const products = res.data.response || [];
    if (products.length === 0 && attempt < 3) {
      console.warn(`[${store.label}] меню порожнє — повтор через 5с (спроба ${attempt + 1}/3)`);
      return retry();
    }
    productCaches[store.account] = {};
    products.forEach(p => {
      const rawPrice = p.spots?.[0]?.price ?? p.price ?? 0;
      productCaches[store.account][String(p.product_id)] = {
        name: p.product_name,
        category: p.category_name || null,
        price: Math.round(rawPrice / 100),
      };
    });
    console.log(`📦 [${store.label}] Кеш завантажено: ${products.length} продуктів`);
  } catch (err) {
    if (attempt < 3) {
      console.warn(`[${store.label}] помилка меню (${err.message}) — повтор через 5с (спроба ${attempt + 1}/3)`);
      return retry();
    }
    console.error(`[${store.label}] Помилка завантаження меню:`, err.message);
  }
}

function getProductInfo(account, productId) {
  const e = productCaches[account]?.[String(productId)];
  return {
    name: e?.name || `Product #${productId}`,
    category: e?.category || null,
  };
}

// Dedupe + polling fallback: persistent set of transaction_ids per store.
// Primed at startup with today's IDs (no broadcast). Both webhook and poller
// call markSeen — first hit broadcasts, subsequent ones are dropped.
const seenTxs = new Map(); // account -> Set<string>

function getSeenSet(account) {
  let s = seenTxs.get(account);
  if (!s) { s = new Set(); seenTxs.set(account, s); }
  return s;
}

function markSeen(account, txId) {
  const set = getSeenSet(account);
  const key = String(txId);
  if (set.has(key)) return false;
  set.add(key);
  return true;
}

let lastTransaction = null;

function broadcast(data) {
  lastTransaction = data;
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

async function fetchTransaction(store, transactionId) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCompact = today.replace(/-/g, '');

  // Two requests in parallel: products + dash details (comment, date_start, table, guests)
  const [txsRes, dashRes] = await Promise.all([
    axios.get(`${API}/transactions.getTransactions?token=${store.token}&date_from=${todayCompact}&date_to=${todayCompact}`),
    axios.get(`${API}/dash.getTransactions?token=${store.token}&dateFrom=${today}&dateTo=${today}&per_page=100`),
  ]);

  const list = txsRes.data.response?.data || [];
  const dashList = dashRes.data.response?.data || dashRes.data.response || [];

  const tx = list.find(t => String(t.transaction_id) === String(transactionId));
  const dash = dashList.find(t => String(t.transaction_id) === String(transactionId));
  return { tx, dash };
}

function durationSeconds(start, end) {
  if (!start || !end) return null;
  const a = new Date(start.replace(' ', 'T'));
  const b = new Date(end.replace(' ', 'T'));
  const diff = Math.round((b - a) / 1000);
  return diff >= 0 ? diff : null;
}

async function processTransaction(store, transactionId, source = 'webhook', opts = {}) {
  if (!markSeen(store.account, transactionId)) return;
  try {
    // Emulated transaction IDs (>900000) — skip real API, generate fake data
    if (Number(transactionId) > 900000) {
      const tx = buildEmulatedTransaction(store.account, store.label,
        Object.keys(productCaches[store.account] || {}).length > 0
          ? Object.entries(productCaches[store.account]).map(([id, info]) => ({ product_id: id, ...info, price: info.price > 0 ? info.price : rand(40, 250) }))
          : FAKE_PRODUCTS,
        { ...opts, transactionId }
      );
      broadcast(tx);
      console.log(`🎭 [${store.label}] (${source}) #${tx.transaction_id} | ${tx.sum} грн | ${tx.products.length} позицій`);
      return;
    }
    const { tx, dash } = await fetchTransaction(store, transactionId);
    if (!tx) {
      // Could not fetch (not closed yet?) — un-mark so a later poll/webhook can retry
      getSeenSet(store.account).delete(String(transactionId));
      return;
    }

    const clientName = dash && (dash.client_firstname || dash.client_lastname)
      ? [dash.client_firstname, dash.client_lastname].filter(Boolean).join(' ').trim()
      : null;

    const result = {
      account: store.account,
      store_label: store.label,
      transaction_id: tx.transaction_id,
      time: tx.date_close,
      date_start: dash?.date_start || null,
      duration_sec: durationSeconds(dash?.date_start, tx.date_close),
      sum: parseFloat(tx.sum),
      payed_cash: parseFloat(tx.payed_cash),
      payed_card: parseFloat(tx.payed_card),
      comment: dash?.transaction_comment || null,
      table: dash?.table_name || null,
      guests: dash?.guests_count != null ? parseInt(dash.guests_count, 10) : null,
      service_mode: dash?.service_mode != null ? parseInt(dash.service_mode, 10) : null,
      client: clientName,
      products: tx.products.map(p => {
        const info = getProductInfo(store.account, p.product_id);
        return {
          product_id: p.product_id,
          name: info.name,
          category: info.category,
          quantity: parseFloat(p.num),
          sum: parseFloat(p.product_sum),
        };
      }),
    };

    broadcast(result);
    console.log(`🛒 [${store.label}] (${source}) #${result.transaction_id} | ${result.sum} грн | ${result.products.length} позицій${result.comment ? ' | 💬' : ''}`);
  } catch (err) {
    getSeenSet(store.account).delete(String(transactionId));
    console.error(`[${store.label}] Помилка:`, err.message);
  }
}

// ─── Polling fallback: catch transactions whose webhook never arrived ──────
async function pollStore(store) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await axios.get(
      `${API}/dash.getTransactions?token=${store.token}&dateFrom=${today}&dateTo=${today}&per_page=200`
    );
    const list = res.data.response?.data || res.data.response || [];
    const seen = getSeenSet(store.account);
    for (const t of list) {
      if (!seen.has(String(t.transaction_id))) {
        await processTransaction(store, t.transaction_id, 'poll');
      }
    }
  } catch (err) {
    console.error(`[${store.label}] poll error:`, err.message);
  }
}

// At startup, prime the seen set with today's transactions so we don't
// re-broadcast everything that already happened before the server came up.
async function primeSeen(store, attempt = 0) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await axios.get(
      `${API}/dash.getTransactions?token=${store.token}&dateFrom=${today}&dateTo=${today}&per_page=500`
    );
    const list = res.data.response?.data || res.data.response || [];
    const set = getSeenSet(store.account);
    list.forEach(t => set.add(String(t.transaction_id)));
    console.log(`✅ [${store.label}] seen primed: ${list.length} transactions`);
  } catch (err) {
    if (attempt < 3) return setTimeout(() => primeSeen(store, attempt + 1), 5000);
    console.error(`[${store.label}] seen prime failed:`, err.message);
  }
}

// ─── Webhook handler ────────────────────────────────────────────────────────
async function handleWebhook(store, req, res) {
  const { object, object_id, action } = req.body;
  res.json({ status: 'accept' });
  if (object !== 'transaction') return;
  // Poster fires added/changed/transformed for the same tx — only react on close.
  if (action && action !== 'changed' && action !== 'transformed') return;
  await processTransaction(store, object_id, 'webhook');
}

// Multi-store: POST /webhook/:account
app.post('/webhook/:account', async (req, res) => {
  const store = storeByAccount[req.params.account];
  if (!store) return res.status(404).json({ error: 'Unknown account' });
  await handleWebhook(store, req, res);
});

// Single-store fallback: POST /webhook (uses first store)
app.post('/webhook', async (req, res) => {
  if (stores.length === 0) return res.status(503).json({ error: 'No stores configured' });
  await handleWebhook(stores[0], req, res);
});

// ─── OAuth callback ─────────────────────────────────────────────────────────
app.get('/oauth/callback', async (req, res) => {
  const { code, account } = req.query;
  if (!code || !account) return res.send('Помилка: немає code або account');

  try {
    const formData = new FormData();
    formData.append('application_id', process.env.POSTER_APP_ID);
    formData.append('application_secret', process.env.POSTER_APP_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', process.env.POSTER_REDIRECT_URI);
    formData.append('code', code);

    const response = await axios.post(
      `https://${account}.joinposter.com/api/v2/auth/access_token`,
      formData
    );

    const { access_token, account_number } = response.data;

    if (!access_token) {
      const msg = 'Помилка: не отримано access_token. Відповідь: ' + JSON.stringify(response.data);
      console.error(msg);
      return res.send(msg);
    }

    console.log(`✅ Акаунт підключено: ${account} (#${account_number}), token: ${access_token.slice(0, 12)}...`);
    res.send(`
      <h2>✅ Акаунт <b>${account}</b> підключено!</h2>
      <p>Token: <code>${access_token.slice(0, 12)}...</code></p>
      <p>Додай до <b>config/stores.json</b>:</p>
      <pre>{ "account": "${account}", "token": "${access_token}", "label": "Назва магазину" }</pre>
      <p>Webhook URL: <code>/webhook/${account}</code></p>
      <a href="/">← Назад</a>
    `);
  } catch (err) {
    console.error('OAuth помилка:', err.response?.data || err.message);
    res.send('Помилка підключення: ' + JSON.stringify(err.response?.data || err.message));
  }
});

// ─── Emulator ───────────────────────────────────────────────────────────────
const FAKE_PRODUCTS = [
  { product_id: 1001, name: 'Еспресо', category: 'Кава', price: 45 },
  { product_id: 1002, name: 'Капучіно', category: 'Кава', price: 65 },
  { product_id: 1003, name: 'Латте', category: 'Кава', price: 75 },
  { product_id: 1004, name: 'Флет Уайт', category: 'Кава', price: 70 },
  { product_id: 1005, name: 'Круасан', category: 'Випічка', price: 55 },
  { product_id: 1006, name: 'Чізкейк', category: 'Десерти', price: 120 },
  { product_id: 1007, name: 'Борщ', category: 'Перші страви', price: 95 },
  { product_id: 1008, name: 'Вареники з картоплею', category: 'Основні', price: 110 },
  { product_id: 1009, name: 'Піца Маргарита', category: 'Піца', price: 185 },
  { product_id: 1010, name: 'Лимонад домашній', category: 'Напої', price: 55 },
  { product_id: 1011, name: 'Чай зелений', category: 'Напої', price: 40 },
  { product_id: 1012, name: 'Сирники', category: 'Сніданки', price: 130 },
  { product_id: 1013, name: 'Авокадо-тост', category: 'Сніданки', price: 115 },
  { product_id: 1014, name: 'Курячий бургер', category: 'Бургери', price: 175 },
  { product_id: 1015, name: 'Картопля фрі', category: 'Гарніри', price: 60 },
];

const FAKE_TABLES = ['Стіл 1', 'Стіл 2', 'Стіл 3', 'Стіл 4', 'Стіл 5', 'Барна стійка', 'Тераса 1', 'Тераса 2'];
const FAKE_COMMENTS = [null, null, null, 'Без цибулі', 'Алергія на горіхи', 'Постійний гість', 'День народження'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// opts.cart — pre-built line items (from /taps). When absent, the basket is random.
// opts.transactionId — keep the id that was already marked as seen, instead of a new one.
function buildEmulatedTransaction(account, label, productPool, opts = {}) {
  const now = new Date();
  const durationSec = rand(180, 2700);
  const dateStart = new Date(now - durationSec * 1000);

  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
                   `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  let products;
  if (opts.cart && opts.cart.length) {
    products = opts.cart;
  } else {
    const count = rand(1, 5);
    const shuffled = [...productPool].sort(() => Math.random() - 0.5).slice(0, count);
    products = shuffled.map(p => {
      const qty = rand(1, 3);
      return { product_id: p.product_id, name: p.name, category: p.category, quantity: qty, sum: p.price * qty };
    });
  }

  const sum = products.reduce((acc, p) => acc + p.sum, 0);
  const payCard = Math.random() > 0.45 ? sum : 0;
  const payCash = payCard === 0 ? sum : 0;

  const serviceMode = rand(1, 3);
  const hasTable = serviceMode === 1;

  return {
    account,
    store_label: label,
    transaction_id: opts.transactionId || 900000 + rand(1, 99999),
    time: fmt(now),
    date_start: fmt(dateStart),
    duration_sec: durationSec,
    sum,
    payed_cash: payCash,
    payed_card: payCard,
    comment: pick(FAKE_COMMENTS),
    table: hasTable ? pick(FAKE_TABLES) : null,
    guests: hasTable ? rand(1, 6) : null,
    service_mode: serviceMode,
    client: null,
    products,
    _emulated: true,
  };
}

// Turn [{product_id, quantity}] from /taps into full line items priced from the menu cache.
function resolveCart(account, items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const cache = productCaches[account] || {};
  const fallback = Object.fromEntries(FAKE_PRODUCTS.map(p => [String(p.product_id), p]));
  return items.map(it => {
    const info = cache[String(it.product_id)] || fallback[String(it.product_id)];
    const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
    const price = info?.price > 0 ? info.price : rand(40, 250);
    return {
      product_id: it.product_id,
      name: info?.name || `Product #${it.product_id}`,
      category: info?.category || null,
      quantity: qty,
      sum: price * qty,
    };
  });
}

app.post('/api/emulate', async (req, res) => {
  const account = req.body?.account || stores[0]?.account || 'emulator';
  const store = storeByAccount[account];
  if (!store) return res.status(404).json({ error: 'No store found' });

  // Generate a fake transaction ID (>900000 triggers emulated path in processTransaction)
  const fakeId = 900000 + rand(1, 99999);
  const cart = resolveCart(account, req.body?.cart);

  // Go through the full webhook pipeline — same path as a real Poster webhook
  await processTransaction(store, fakeId, cart.length ? 'taps' : 'emulate', { cart });

  const tx = lastTransaction;
  res.json({ status: 'ok', transaction_id: tx?.transaction_id, sum: tx?.sum, products: tx?.products });
});

app.get('/emulator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'emulator.html'));
});

app.get('/taps', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'taps.html'));
});

app.get('/viz', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viz.html'));
});

app.get('/maze', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'maze.html'));
});

// ─── Connect API (for external tools: TouchDesigner, MadMapper, etc.) ────────
app.get('/api/products', (req, res) => {
  const account = req.query.account || stores[0]?.account;
  const cache = productCaches[account];
  if (!cache) return res.json({ error: 'No cache for account', account });
  const list = Object.entries(cache).map(([id, info]) => ({ product_id: id, ...info }));
  res.json({ account, count: list.length, products: list });
});

app.post('/api/reload-menu', async (req, res) => {
  const account = req.body?.account || stores[0]?.account;
  const store = storeByAccount[account];
  if (!store) return res.status(404).json({ error: 'Unknown account' });
  await loadProductCache(store);
  const count = Object.keys(productCaches[account] || {}).length;
  res.json({ status: 'ok', account, count });
});

app.get('/api/latest', (req, res) => {
  if (!lastTransaction) return res.status(404).json({ error: 'No transactions yet. Use /emulator to generate one.' });
  res.json(lastTransaction);
});

app.get('/api/schema', (req, res) => {
  res.json({
    transaction_id: 123456,
    account: 'store_account',
    store_label: 'Store Name',
    time: '2024-01-01 12:00:00',
    date_start: '2024-01-01 11:45:00',
    duration_sec: 900,
    sum: 250.00,
    payed_cash: 0,
    payed_card: 250.00,
    comment: null,
    table: 'Стіл 3',
    guests: 2,
    service_mode: 1,
    client: null,
    products: [
      { product_id: 101, name: 'Капучіно', category: 'Кава', quantity: 2, sum: 130 },
      { product_id: 102, name: 'Круасан', category: 'Випічка', quantity: 1, sum: 55 },
    ],
    _emulated: false,
  });
});

app.get('/connect', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connect.html'));
});

// ─── Debug ──────────────────────────────────────────────────────────────────
app.get('/debug', async (req, res) => {
  const info = {
    stores: stores.map(s => ({
      account: s.account,
      label: s.label,
      tokenPrefix: s.token ? s.token.slice(0, 12) + '...' : 'MISSING',
      cachedProducts: Object.keys(productCaches[s.account] || {}).length,
      seen: getSeenSet(s.account).size,
    })),
    pollIntervalSec: POLL_INTERVAL_MS / 1000,
    wsClients: wss.clients.size,
    env: {
      POSTER_APP_ID: process.env.POSTER_APP_ID || 'MISSING',
      POSTER_APP_SECRET: process.env.POSTER_APP_SECRET ? '***set***' : 'MISSING',
      POSTER_REDIRECT_URI: process.env.POSTER_REDIRECT_URI || 'MISSING',
    },
  };
  res.json(info);
});

// ─── Test (re-broadcast latest transaction from a store) ────────────────────
app.get('/test', async (req, res) => {
  const account = req.query.account || stores[0]?.account;
  const store = storeByAccount[account];
  if (!store) return res.json({ error: 'No store found. Pass ?account=yourAccount' });

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const apiRes = await axios.get(
    `${API}/transactions.getTransactions?token=${store.token}&date_from=${today}&date_to=${today}`
  );
  const list = apiRes.data.response?.data || [];
  const tx = list[0];
  if (!tx) return res.json({ error: 'Немає транзакцій сьогодні' });

  // Bypass dedupe for /test
  getSeenSet(store.account).delete(String(tx.transaction_id));
  await processTransaction(store, tx.transaction_id, 'test');
  res.json({ status: 'sent', transaction_id: tx.transaction_id });
});

wss.on('connection', (ws) => {
  console.log('🔌 Клієнт підключився');
  ws.on('close', () => console.log('🔌 Клієнт відключився'));
});

// ─── Start ──────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '30000', 10);

Promise.all(stores.map(loadProductCache)).then(async () => {
  await Promise.all(stores.map(primeSeen));
  for (const s of stores) setInterval(() => pollStore(s), POLL_INTERVAL_MS);

  server.listen(PORT, () => {
    console.log(`🚀 Сервер: http://localhost:${PORT}`);
    stores.forEach(s => {
      console.log(`📡 [${s.label}] Webhook: http://localhost:${PORT}/webhook/${s.account}`);
    });
    console.log(`🔁 Polling fallback: every ${POLL_INTERVAL_MS / 1000}s`);
    console.log(`🧪 Тест: http://localhost:${PORT}/test`);

    // ─── Auto-emulation (enabled via AUTO_EMULATE=true env var) ────────────
    if (process.env.AUTO_EMULATE === 'true' && stores.length > 0) {
      const store = stores[0];
      const scheduleEmulate = () => {
        const delay = rand(15000, 120000);
        setTimeout(async () => {
          const fakeId = 900000 + rand(1, 99999);
          await processTransaction(store, fakeId, 'auto-emulate');
          scheduleEmulate();
        }, delay);
      };
      scheduleEmulate();
      console.log(`🎭 Auto-emulate: ON (15–120s random interval) [${store.label}]`);
    }
  });
});
