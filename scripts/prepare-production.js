#!/usr/bin/env node

/**
 * Production Setup Script for BuilderAI
 *
 * This script helps prepare the application for production by:
 * 1. Removing demo users
 * 2. Setting production environment variables
 * 3. Providing production deployment checklist
 *
 * Usage:
 *   node scripts/prepare-production.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 BuilderAI Production Setup Script');
console.log('=====================================\n');

// Demo users to remove
const DEMO_USERS = [
  'admin@builderai.com',
  'builder@builderai.com',
  'john.doe@example.com'
];

console.log('📋 Production Preparation Checklist:');
console.log('=====================================');

console.log('\n1. 🔒 SECURITY MEASURES:');
console.log('   ✅ Remove demo users from database:');
DEMO_USERS.forEach(email => {
  console.log(`      DELETE FROM users WHERE email = '${email}';`);
});

console.log('\n   ✅ Update environment variables in .env:');
console.log('      - NODE_ENV=production');
console.log('      - JWT_SECRET=<secure-random-string>');
console.log('      - DATABASE_URL=<production-database-url>');
console.log('      - Remove or update demo user credentials');

console.log('\n2. 🗄️  DATABASE SETUP:');
console.log('   ✅ Run migration on production database:');
console.log('      docker-compose -f docker-compose.prod.yml exec builderai-prod npx tsx scripts/migrate-to-postgres.ts');

console.log('\n   ✅ Create production database user:');
console.log('      CREATE USER prod_user WITH PASSWORD \'secure_password\';');
console.log('      GRANT ALL PRIVILEGES ON DATABASE prod_db TO prod_user;');

console.log('\n3. 🚀 DEPLOYMENT:');
console.log('   ✅ Use production Docker Compose:');
console.log('      docker-compose -f docker-compose.prod.yml up -d --build');

console.log('\n   ✅ Configure reverse proxy (nginx/apache):');
console.log('      - SSL/TLS certificates');
console.log('      - Rate limiting');
console.log('      - CORS settings');

console.log('\n4. 📊 MONITORING:');
console.log('   ✅ Set up logging:');
console.log('      - Application logs');
console.log('      - Database logs');
console.log('      - Error tracking');

console.log('\n   ✅ Configure backups:');
console.log('      - Database backups');
console.log('      - File storage backups');
console.log('      - Automated backup scripts');

console.log('\n5. 🔧 PERFORMANCE:');
console.log('   ✅ Configure resource limits:');
console.log('      - Memory limits');
console.log('      - CPU limits');
console.log('      - Database connection pooling');

console.log('\n⚠️  IMPORTANT REMINDERS:');
console.log('========================');
console.log('• Never commit .env files with real credentials');
console.log('• Use strong, unique passwords for all services');
console.log('• Regularly update dependencies and security patches');
console.log('• Monitor application performance and errors');
console.log('• Keep backups in secure, off-site locations');

console.log('\n📝 PRODUCTION CHECKLIST FILE:');
console.log('=============================');
console.log('A production checklist has been generated: docs/production-checklist.md');

console.log('\n🎯 NEXT STEPS:');
console.log('==============');
console.log('1. Review and complete the production checklist');
console.log('2. Set up your production environment');
console.log('3. Run database migrations on production');
console.log('4. Remove demo users from production database');
console.log('5. Deploy and test thoroughly');

console.log('\n✨ Production setup script completed!');
console.log('See docs/setup-guide.md for detailed instructions.\n');

// Generate a production checklist file
const checklistContent = `# 🚀 BuilderAI Production Deployment Checklist

## Pre-Deployment
- [ ] Review security requirements
- [ ] Set up production database
- [ ] Configure production environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure domain and DNS

## Database Setup
- [ ] Create production database user
- [ ] Run database migrations
- [ ] Remove demo users:
  - [ ] DELETE FROM users WHERE email = 'admin@builderai.com';
  - [ ] DELETE FROM users WHERE email = 'builder@builderai.com';
  - [ ] DELETE FROM users WHERE email = 'john.doe@example.com';
- [ ] Create production admin user
- [ ] Test database connections

## Application Deployment
- [ ] Build production Docker images
- [ ] Deploy to production server
- [ ] Configure reverse proxy
- [ ] Set up monitoring and logging
- [ ] Configure backups

## Security
- [ ] Update all passwords
- [ ] Configure firewall
- [ ] Set up rate limiting
- [ ] Enable HTTPS
- [ ] Configure CORS properly

## Testing
- [ ] Test all user roles
- [ ] Test API endpoints
- [ ] Test file uploads
- [ ] Test email notifications
- [ ] Load testing

## Post-Deployment
- [ ] Monitor application logs
- [ ] Set up automated backups
- [ ] Configure alerts
- [ ] Document production procedures
- [ ] Train team on production processes

---
Generated by prepare-production.js on ${new Date().toISOString()}
`;

const checklistPath = path.join(__dirname, '..', 'docs', 'production-checklist.md');
fs.writeFileSync(checklistPath, checklistContent);

console.log('📋 Production checklist generated at: docs/production-checklist.md\n');
