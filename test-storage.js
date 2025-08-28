import { db } from './server/db.js';
import { storage } from './server/storage.js';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');

    // Test basic database connection
    const result = await db.execute('SELECT 1 as test');
    console.log('Database connection successful:', result);

    // Test storage implementation
    console.log('Testing storage implementation...');

    // Try to get all users (should work even if empty)
    const users = await storage.getAllUsers();
    console.log('Users count:', users.length);

    console.log('All tests passed!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabaseConnection();
