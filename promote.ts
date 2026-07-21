import mongoose from 'mongoose';
import { User } from './packages/shared-models/src/User';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/dhanvatix'); // assuming default local DB name
  const result = await User.updateOne(
    { email: 'ganesh@dhanvatix.in' },
    { $set: { role: 'admin' } }
  );
  console.log('Promoted:', result);
  process.exit(0);
}

run().catch(console.error);
