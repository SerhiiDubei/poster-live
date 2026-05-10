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

async function loadProductCache(store) {
  try {
    const res = await axios.get(`${API}/menu.getProducts?token=${store.token}`);
    const products = res.data.response || [];
    productCaches[store.account] = {};
    products.forEach(p => {
      productCaches[store.account][String(p.product_id)] = p.product_name;
    });
    console.log(`📦 [${store.label}] Кеш завантажено: ${products.length} продуктів`);
  } catch (err) {
    console.error(`[${store.label}] Помилка завантаження меню:`, err.message);
  }
}

function getProductName(account, productId) {
  return productCaches[account]?.[String(productId)] || `Product #${productId}`;
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

async function fetchTransaction(store, transactionId) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const res = await axios.get(
    `${API}/transactions.getTransactions?token=${store.token}&date_from=${today}&date_to=${today}`
  );
  const list = res.data.response?.data || [];
  return list.find(t => String(t.transaction_id) === String(transactionId));
}

// ─── Webhook: /webhook/:account (or /webhook for single-store) ─────────────
async function handleWebhook(store, req, res) {
  const { object, object_id } = req.body;
  res.json({ status: 'accept' });

  if (object !== 'transaction') return;

  try {
    const tx = await fetchTransaction(store, object_id);
    if (!tx) return;

    const result = {
      account: store.account,
      store_label: store.label,
      transaction_id: tx.transaction_id,
      time: tx.date_close,
      sum: parseFloat(tx.sum),
      payed_cash: parseFloat(tx.payed_cash),
      payed_card: parseFloat(tx.payed_card),
      products: tx.products.map(p => ({
        product_id: p.product_id,
        name: getProductName(store.account, p.product_id),
        quantity: parseFloat(p.num),
        sum: parseFloat(p.product_sum),
      })),
    };

    broadcast(result);
    console.log(`🛒 [${store.label}] #${result.transaction_id} | ${result.sum} грн | ${result.products.length} позицій`);
  } catch (err) {
    console.error(`[${store.label}] Помилка:`, err.message);
  }
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

// ─── Debug ──────────────────────────────────────────────────────────────────
app.get('/debug', async (req, res) => {
  const info = {
    stores: stores.map(s => ({
      account: s.account,
      label: s.label,
      tokenPrefix: s.token ? s.token.slice(0, 12) + '...' : 'MISSING',
      cachedProducts: Object.keys(productCaches[s.account] || {}).length,
    })),
    wsClients: wss.clients.size,
    env: {
      POSTER_APP_ID: process.env.POSTER_APP_ID || 'MISSING',
      POSTER_APP_SECRET: process.env.POSTER_APP_SECRET ? '***set***' : 'MISSING',
      POSTER_REDIRECT_URI: process.env.POSTER_REDIRECT_URI || 'MISSING',
    },
  };
  res.json(info);
});

// ─── Test (fires latest transaction from first store) ───────────────────────
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

  const result = {
    account: store.account,
    store_label: store.label,
    transaction_id: tx.transaction_id,
    time: tx.date_close,
    sum: parseFloat(tx.sum),
    payed_cash: parseFloat(tx.payed_cash),
    payed_card: parseFloat(tx.payed_card),
    products: tx.products.map(p => ({
      product_id: p.product_id,
      name: getProductName(store.account, p.product_id),
      quantity: parseFloat(p.num),
      sum: parseFloat(p.product_sum),
    })),
  };

  broadcast(result);
  res.json({ status: 'sent', data: result });
});

wss.on('connection', (ws) => {
  console.log('🔌 Клієнт підключився');
  ws.on('close', () => console.log('🔌 Клієнт відключився'));
});

// ─── Start ──────────────────────────────────────────────────────────────────
Promise.all(stores.map(loadProductCache)).then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Сервер: http://localhost:${PORT}`);
    stores.forEach(s => {
      console.log(`📡 [${s.label}] Webhook: http://localhost:${PORT}/webhook/${s.account}`);
    });
    console.log(`🧪 Тест: http://localhost:${PORT}/test`);
  });
});
