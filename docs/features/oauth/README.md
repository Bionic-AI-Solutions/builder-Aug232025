# OAuth Integration Feature

## 📖 Overview

The OAuth integration feature provides secure authentication and authorization capabilities using Google and Facebook OAuth providers. This implementation seamlessly integrates with the existing approval workflow, ensuring all users (both traditional and OAuth) go through the same security and admin control processes.

## 🎯 Key Features

### ✅ **OAuth Providers Supported**
- **Google OAuth 2.0** - Full integration with profile data extraction
- **Facebook Login** - Complete integration with profile data extraction
- **Extensible Architecture** - Easy to add more providers (GitHub, Microsoft, etc.)

### ✅ **Security & Compliance**
- **Approval Workflow Integration** - OAuth users require admin approval
- **Account Linking** - Prevents duplicate social accounts across users
- **Secure Token Handling** - JWT tokens for OAuth users
- **Profile Data Storage** - Secure storage of OAuth profile information
- **HTTPS Enforcement** - Required for production OAuth callbacks

### ✅ **User Experience**
- **One-Click Login** - Seamless authentication with Google/Facebook
- **Account Management** - Link/unlink multiple social accounts
- **Persona Support** - OAuth users can specify their persona (Super Admin, Builder, End User)
- **Error Handling** - Comprehensive error messages and user feedback

## 🏗️ Architecture

### **Database Schema**
```sql
-- OAuth social accounts table
social_accounts (
  id, userId, provider, providerUserId, 
  accessToken, refreshToken, expiresAt, profileData
)

-- Updated users table
users (
  password_hash (optional for OAuth users),
  approvalStatus, approvedBy, approvedAt, rejectionReason
)
```

### **API Endpoints**
- `GET /api/auth/oauth/providers` - List available OAuth providers
- `GET /api/auth/oauth/:provider` - Initiate OAuth authentication
- `GET /api/auth/oauth/callback/:provider` - OAuth callback handler
- `POST /api/auth/oauth/link-account` - Link OAuth account to existing user
- `GET /api/auth/oauth/social-accounts` - Get user's linked social accounts
- `DELETE /api/auth/oauth/unlink-account/:accountId` - Unlink social account

### **OAuth Flow**
```
1. User clicks OAuth button
   ↓
2. Redirect to OAuth provider
   ↓
3. Provider authenticates user
   ↓
4. Provider redirects back with code
   ↓
5. System exchanges code for profile data
   ↓
6. Create/link user account
   ↓
7. Apply approval workflow
   ↓
8. Redirect to frontend with result
```

## 📚 Documentation

### **📖 [API Documentation](./oauth-api-documentation.md)**
Comprehensive API documentation with:
- Detailed endpoint descriptions
- Request/response examples
- Error codes and handling
- Frontend integration examples
- Security considerations

### **🧪 [Testing Guide](./oauth-testing-guide.md)**
Complete testing suite including:
- Test scenarios and scripts
- Performance testing
- Security testing
- Integration testing
- Troubleshooting guide

### **⚡ [Quick Reference](./oauth-quick-reference.md)**
Developer quick reference with:
- Common use cases
- Code examples
- Error codes
- Troubleshooting tips

## 🚀 Getting Started

### **1. Environment Setup**
```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
OAUTH_CALLBACK_URL=http://localhost:8080/api/auth/oauth/callback
```

### **2. Quick Test**
```bash
# Check OAuth providers
curl -X GET http://localhost:8080/api/auth/oauth/providers

# Test OAuth initiation
curl -X GET http://localhost:8080/api/auth/oauth/google
```

### **3. Frontend Integration**
```javascript
// Get available providers
const response = await fetch('/api/auth/oauth/providers');
const { data } = await response.json();

// Show OAuth buttons
data.providers.forEach(provider => {
  if (provider.enabled) {
    // Create OAuth login button
    const button = document.createElement('button');
    button.textContent = `Login with ${provider.displayName}`;
    button.onclick = () => window.location.href = provider.authUrl;
  }
});
```

## 🔧 Configuration

### **Google OAuth 2.0 Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure authorized redirect URIs:
   - `http://localhost:8080/api/auth/oauth/callback/google` (development)
   - `https://yourdomain.com/api/auth/oauth/callback/google` (production)

