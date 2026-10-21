// Pemakaian: npm run create-admin -- "Nama" email@domain.com PasswordMinimal10
const bcrypt = require('bcryptjs');
const db = require('../config/db');

(async () => {
  const [, , name, rawEmail, password] = process.argv;
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!name || !email || !password) {
    console.error('Pemakaian: npm run create-admin -- "Nama" email password');
    process.exit(1);
  }
  if (password.length < 10 || Buffer.byteLength(password) > 72) {
    console.error('Password harus 10-72 karakter');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await db.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,'admin')",
    [name, email, hash]
  );
  console.log('Admin dibuat:', email);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
