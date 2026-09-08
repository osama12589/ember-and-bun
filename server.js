import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');
const mongoDnsServers = (process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
if (mongoDnsServers.length > 0) {
  dns.setServers(mongoDnsServers);
}

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const app = express();
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB || 'ember-bun';
const internalApiSecret = process.env.INTERNAL_API_SECRET;
const scryptAsync = promisify(scrypt);
const mongoClient = new MongoClient(mongoUri, {
  family: 4,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
});
const loginAttempts = new Map();
let dbConnectionPromise = null;
let mongoRetryAt = 0;
let mongoError = '';
const menu = new Map([
  ['ember-double', { name: 'The Ember Double', price: 12.5 }],
  ['hot-honey', { name: 'Hot Honey Crunch', price: 11.5 }],
  ['shroom-service', { name: 'Shroom Service', price: 10.5 }]
]);

const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'http://127.0.0.1:3000,http://localhost:3000').split(',').map((origin) => origin.trim()));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, origin || false);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

let db = null;

async function ensureDb() {
  if (db) return db;
  if (mongoRetryAt > Date.now()) return null;

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoClient.connect().then(() => {
      db = mongoClient.db(mongoDbName);
      mongoRetryAt = 0;
      mongoError = '';
      console.log(`Connected to MongoDB database: ${mongoDbName}`);
      return db;
    }).catch((error) => {
      dbConnectionPromise = null;
      mongoRetryAt = Date.now() + 10000;
      mongoError = error instanceof Error ? error.message : String(error);
      throw error;
    });
  }

  try {
    await dbConnectionPromise;
    return db;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('MongoDB connection failed:', message);
    return null;
  }
}

app.get('/api/health', async (_, res) => {
  const database = await ensureDb();

  res.json({
    ok: Boolean(database),
    service: 'ember-bun-api',
    database: mongoDbName,
    connected: Boolean(database),
    error: database ? undefined : mongoError || 'MongoDB connection is unavailable.',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/staff-login', async (req, res) => {
  const { username = '', password = '' } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(401).json({ ok: false, message: 'Incorrect username or password.' });
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const clientKey = `${username.toLowerCase()}:${typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : req.ip}`;
  const attempt = loginAttempts.get(clientKey);
  if (attempt && attempt.resetAt > Date.now() && attempt.count >= 5) {
    return res.status(429).json({ ok: false, message: 'Too many login attempts. Try again later.' });
  }

  const database = await ensureDb();

  if (!database) {
    return res.status(503).json({ ok: false, message: `MongoDB is not available: ${mongoError || 'check MONGODB_URI and Atlas network access.'}` });
  }

  const staffUser = await database.collection('staff_users').findOne(
    { username: username.trim() },
    { projection: { _id: 1, passwordHash: 1 } }
  );

  let validPassword = false;
  if (staffUser?.passwordHash) {
    const [salt, storedKey] = staffUser.passwordHash.split('$');
    if (salt && storedKey) {
      const derivedKey = await scryptAsync(password, salt, 64);
      const expectedKey = Buffer.from(storedKey, 'hex');
      validPassword = expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
    }
  }

  if (!staffUser || !validPassword) {
    const current = loginAttempts.get(clientKey);
    loginAttempts.set(clientKey, { count: (current?.count || 0) + 1, resetAt: Date.now() + 15 * 60 * 1000 });
    return res.status(401).json({ ok: false, message: 'Incorrect username or password.' });
  }

  loginAttempts.delete(clientKey);
  return res.json({ ok: true });
});

app.get('/api/orders', async (req, res) => {
  if (!internalApiSecret || req.headers['x-internal-api-secret'] !== internalApiSecret) {
    return res.status(401).json({ ok: false, message: 'Staff authentication required.' });
  }

  const database = await ensureDb();

  if (!database) {
    return res.status(503).json({ ok: false, message: `MongoDB is not available: ${mongoError || 'check MONGODB_URI and Atlas network access.'}` });
  }

  const orders = await database.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
  return res.json({ ok: true, orders });
});

app.post('/api/orders', async (req, res) => {
  const { items = [], customer = {}, delivery = {} } = req.body || {};

  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return res.status(400).json({ ok: false, message: 'Order must contain at least one item.' });
  }

  const deliveryMethod = delivery?.method === 'pickup' ? 'pickup' : 'delivery';
  if (!delivery || (deliveryMethod === 'delivery' && (typeof delivery.address !== 'string' || !delivery.address.trim())) || (typeof delivery.address === 'string' && delivery.address.length > 500)) {
    return res.status(400).json({ ok: false, message: 'A delivery address is required.' });
  }

  const paymentMethod = ['card', 'cash'].includes(req.body?.payment?.method) ? req.body.payment.method : 'card';
  const paymentLast4 = typeof req.body?.payment?.last4 === 'string' ? req.body.payment.last4.replace(/\D/g, '').slice(-4) : '';

  const database = await ensureDb();

  if (!database) {
    return res.status(503).json({ ok: false, message: `MongoDB is not available: ${mongoError || 'check MONGODB_URI and Atlas network access.'}` });
  }

  const validatedItems = [];
  let subtotal = 0;
  for (const item of items) {
    const catalogItem = menu.get(item?.id);
    const quantity = Number(item?.quantity);
    if (!catalogItem || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ ok: false, message: 'Order contains an invalid item.' });
    }
    validatedItems.push({ id: item.id, name: catalogItem.name, quantity, price: catalogItem.price });
    subtotal += catalogItem.price * quantity;
  }

  const deliveryFee = deliveryMethod === 'pickup' ? 0 : 4.5;
  const serviceFee = 3.5;
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const calculatedTotal = Number((subtotal + deliveryFee + serviceFee + tax).toFixed(2));
  const order = {
    id: `EB-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    customer: {
      firstName: typeof customer.firstName === 'string' ? customer.firstName.trim().slice(0, 80) : 'Guest',
      lastName: typeof customer.lastName === 'string' ? customer.lastName.trim().slice(0, 80) : 'Customer',
      email: typeof customer.email === 'string' ? customer.email.trim().slice(0, 200) : '',
      phone: typeof customer.phone === 'string' ? customer.phone.trim().slice(0, 40) : ''
    },
    items: validatedItems,
    payment: {
      method: paymentMethod,
      last4: paymentMethod === 'card' ? paymentLast4 : ''
    },
    delivery: {
      method: deliveryMethod,
      address: typeof delivery.address === 'string' ? delivery.address.trim() : '',
      eta: delivery.eta || '20–25 min'
    },
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    total: calculatedTotal
  };

  await database.collection('orders').insertOne(order);

  return res.status(201).json({ ok: true, orderId: order.id, order });
});

process.on('SIGINT', async () => {
  try {
    await mongoClient.close();
  } finally {
    process.exit(0);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Ember & Bun API running on http://127.0.0.1:${port}`);
});