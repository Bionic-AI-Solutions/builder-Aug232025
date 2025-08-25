# OAuth Quick Reference Guide

## 🚀 Quick Start

### 1. Check Available OAuth Providers
```bash
curl -X GET http://localhost:8080/api/auth/oauth/providers
```

### 2. Initiate OAuth Login
```bash
# Google OAuth
curl -L http://localhost:8080/api/auth/oauth/google?persona=builder

# Facebook OAuth
curl -L http://localhost:8080/api/auth/oauth/facebook?persona=end_user
```

### 3. Link OAuth Account to Existing User
```bash
# Get access token first
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@builderai.com", "password": "admin123"}' \
  | jq -r '.data.accessToken')

# Link OAuth account
curl -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "providerUserId": "123456789",
    "profileData": {"id": "123456789", "email": "user@example.com"}
  }'
```

## 📋 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/auth/oauth/providers` | List available OAuth providers | ❌ |
| `GET` | `/api/auth/oauth/:provider` | Initiate OAuth authentication | ❌ |
| `GET` | `/api/auth/oauth/callback/:provider` | OAuth callback handler | ❌ |
| `POST` | `/api/auth/oauth/link-account` | Link OAuth account to user | ✅ |
| `GET` | `/api/auth/oauth/social-accounts` | Get user's linked accounts | ✅ |
| `DELETE` | `/api/auth/oauth/unlink-account/:id` | Unlink social account | ✅ |

## 🔧 Environment Variables

```env
# Required for OAuth to work
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
OAUTH_CALLBACK_URL=http://localhost:8080/api/auth/oauth/callback
```

## 🎯 Common Use Cases

### Frontend OAuth Integration

```javascript
// 1. Get available providers
const response = await fetch('/api/auth/oauth/providers');
const { data } = await response.json();

// 2. Show OAuth buttons
data.providers.forEach(provider => {
  if (provider.enabled) {
    // Create button that redirects to provider.authUrl
    const button = document.createElement('button');
    button.textContent = `Login with ${provider.displayName}`;
    button.onclick = () => window.location.href = provider.authUrl;
  }
});

// 3. Handle OAuth callback
if (window.location.pathname === '/oauth-success') {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  
  // Store tokens and redirect to dashboard
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  window.location.href = '/dashboard';
}
```

### Social Account Management

```javascript
// Get user's linked social accounts
const response = await fetch('/api/auth/oauth/social-accounts', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { data } = await response.json();

// Display linked accounts
data.socialAccounts.forEach(account => {
  console.log(`Linked ${account.provider} account: ${account.providerUserId}`);
});

// Unlink a social account
await fetch(`/api/auth/oauth/unlink-account/${accountId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## ⚠️ Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PROVIDER` | 400 | Unsupported OAuth provider |
| `OAUTH_CONFIG_ERROR` | 500 | OAuth not properly configured |
| `OAUTH_AUTHENTICATION_FAILED` | 500 | OAuth authentication failed |
| `ACCOUNT_PENDING_APPROVAL` | 401 | Account pending admin approval |
| `ACCOUNT_REJECTED` | 401 | Account registration was rejected |
| `SOCIAL_ACCOUNT_EXISTS` | 409 | Social account already linked |
| `SOCIAL_ACCOUNT_NOT_FOUND` | 404 | Social account not found |
| `AUTHENTICATION_REQUIRED` | 401 | Authentication required |

## 🔄 OAuth Flow

```
1. User clicks OAuth button
   ↓
2. Redirect to /api/auth/oauth/:provider
   ↓
3. OAuth provider authenticates user
   ↓
4. Provider redirects to /api/auth/oauth/callback/:provider
   ↓
5. System processes profile data
   ↓
6. Create/link user account
   ↓
7. Redirect to frontend with result
```

## 📝 Response Examples

### Success Responses

**OAuth Providers:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "name": "google",
        "displayName": "Google",
        "enabled": true,
        "authUrl": "/api/auth/oauth/google"
      }
    ]
  }
}
```

**Link Account:**
```json
{
  "success": true,
  "message": "Social account linked successfully",
  "data": {
    "socialAccount": {
      "id": "uuid-here",
      "provider": "google",
      "providerUserId": "123456789",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Error Responses

**Invalid Provider:**
```json
{
  "error": "Invalid OAuth provider",
  "code": "INVALID_PROVIDER",
  "supportedProviders": ["google", "facebook"]
}
```

**OAuth Not Configured:**
```json
{
  "error": "OAuth not properly configured",
  "code": "OAUTH_CONFIG_ERROR",
  "details": [
    "Google OAuth credentials not configured",
    "Facebook OAuth credentials not configured"
  ]
}
```

## 🧪 Testing

### Quick Test Commands

```bash
# Test OAuth providers endpoint
curl -X GET http://localhost:8080/api/auth/oauth/providers

# Test invalid provider
curl -X GET http://localhost:8080/api/auth/oauth/invalid

# Test OAuth initiation (will fail without credentials)
curl -X GET http://localhost:8080/api/auth/oauth/google

# Test social account management (requires authentication)
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@builderai.com", "password": "admin123"}' \
  | jq -r '.data.accessToken')

curl -X GET http://localhost:8080/api/auth/oauth/social-accounts \
  -H "Authorization: Bearer $TOKEN"
```

## 🔒 Security Notes

1. **HTTPS Required**: Always use HTTPS in production
2. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended)
3. **Approval Workflow**: All OAuth users require admin approval
4. **Account Linking**: Prevents duplicate social accounts
5. **State Parameter**: Used to pass persona information securely

## 🚨 Troubleshooting

### Common Issues

1. **"OAuth not properly configured"**
   - Check environment variables are set
   - Verify OAuth provider credentials
   - Ensure callback URLs match

2. **"Invalid OAuth provider"**
   - Only 'google' and 'facebook' are supported
   - Check provider name spelling

3. **"Social account already linked"**
   - OAuth account is already linked to another user
   - Use existing account or contact support

4. **"Account pending approval"**
   - New OAuth users require admin approval
   - Contact system administrator

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Restart container
docker-compose -f docker-compose.dev.yml restart builderai-dev

# Check logs
docker-compose -f docker-compose.dev.yml logs -f builderai-dev
```

## 📚 Additional Resources

- [Full API Documentation](./oauth-api-documentation.md)
- [Testing Guide](./oauth-testing-guide.md)
- [OAuth Provider Setup](./oauth-provider-setup.md)

## 🎯 Next Steps

1. **Configure OAuth Credentials**: Set up Google/Facebook OAuth applications
2. **Test OAuth Flow**: Use the testing guide to verify functionality
3. **Frontend Integration**: Implement OAuth buttons and callback handling
4. **Production Deployment**: Configure HTTPS and production OAuth credentials
