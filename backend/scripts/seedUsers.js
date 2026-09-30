/**
 * seedUsers.js — Create one real User per role for demo/testing.
 * All accounts go through the real bcrypt pre-save hook in the User model.
 * Run: node scripts/seedUsers.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

dotenv.config();

const DEMO_PASSWORD = 'Demo@1234';

const SEED_ACCOUNTS = [
  { firstName: 'Alex',   lastName: 'Vance',  email: 'admin@buildflow.dev',       role: 'Admin'      },
  { firstName: 'Marcus', lastName: 'Chen',   email: 'technician@buildflow.dev',  role: 'Technician' },
  { firstName: 'Priya',  lastName: 'Sharma', email: 'inspector@buildflow.dev',   role: 'Inspector'  },
  { firstName: 'David',  lastName: 'Miller', email: 'warehouse@buildflow.dev',   role: 'Warehouse'  },
  { firstName: 'Rohan',  lastName: 'Verma',  email: 'logistics@buildflow.dev',   role: 'Logistics'  },
  { firstName: 'Arjun',  lastName: 'Mehta',  email: 'customer@buildflow.dev',    role: 'Customer'   },
];

const seedUsers = async () => {
  try {
    const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buildflow';
    await mongoose.connect(connUri);
    console.log('[seedUsers] MongoDB connected.\n');

    let created = 0;
    let skipped = 0;

    for (const acct of SEED_ACCOUNTS) {
      const existing = await User.findOne({ email: acct.email });
      if (existing) {
        console.log(`  [SKIP]    ${acct.role.padEnd(12)} ${acct.email}  (already exists)`);
        skipped++;
        continue;
      }
      await User.create({ ...acct, password: DEMO_PASSWORD });
      console.log(`  [CREATED] ${acct.role.padEnd(12)} ${acct.email}`);
      created++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  BuildFlow Demo Credentials (all use same password)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const acct of SEED_ACCOUNTS) {
      console.log(`  ${acct.role.padEnd(12)}  ${acct.email}  /  ${DEMO_PASSWORD}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n  Created: ${created}  |  Skipped (already existed): ${skipped}`);
    console.log('\n[seedUsers] Done.\n');
    process.exit(0);
  } catch (err) {
    console.error('[seedUsers] Error:', err.message);
    process.exit(1);
  }
};

seedUsers();
