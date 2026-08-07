// One-time script to create your first admin account.
// Run locally with:  node scripts/createAdmin.js
// Make sure your .env has MONGODB_URI set (same one your server uses).

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../src/models/Admin');

const ADMIN_EMAIL = 'admin@rkhlims.com';   // <-- change this
const ADMIN_PASSWORD = 'ChangeThisPassword123'; // <-- change this before running

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log('Admin already exists with this email.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await Admin.create({
    email: ADMIN_EMAIL.toLowerCase(),
    password: hashedPassword,
    name: 'Super Admin'
  });

  console.log('Admin created:', admin.email);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});