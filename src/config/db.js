const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  }).then(m => {
    console.log(`✅ MongoDB connected: ${m.connection.host || 'Atlas/Local'}`);
    return m.connection; // Return the connection object instead of the whole mongoose instance
  }).catch(err => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    connectionPromise = null; // Allow retry
    throw err;
  });

  return connectionPromise;
};

module.exports = { connectDB };
