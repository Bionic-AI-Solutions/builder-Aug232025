import postgres from 'postgres';
import bcrypt from 'bcrypt';

// Database connection - same as application
const sql = postgres('postgresql://builderai:builderai123@localhost:5432/builderai_dev');

async function testLogin() {
  console.log('🧪 Testing login process...');

  const testEmail = 'admin@builderai.com';
  const testPassword = 'demo123';

  try {
    // 1. Find user by email (same as application)
    console.log(`1. Looking up user: ${testEmail}`);
    const users = await sql`
      SELECT id, email, password_hash, persona, is_active, approval_status, roles, permissions
      FROM users
      WHERE email = ${testEmail}
    `;

    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const dbUser = users[0];
    console.log('✅ User found:', {
      email: dbUser.email,
      persona: dbUser.persona,
      is_active: dbUser.is_active,
      approval_status: dbUser.approval_status
    });

    // 2. Check if user is active (same logic as application)
    console.log('2. Checking if user is active...');
    const isActive = dbUser.is_active === 'true';
    console.log(`   is_active field: "${dbUser.is_active}"`);
    console.log(`   Converted to boolean: ${isActive}`);

    if (!isActive) {
      console.log('❌ Account is deactivated (same as application error)');
      return;
    }

    // 3. Check approval status
    console.log('3. Checking approval status...');
    if (dbUser.approval_status === 'pending') {
      console.log('❌ Account pending approval');
      return;
    }

    if (dbUser.approval_status === 'rejected') {
      console.log('❌ Account rejected');
      return;
    }

    // 4. Verify password
    console.log('4. Verifying password...');
    const isValidPassword = await bcrypt.compare(testPassword, dbUser.password_hash);
    console.log(`   Password valid: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return;
    }

    console.log('✅ Login should succeed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
}

// Run the test
testLogin().catch(console.error);