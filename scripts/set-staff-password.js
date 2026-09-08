import { randomBytes, scryptSync } from 'node:crypto';
import { MongoClient } from 'mongodb';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: node --env-file=.env scripts/set-staff-password.js <username> <password>');
  process.exit(1);
}

const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
const salt = randomBytes(16).toString('hex');
const passwordHash = `${salt}$${scryptSync(password, salt, 64).toString('hex')}`;

try {
  await mongoClient.connect();
  const database = mongoClient.db(process.env.MONGODB_DB || 'ember-bun');
  await database.collection('staff_users').updateOne(
    { username: username.trim() },
    { $set: { username: username.trim(), passwordHash }, $unset: { password: '' } },
    { upsert: true }
  );
  console.log(`Updated hashed password for ${username.trim()}.`);
} finally {
  await mongoClient.close();
}
