import postgres from 'postgres';

// Database connection - using the same connection as the application
const sql = postgres('postgresql://builderai:builderai123@localhost:5432/builderai_dev');

async function checkUsers() {
  console.log('🔍 Checking demo users status...');

  try {
    // Check all demo users
    const users = await sql`
      SELECT email, persona, is_active, approval_status, roles, permissions
      FROM users
      WHERE email IN ('admin@builderai.com', 'builder@builderai.com', 'john.doe@example.com')
      ORDER BY email
    `;

    console.log('📋 Current User Status:');
    console.log('─'.repeat(80));

    users.forEach(user => {
      const status = user.is_active === 'true' ? '✅ ACTIVE' : '❌ DEACTIVATED';
      const approval = user.approval_status === 'approved' ? '✅ APPROVED' : '❌ ' + user.approval_status.toUpperCase();

      console.log(`Email: ${user.email}`);
      console.log(`Persona: ${user.persona}`);
      console.log(`Status: ${status}`);
      console.log(`Approval: ${approval}`);
      console.log(`Roles: ${user.roles}`);
      console.log(`Permissions: ${user.permissions}`);
      console.log('─'.repeat(80));
    });

    // Check if any users are missing
    const expectedEmails = ['admin@builderai.com', 'builder@builderai.com', 'john.doe@example.com'];
    const foundEmails = users.map(u => u.email);

    const missingUsers = expectedEmails.filter(email => !foundEmails.includes(email));
    if (missingUsers.length > 0) {
      console.log('❌ Missing Users:', missingUsers);
    }

  } catch (error) {
    console.error('❌ Failed to check users:', error);
  } finally {
    await sql.end();
  }
}

// Run the script
checkUsers().catch(console.error);