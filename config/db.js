const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/reliefconnect';
  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
