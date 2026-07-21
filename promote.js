const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://ganesh:ganesh2004@cluster0.1r1rpsm.mongodb.net/dhanvatix';
  await mongoose.connect(uri);
  
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'ganesh@dhanvatix.in' },
    { $set: { role: 'admin' } }
  );
  console.log('Promoted:', result);
  process.exit(0);
}

run().catch(console.error);
