import { MongoClient } from 'mongodb';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const username = process.argv[2]?.trim();
if (!username) {
  console.error('Usage: node --env-file=.env scripts/check-staff-user.js <username>');
  process.exit(1);
}

const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');

try {
  await mongoClient.connect();
  const database = mongoClient.db(process.env.MONGODB_DB || 'ember-bun');
  const user = await database.collection('staff_users').findOne(
    { username },
    { projection: { _id: 0, username: 1, passwordHash: 1, password: 1 } }
  );

  if (!user) {
    console.log(`No staff user found for "${username}".`);
  } else {
    console.log(JSON.stringify({
      username: user.username,
      hasPasswordHash: typeof user.passwordHash === 'string' && user.passwordHash.includes('$'),
      hasLegacyPlaintextPassword: typeof user.password === 'string' && user.password.length > 0
    }, null, 2));
  }
} finally {
  await mongoClient.close();
}