### **Facebook Login Setup**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:8080/api/auth/oauth/callback/facebook` (development)
   - `https://yourdomain.com/api/auth/oauth/callback/facebook` (production)

## 🧪 Testing

### **Run Test Suite**
```bash
# Start test environment
docker-compose -f docker-compose.dev.yml up -d

# Run OAuth tests
./docs/features/oauth/test_oauth_suite.sh
```

### **Test Scenarios**
- ✅ OAuth provider configuration
- ✅ OAuth authentication flow
- ✅ Social account management
- ✅ Error handling
- ✅ Security testing
- ✅ Performance testing

## 🔒 Security Features

### **Approval Workflow**
- All OAuth users go through admin approval
- Pending users cannot log in until approved
- Rejected users receive clear feedback

### **Account Security**
- Prevents duplicate social accounts
- Secure token storage and handling
- Profile data encryption
- HTTPS enforcement in production

### **Error Handling**
- Comprehensive error codes
- Secure error messages (no sensitive data exposure)
- Rate limiting protection
- Input validation and sanitization

## 📊 Performance

### **Optimizations**
- Efficient database queries
- Caching for OAuth provider data
- Async processing for OAuth callbacks
- Connection pooling for database operations

### **Monitoring**
- OAuth flow logging
- Error tracking and reporting
- Performance metrics
- Security event monitoring

## 🚨 Troubleshooting

### **Common Issues**

1. **"OAuth not properly configured"**
   - Check environment variables
   - Verify OAuth provider credentials
   - Ensure callback URLs match

2. **"Invalid OAuth provider"**
   - Only 'google' and 'facebook' supported
   - Check provider name spelling

3. **"Social account already linked"**
   - OAuth account already linked to another user
   - Use existing account or contact support

4. **"Account pending approval"**
   - New OAuth users require admin approval
   - Contact system administrator

### **Debug Mode**
```bash
# Enable debug logging
export LOG_LEVEL=debug

# Restart container
docker-compose -f docker-compose.dev.yml restart builderai-dev

# Check logs
docker-compose -f docker-compose.dev.yml logs -f builderai-dev
```

## 🔄 OAuth Workflow Integration

### **With Approval System**
```
OAuth Login → Profile Extraction → Account Creation → Pending Approval → Admin Review → Login Access
```

### **With Existing Users**
```
OAuth Login → Profile Extraction → Account Linking → Immediate Login Access
```

### **With Rejected Users**
```
OAuth Login → Profile Extraction → Account Creation → Rejected Status → Clear Error Message
```

## 📈 Future Enhancements

### **Planned Features**
- [ ] GitHub OAuth integration
- [ ] Microsoft OAuth integration
- [ ] LinkedIn OAuth integration
- [ ] OAuth account migration tools
- [ ] Advanced social account analytics
- [ ] OAuth provider health monitoring

### **Extensibility**
- Modular OAuth provider architecture
- Easy addition of new OAuth providers
- Configurable OAuth scopes and permissions
- Custom OAuth callback handling

## 🤝 Contributing

### **Development Guidelines**
1. Follow existing code patterns
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Ensure security best practices
5. Test with multiple OAuth providers

### **Testing Requirements**
- Unit tests for all OAuth functions
- Integration tests for OAuth flows
- Security tests for OAuth endpoints
- Performance tests for OAuth operations

## 📞 Support

### **Documentation**
- [API Documentation](./oauth-api-documentation.md)
- [Testing Guide](./oauth-testing-guide.md)
- [Quick Reference](./oauth-quick-reference.md)

### **Issues**
- Check troubleshooting guide first
- Review error logs and debug information
- Test with minimal configuration
- Verify OAuth provider settings

---

## 🎉 Success Metrics

### **Implementation Status**
- ✅ OAuth infrastructure implemented
- ✅ Google OAuth 2.0 integration complete
- ✅ Facebook Login integration complete
- ✅ Approval workflow integration complete
- ✅ Social account management complete
- ✅ Comprehensive testing suite complete
- ✅ Documentation complete

### **Ready for Production**
- ✅ Security review completed
- ✅ Performance testing passed
- ✅ Error handling verified
- ✅ Documentation finalized
- ✅ Testing suite validated

**The OAuth integration is production-ready and fully documented!** 🚀
