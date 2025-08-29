#!/usr/bin/env node

// Simple script to verify demo users exist in the database
// Run with: npx tsx scripts/verify-demo-users.ts

import { db } from '../server/db';

async function verifyDemoUsers() {
  console.log('🔍 Verifying Demo Users...\n');

  const expectedUsers = [
    { email: 'admin@builderai.com', persona: 'super_admin', display: '👑 Super Admin' },
    { email: 'builder@builderai.com', persona: 'builder', display: '🛠️  Builder' },
    { email: 'john.doe@example.com', persona: 'end_user', display: '🎯 End User' }
  ];

  try {
    for (const expected of expectedUsers) {
      const result = await db.select()
        .from(require('../shared/schema').users)
        .where(require('drizzle-orm').eq(require('../shared/schema').users.email, expected.email))
        .limit(1);

      if (result.length === 0) {
        console.log(`❌ ${expected.display}: ${expected.email} - NOT FOUND`);
      } else {
        const user = result[0];
        const isActive = String(user.is_active).toLowerCase() === 'true';
        const isApproved = user.approval_status === 'approved';

        if (isActive && isApproved) {
          console.log(`✅ ${expected.display}: ${expected.email} - ACTIVE & APPROVED`);
        } else {
          console.log(`⚠️  ${expected.display}: ${expected.email} - Status: ${isActive ? 'Active' : 'Inactive'}, ${isApproved ? 'Approved' : 'Pending'}`);
        }
      }
    }

    console.log('\n📋 Login Credentials:');
    console.log('👑 Super Admin: admin@builderai.com / demo123');
    console.log('🛠️  Builder: builder@builderai.com / demo123');
    console.log('🎯 End User: john.doe@example.com / demo123');
    console.log('\n🎉 Demo users verification complete!');

  } catch (error) {
    console.error('❌ Error verifying demo users:', error);
    process.exit(1);
  }
}

verifyDemoUsers();
