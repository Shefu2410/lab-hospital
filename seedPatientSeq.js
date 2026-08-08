require('dotenv').config();
const connectDB = require('./config/db'); // reuse the same connect helper your seed.js uses
const Lab = require('./models/Lab');
const Patient = require('./models/Patient');

async function run() {
  await connectDB();

  const labs = await Lab.find({});

  for (const lab of labs) {
    const highest = await Patient.find({ lab: lab._id })
      .sort({ patientId: -1 })
      .limit(1);

    const highestNum = highest.length
      ? parseInt(highest[0].patientId.replace('PT-', ''), 10)
      : 0;

    await Lab.findByIdAndUpdate(lab._id, { patientSeq: highestNum });

    console.log(`Lab ${lab._id} (${lab.labName}) -> patientSeq set to ${highestNum}`);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('patientSeq seeding failed:', err);
  process.exit(1);
});