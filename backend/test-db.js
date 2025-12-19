import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function testDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count total users
    const userCount = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${userCount}`);

    // List all users (without sensitive data)
    const users = await User.find({}, 'name email phone createdAt');
    console.log('\n👥 Registered Users:');
    if (users.length === 0) {
      console.log('   No users found. Please use Sign-up to create an account first.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone || 'Not provided'}`);
        console.log(`   Registered: ${user.createdAt.toLocaleDateString()}`);
      });
    }

    console.log('\n✅ Database test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
