import bcrypt from 'bcrypt';

async function generateHash(password) {
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  return hash;
}

// Generate hashes for test passwords
async function main() {
  console.log('Generating password hashes...\n');
  
  await generateHash('demo123');
  console.log('');
  await generateHash('password123');
  console.log('');
  await generateHash('admin123');
  console.log('');
  await generateHash('builder123');
  console.log('');
  await generateHash('user123');
}

main().catch(console.error);
