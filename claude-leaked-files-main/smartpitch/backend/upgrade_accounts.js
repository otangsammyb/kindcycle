const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

db.once('open', async () => {
    try {
        await db.collection('users').updateMany({}, { $set: { plan: 'agency', role: 'admin' } });
        console.log("Success! Upgraded all accounts to agency.");
    } catch(err) {
        console.log("error", err);
    }
    process.exit(0);
});
