# 👥 BuilderAI Demo Users

## Default Demo Users (Always Available)

These demo users are **automatically created** during database migration and are **always available** regardless of who runs this repository or which database is used.

### 👑 Super Admin
- **Email**: `admin@builderai.com`
- **Password**: `demo123`
- **Persona**: `super_admin`
- **Permissions**: Full system access, user management, marketplace management

### 🛠️ Builder
- **Email**: `builder@builderai.com`
- **Password**: `demo123`
- **Persona**: `builder`
- **Permissions**: Create/edit/publish projects, view analytics

### 🎯 End User
- **Email**: `john.doe@example.com`
- **Password**: `demo123`
- **Persona**: `end_user`
- **Permissions**: Purchase projects, browse marketplace

## 🚀 Quick Start

1. **Run the application**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Run database migration** (creates/updates demo users):
   ```bash
   npx tsx scripts/migrate-to-postgres.ts
   ```

3. **Access the application**:
   - Frontend: http://localhost:8080
   - Login with any of the demo users above

## 🔧 Technical Details

- **Status**: All users are `ACTIVE` and `APPROVED`
- **Password Hash**: Uses bcrypt with salt rounds 12
- **Database**: PostgreSQL with predefined UUIDs
- **Migration**: Automatically runs during `migrate-to-postgres.ts`
- **Persistence**: Users are recreated/updated on every migration run

## 📋 User Roles & Permissions

### Super Admin (`super_admin`)
```json
{
  "roles": ["super_admin"],
  "permissions": [
    "manage_users",
    "manage_marketplace",
    "view_all_analytics",
    "approve_users"
  ]
}
```

### Builder (`builder`)
```json
{
  "roles": ["builder"],
  "permissions": [
    "create_project",
    "edit_project",
    "publish_project",
    "view_analytics"
  ]
}
```

### End User (`end_user`)
```json
{
  "roles": ["end_user"],
  "permissions": [
    "purchase_project",
    "view_marketplace"
  ]
}
```

## 🎯 Testing Different Personas

Use these accounts to test different user experiences:

1. **Admin Experience**: Login as `admin@builderai.com` to test admin features
2. **Builder Experience**: Login as `builder@builderai.com` to test project creation
3. **End User Experience**: Login as `john.doe@example.com` to test marketplace browsing

## 🔄 Migration Behavior

The migration script will:
- ✅ Create users if they don't exist
- ✅ Update existing users to ensure correct settings
- ✅ Always keep these users `ACTIVE` and `APPROVED`
- ✅ Maintain consistent passwords and permissions

## 📞 Support

These demo users are designed to work out-of-the-box for:
- ✅ Development environments
- ✅ Testing scenarios
- ✅ Demo presentations
- ✅ New team members onboarding

---

**Note**: These are demo credentials for development/testing only. In production, use proper user registration and authentication flows.
