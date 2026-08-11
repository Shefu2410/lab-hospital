/**
 * Run once with `npm run seed` after configuring .env to create:
 *  - a demo lab (active immediately - no approval step)
 *  - default logins within that demo lab (admin / pathologist / lab-technician)
 *  - a starter test catalog for the demo lab (RFT, LFT, CBC, Lipid, Glucose)
 * Safe to re-run: it skips anything that already exists.
 */
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Lab = require('./models/Lab');
const TestCatalog = require('./models/TestCatalog');
const { generateLabCode } = require('./utils/idGenerator');

const DEMO_LAB = {
  name: 'RKH Diagnostics (Demo)',
  email: 'demo-lab@rkhcross.test',
  phone: '9999999999',
  address: 'Rajkot, Gujarat, India',
};

const defaultLabUsers = [
  { name: 'Lab Administrator', username: 'admin', password: 'admin123', role: 'admin' },
  { name: 'Dr. Pathologist', username: 'pathologist', password: 'path123', role: 'pathologist' },
  { name: 'Lab Technician', username: 'technician', password: 'tech123', role: 'lab-technician' },
];

const defaultTests = [
  {
    code: 'RFT',
    name: 'Renal Function Test',
    department: 'Biochemistry',
    price: 600,
    parameters: [
      { name: 'Urea', unit: 'mg/dL', normalMin: 15, normalMax: 40 },
      { name: 'Creatinine', unit: 'mg/dL', normalMin: 0.6, normalMax: 1.3 },
      { name: 'Uric Acid', unit: 'mg/dL', normalMin: 3.5, normalMax: 7.2 },
      { name: 'Sodium', unit: 'mmol/L', normalMin: 135, normalMax: 145 },
      { name: 'Potassium', unit: 'mmol/L', normalMin: 3.5, normalMax: 5.1 },
      { name: 'Chloride', unit: 'mmol/L', normalMin: 98, normalMax: 107 },
    ],
  },
  {
    code: 'LFT',
    name: 'Liver Function Test',
    department: 'Biochemistry',
    price: 700,
    parameters: [
      { name: 'Total Bilirubin', unit: 'mg/dL', normalMin: 0.2, normalMax: 1.2 },
      { name: 'Direct Bilirubin', unit: 'mg/dL', normalMin: 0.0, normalMax: 0.3 },
      { name: 'SGOT (AST)', unit: 'U/L', normalMin: 5, normalMax: 40 },
      { name: 'SGPT (ALT)', unit: 'U/L', normalMin: 7, normalMax: 56 },
      { name: 'Alkaline Phosphatase', unit: 'U/L', normalMin: 44, normalMax: 147 },
      { name: 'Total Protein', unit: 'g/dL', normalMin: 6.0, normalMax: 8.3 },
      { name: 'Albumin', unit: 'g/dL', normalMin: 3.5, normalMax: 5.0 },
    ],
  },
  {
    code: 'CBC',
    name: 'Complete Blood Count',
    department: 'Hematology',
    price: 350,
    parameters: [
      { name: 'Hemoglobin', unit: 'g/dL', normalMin: 12.0, normalMax: 16.0 },
      { name: 'WBC Count', unit: '/cumm', normalMin: 4000, normalMax: 11000 },
      { name: 'RBC Count', unit: 'mill/cumm', normalMin: 4.2, normalMax: 5.9 },
      { name: 'Platelet Count', unit: '/cumm', normalMin: 150000, normalMax: 450000 },
      { name: 'Hematocrit (PCV)', unit: '%', normalMin: 36, normalMax: 46 },
    ],
  },
  {
    code: 'LIPID',
    name: 'Lipid Profile',
    department: 'Biochemistry',
    price: 550,
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 200 },
      { name: 'Triglycerides', unit: 'mg/dL', normalMin: 0, normalMax: 150 },
      { name: 'HDL Cholesterol', unit: 'mg/dL', normalMin: 40, normalMax: 60 },
      { name: 'LDL Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 100 },
      { name: 'VLDL Cholesterol', unit: 'mg/dL', normalMin: 5, normalMax: 30 },
    ],
  },
  {
    code: 'GLU',
    name: 'Blood Glucose (Fasting)',
    department: 'Biochemistry',
    price: 150,
    parameters: [{ name: 'Fasting Blood Sugar', unit: 'mg/dL', normalMin: 70, normalMax: 100 }],
  },
];

async function seed() {
  await connectDB();

  // 1. Demo lab, active immediately
  let lab = await Lab.findOne({ email: DEMO_LAB.email });
  if (!lab) {
    const code = await generateLabCode(DEMO_LAB.name);
    // Seeded lab is pre-approved - it's demo data, not a real signup that
    // should wait for the Owner Console.
    lab = await Lab.create({ ...DEMO_LAB, code, status: 'approved', approvedAt: new Date() });
    console.log(`Created demo lab: ${lab.name} (code: ${lab.code}, status: approved)`);
  } else if (lab.status !== 'approved') {
    lab.status = 'approved';
    lab.approvedAt = new Date();
    await lab.save();
    console.log(`Demo lab already existed but wasn't approved - fixed (code: ${lab.code})`);
  } else {
    console.log(`Demo lab already exists (code: ${lab.code})`);
  }

  // 2. Default users inside the demo lab
  for (const u of defaultLabUsers) {
    const exists = await User.findOne({ lab: lab._id, username: u.username });
    if (!exists) {
      await User.create({ ...u, lab: lab._id });
      console.log(`Created user: ${u.username} / ${u.password} (role: ${u.role}, lab: ${lab.code})`);
    } else {
      console.log(`User already exists: ${u.username} (lab: ${lab.code})`);
    }
  }

  // 3. Starter test catalog for the demo lab
  for (const t of defaultTests) {
    const exists = await TestCatalog.findOne({ lab: lab._id, code: t.code });
    if (!exists) {
      await TestCatalog.create({ ...t, lab: lab._id });
      console.log(`Created test panel: ${t.name} (lab: ${lab.code})`);
    } else {
      console.log(`Test panel already exists: ${t.name} (lab: ${lab.code})`);
    }
  }

  console.log('\nSeeding complete.');
  console.log(`Log in with lab code: ${lab.code}, then any of admin/admin123, pathologist/path123, technician/tech123`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
