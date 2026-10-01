// Pemakaian: npm run create-admin -- "Nama" email@domain.com PasswordKuat123
const bcrypt = require('bcryptjs');
const db = require('../config/db');

(async () => {
  const [, , name, email, password] = process.argv;
  if (!name || !email || !password) {
    console.error('Pemakaian: npm run create-admin -- "Nama" email password');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,'admin')",
    [name, email, hash]
  );
  console.log('Admin dibuat:', email);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
