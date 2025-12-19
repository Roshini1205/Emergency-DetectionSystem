import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import { sendEmergencyNotification } from './src/routes/notify.js';
import User from './src/models/User.js';

async function testNotification() {
  console.log('\n🧪 Testing Emergency Notification System\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Get a user from database
    console.log('📋 Fetching users from database...');
    const users = await User.find().limit(5);
    
    if (users.length === 0) {
      console.log('❌ No users found in database. Please signup first!');
      process.exit(1);
    }
    
    console.log(`\n✅ Found ${users.length} user(s):\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Emergency Contacts: ${user.emergencyContacts.length}`);
      if (user.emergencyContacts.length > 0) {
        user.emergencyContacts.forEach((c, j) => {
          console.log(`      ${j + 1}. ${c.name || 'Unnamed'} - ${c.email}`);
        });
      }
      console.log('');
    });
    
    // Select first user with emergency contacts
    const testUser = users.find(u => u.emergencyContacts && u.emergencyContacts.length > 0);
    
    if (!testUser) {
      console.log('❌ No users with emergency contacts found!');
      console.log('💡 Please signup with emergency contacts first.');
      process.exit(1);
    }
    
    console.log(`\n📧 Sending test notification for: ${testUser.name}`);
    console.log(`   Emergency contacts: ${testUser.emergencyContacts.length}\n`);
    
    // Send test notification
    const results = await sendEmergencyNotification(
      testUser._id.toString(),
      'Test Alert - Screaming',
      85,
      'Test Location - Dashboard'
    );
    
    console.log('\n✅ Test completed!');
    console.log('📊 Results:');
    console.log(`   ✅ Emails sent: ${results.email}`);
    console.log(`   📞 Calls made: ${results.call}`);
    if (results.errors.length > 0) {
      console.log(`   ❌ Errors: ${results.errors.length}`);
      results.errors.forEach(err => console.log(`      - ${err}`));
    }
    
    console.log('\n✅ Check your emergency contact emails!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testNotification();
