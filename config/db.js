const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB connection options
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/janproject');

    console.log(`✅ MongoDB Connected Successfully`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('📝 Full Error:', error);
    console.log('💡 Make sure MongoDB is running on your system');
    console.log('💡 Connection string:', process.env.MONGODB_URI || 'mongodb://localhost:27017/janproject');
    console.log('⚠️  Server will continue running but database operations will fail');
    console.log('⚠️  Please fix MongoDB credentials in .env file');
    // Don't exit - let server continue running
    // process.exit(1);
  }
};

module.exports = connectDB;
