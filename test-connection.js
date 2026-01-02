require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');
console.log('📋 Configuration:');
console.log('   URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<username>:<password>@'));
console.log('');

// Test connection
const testConnection = async () => {
  try {
    console.log('⏳ Attempting to connect to MongoDB...\n');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    console.log('✅ ✅ ✅ SUCCESS! MongoDB Connected! ✅ ✅ ✅\n');
    console.log('📍 Host:', mongoose.connection.host);
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🔗 Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Test write operation
    console.log('\n⏳ Testing write operation...');
    
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    const testDoc = await TestModel.create({
      message: 'Connection test successful!'
    });
    
    console.log('✅ Write operation successful!');
    console.log('✅ Document ID:', testDoc._id);
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Cleanup successful!');
    
    console.log('\n🎉 🎉 🎉 ALL TESTS PASSED! 🎉 🎉 🎉');
    console.log('\n✅ Your MongoDB connection is working perfectly!');
    console.log('✅ You can now start your backend server with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ ❌ ❌ CONNECTION FAILED ❌ ❌ ❌\n');
    console.error('Error Message:', error.message);
    console.error('');
    
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.log('🔧 PROBLEM: Wrong username or password');
      console.log('');
      console.log('📝 SOLUTION:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Click "Database Access" in left menu');
      console.log('   3. Find user "Ritika" and click "EDIT"');
      console.log('   4. Click "Edit Password"');
      console.log('   5. Set a NEW password (write it down!)');
      console.log('   6. Click "Update User"');
      console.log('   7. Update backend/.env file with new password');
      console.log('');
      console.log('   Current .env line:');
      console.log('   MONGODB_URI=mongodb+srv://Ritika:YOUR_PASSWORD@cluster0.ojes4rd.mongodb.net/janproject...');
      console.log('');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('🔧 PROBLEM: Cannot find MongoDB server');
      console.log('');
      console.log('📝 SOLUTION:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify cluster URL is correct');
      console.log('   3. Make sure your MongoDB Atlas cluster is active');
      console.log('');
    } else if (error.message.includes('IP') || error.message.includes('not authorized')) {
      console.log('🔧 PROBLEM: IP address not whitelisted');
      console.log('');
      console.log('📝 SOLUTION:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Click "Network Access" in left menu');
      console.log('   3. Click "ADD IP ADDRESS"');
      console.log('   4. Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)');
      console.log('   5. Click "Confirm"');
      console.log('   6. Wait 1-2 minutes for changes to apply');
      console.log('');
    } else if (error.message.includes('timeout')) {
      console.log('🔧 PROBLEM: Connection timeout');
      console.log('');
      console.log('📝 SOLUTION:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify IP is whitelisted in Network Access');
      console.log('   3. Try again in a few minutes');
      console.log('');
    }
    
    console.log('❌ Fix the issue above and run: node test-connection.js');
    console.log('');
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit();
  }
};

testConnection();
