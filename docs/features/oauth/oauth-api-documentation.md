# OAuth API Documentation

## Overview

The OAuth API provides authentication and authorization capabilities using Google and Facebook OAuth providers. All OAuth users go through the same approval workflow as regular users, ensuring consistent security and admin control.

## Base URL
```
http://localhost:8080/api/auth/oauth
```

## Authentication Flow

### 1. OAuth Provider Selection
User selects an OAuth provider (Google/Facebook) from the available providers.

### 2. OAuth Authentication
User is redirected to the OAuth provider for authentication.

### 3. Callback Processing
Provider redirects back with authorization code, which is exchanged for user profile data.

### 4. Account Creation/Linking
- If user doesn't exist: Create new account with pending approval
- If user exists: Link OAuth account to existing user
- If OAuth account already linked: Login existing user

### 5. Approval Workflow
New OAuth users require admin approval before they can log in.

## API Endpoints

---

## 1. Get Available OAuth Providers

**Endpoint:** `GET /api/auth/oauth/providers`

**Description:** Returns a list of available OAuth providers and their configuration status.

**Authentication:** Not required

**Response Format:**
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
      },
      {
        "name": "facebook",
        "displayName": "Facebook", 
        "enabled": true,
        "authUrl": "/api/auth/oauth/facebook"
      }
    ]
  }
}
```

**Example Request:**
```bash
curl -X GET http://localhost:8080/api/auth/oauth/providers
```

**Example Response (No Credentials Configured):**
```json
{
  "success": true,
  "data": {
    "providers": []
  }
}
```

**Example Response (With Credentials):**
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

**Usage in Frontend:**
```javascript
// Get available OAuth providers
const response = await fetch('/api/auth/oauth/providers');
const { data } = await response.json();

// Display OAuth buttons for enabled providers
data.providers.forEach(provider => {
  if (provider.enabled) {
    console.log(`Show ${provider.displayName} login button`);
    console.log(`Redirect to: ${provider.authUrl}`);
  }
});
```

---

## 2. Initiate OAuth Authentication

**Endpoint:** `GET /api/auth/oauth/:provider`

**Description:** Initiates OAuth authentication flow with the specified provider.

**Parameters:**
- `provider` (path): OAuth provider name (`google` or `facebook`)
- `persona` (query, optional): User persona (`super_admin`, `builder`, `end_user`). Defaults to `builder`.

**Authentication:** Not required

**Response:** Redirects to OAuth provider's authorization URL

**Example Requests:**
```bash
# Google OAuth for Builder persona
curl -L http://localhost:8080/api/auth/oauth/google?persona=builder

# Facebook OAuth for End User persona  
curl -L http://localhost:8080/api/auth/oauth/facebook?persona=end_user

# Google OAuth with default persona (builder)
curl -L http://localhost:8080/api/auth/oauth/google
```

**Error Responses:**

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
    "Facebook OAuth credentials not configured",
    "OAuth callback URL not configured"
  ]
}
```

**Usage in Frontend:**
```javascript
// Redirect user to OAuth provider
function initiateOAuth(provider, persona = 'builder') {
  const url = `/api/auth/oauth/${provider}?persona=${persona}`;
  window.location.href = url;
}

// Example usage
initiateOAuth('google', 'builder');
initiateOAuth('facebook', 'end_user');
```

---

## 3. OAuth Callback Handler

**Endpoint:** `GET /api/auth/oauth/callback/:provider`

**Description:** Handles OAuth callback from providers and processes user authentication.

**Parameters:**
- `provider` (path): OAuth provider name (`google` or `facebook`)

**Authentication:** Not required (handled by OAuth provider)

**Response:** Redirects to frontend with tokens or status

**Success Redirects:**

**Existing User Login:**
```
http://localhost:8080/oauth-success?accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**New User Pending Approval:**
```
http://localhost:8080/oauth-pending?message=Account pending approval
```

**Error Redirects:**

**Authentication Failed:**
```
http://localhost:8080/oauth-error?error=Authentication failed
```

**Account Pending Approval:**
```
http://localhost:8080/oauth-error?error=Account pending approval. Please wait for admin approval.
```

**Account Rejected:**
```
http://localhost:8080/oauth-error?error=Account registration was rejected.
```

**Usage in Frontend:**
```javascript
// Handle OAuth callback redirects
function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (window.location.pathname === '/oauth-success') {
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    
    // Store tokens and redirect to dashboard
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    window.location.href = '/dashboard';
  }
  
  if (window.location.pathname === '/oauth-pending') {
    const message = urlParams.get('message');
    showNotification(message, 'info');
    window.location.href = '/login';
  }
  
  if (window.location.pathname === '/oauth-error') {
    const error = urlParams.get('error');
    showNotification(error, 'error');
    window.location.href = '/login';
  }
}
```

---

## 4. Link OAuth Account to Existing User

**Endpoint:** `POST /api/auth/oauth/link-account`

**Description:** Links an OAuth account to an existing authenticated user.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "provider": "google",
  "providerUserId": "123456789",
  "profileData": {
    "id": "123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://example.com/avatar.jpg"
  }
}
```

**Response:**
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

**Error Responses:**

**Validation Error:**
```json
{
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["provider"],
      "message": "Required"
    }
  ]
}
```

**Social Account Already Exists:**
```json
{
  "error": "Social account already linked to another user",
  "code": "SOCIAL_ACCOUNT_EXISTS"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "providerUserId": "123456789",
    "profileData": {
      "id": "123456789",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }'
```

**Usage in Frontend:**
```javascript
async function linkOAuthAccount(provider, providerUserId, profileData) {
  const response = await fetch('/api/auth/oauth/link-account', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider,
      providerUserId,
      profileData
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    showNotification('OAuth account linked successfully', 'success');
  } else {
    showNotification(result.error, 'error');
  }
  
  return result;
}
```

---

## 5. Get User's Linked Social Accounts

**Endpoint:** `GET /api/auth/oauth/social-accounts`

**Description:** Retrieves all social accounts linked to the authenticated user.

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "socialAccounts": [
      {
        "id": "uuid-1",
        "provider": "google",
        "providerUserId": "123456789",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "uuid-2", 
        "provider": "facebook",
        "providerUserId": "987654321",
        "createdAt": "2024-01-16T14:20:00.000Z"
      }
    ]
  }
}
```

**Example Request:**
```bash
curl -X GET http://localhost:8080/api/auth/oauth/social-accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Usage in Frontend:**
```javascript
async function getLinkedSocialAccounts() {
  const response = await fetch('/api/auth/oauth/social-accounts', {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  
  const { data } = await response.json();
  
  // Display linked accounts
  data.socialAccounts.forEach(account => {
    console.log(`Linked ${account.provider} account: ${account.providerUserId}`);
  });
  
  return data.socialAccounts;
}
```

---

## 6. Unlink Social Account

**Endpoint:** `DELETE /api/auth/oauth/unlink-account/:accountId`

**Description:** Unlinks a social account from the authenticated user.

**Parameters:**
- `accountId` (path): UUID of the social account to unlink

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "Social account unlinked successfully"
}
```

**Error Responses:**

**Social Account Not Found:**
```json
{
  "error": "Social account not found",
  "code": "SOCIAL_ACCOUNT_NOT_FOUND"
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/api/auth/oauth/unlink-account/uuid-here \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Usage in Frontend:**
```javascript
async function unlinkSocialAccount(accountId) {
  const response = await fetch(`/api/auth/oauth/unlink-account/${accountId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    showNotification('Social account unlinked successfully', 'success');
    // Refresh social accounts list
    await getLinkedSocialAccounts();
  } else {
    showNotification(result.error, 'error');
  }
  
  return result;
}
```

---

## Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_PROVIDER` | Unsupported OAuth provider | 400 |
| `OAUTH_CONFIG_ERROR` | OAuth not properly configured | 500 |
| `OAUTH_AUTHENTICATION_FAILED` | OAuth authentication failed | 500 |
| `ACCOUNT_PENDING_APPROVAL` | Account pending admin approval | 401 |
| `ACCOUNT_REJECTED` | Account registration was rejected | 401 |
| `USER_NOT_FOUND` | User not found | 404 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `SOCIAL_ACCOUNT_EXISTS` | Social account already linked | 409 |
| `SOCIAL_ACCOUNT_NOT_FOUND` | Social account not found | 404 |
| `AUTHENTICATION_REQUIRED` | Authentication required | 401 |
| `INTERNAL_ERROR` | Internal server error | 500 |

---

## Testing Scenarios

### 1. OAuth Provider Configuration Test

**Test:** Verify OAuth providers are properly configured

```bash
# Test providers endpoint
curl -X GET http://localhost:8080/api/auth/oauth/providers

# Expected: Empty providers array when not configured
# Expected: Providers list when configured
```

### 2. OAuth Authentication Flow Test

**Test:** Complete OAuth authentication flow

```bash
# 1. Get available providers
curl -X GET http://localhost:8080/api/auth/oauth/providers

# 2. Initiate OAuth (should redirect or show error)
curl -L http://localhost:8080/api/auth/oauth/google

# 3. Test with invalid provider
curl -X GET http://localhost:8080/api/auth/oauth/invalid
```

### 3. Social Account Management Test

**Test:** Link and unlink social accounts

```bash
# 1. Get access token (login first)
TOKEN="your_access_token_here"

# 2. Link social account
curl -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "providerUserId": "test123",
    "profileData": {"id": "test123", "email": "test@example.com"}
  }'

# 3. Get linked accounts
curl -X GET http://localhost:8080/api/auth/oauth/social-accounts \
  -H "Authorization: Bearer $TOKEN"

# 4. Unlink account (use account ID from step 3)
curl -X DELETE http://localhost:8080/api/auth/oauth/unlink-account/account-id-here \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Error Handling Test

**Test:** Verify proper error responses

```bash
# Test invalid provider
curl -X GET http://localhost:8080/api/auth/oauth/invalid

# Test unauthenticated access to protected endpoints
curl -X GET http://localhost:8080/api/auth/oauth/social-accounts

# Test invalid request body
curl -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

---

## Frontend Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const OAuthLogin = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/auth/oauth/providers');
      const { data } = await response.json();
      setProviders(data.providers);
    } catch (error) {
      console.error('Failed to fetch OAuth providers:', error);
    }
  };

  const handleOAuthLogin = (provider, persona = 'builder') => {
    setLoading(true);
    const url = `/api/auth/oauth/${provider}?persona=${persona}`;
    window.location.href = url;
  };

  return (
    <div className="oauth-login">
      <h2>Login with OAuth</h2>
      {providers.length === 0 ? (
        <p>No OAuth providers available</p>
      ) : (
        <div className="oauth-buttons">
          {providers.map(provider => (
            <button
              key={provider.name}
              onClick={() => handleOAuthLogin(provider.name)}
              disabled={loading}
              className={`oauth-button ${provider.name}`}
            >
              Continue with {provider.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OAuthLogin;
```

### Social Account Management Component

```jsx
import React, { useState, useEffect } from 'react';

const SocialAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSocialAccounts();
  }, []);

  const fetchSocialAccounts = async () => {
    try {
      const response = await fetch('/api/auth/oauth/social-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const { data } = await response.json();
      setAccounts(data.socialAccounts);
    } catch (error) {
      console.error('Failed to fetch social accounts:', error);
    }
  };

  const unlinkAccount = async (accountId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/oauth/unlink-account/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSocialAccounts(); // Refresh list
        alert('Account unlinked successfully');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to unlink account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="social-accounts">
      <h2>Linked Social Accounts</h2>
      {accounts.length === 0 ? (
        <p>No social accounts linked</p>
      ) : (
        <div className="accounts-list">
          {accounts.map(account => (
            <div key={account.id} className="account-item">
              <span className="provider">{account.provider}</span>
              <span className="user-id">{account.providerUserId}</span>
              <button
                onClick={() => unlinkAccount(account.id)}
                disabled={loading}
                className="unlink-button"
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialAccounts;
```

---

## Environment Configuration

### Required Environment Variables

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
OAUTH_CALLBACK_URL=http://localhost:8080/api/auth/oauth/callback

# JWT Configuration (for OAuth tokens)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### OAuth Provider Setup

#### Google OAuth 2.0 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure authorized redirect URIs:
   - `http://localhost:8080/api/auth/oauth/callback/google` (development)
   - `https://yourdomain.com/api/auth/oauth/callback/google` (production)

#### Facebook Login Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:8080/api/auth/oauth/callback/facebook` (development)
   - `https://yourdomain.com/api/auth/oauth/callback/facebook` (production)

---

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production for OAuth callbacks
2. **State Parameter**: OAuth state is used to pass persona information securely
3. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended)
4. **Profile Data**: OAuth profile data is stored encrypted in the database
5. **Approval Workflow**: All OAuth users go through admin approval
6. **Account Linking**: Prevents duplicate social accounts across users
7. **Error Handling**: Sensitive information is not exposed in error messages

---

## Troubleshooting

### Common Issues

1. **"OAuth not properly configured"**
   - Check environment variables are set correctly
   - Verify OAuth provider credentials are valid
   - Ensure callback URLs match provider configuration

2. **"Invalid OAuth provider"**
   - Only 'google' and 'facebook' are supported
   - Check provider name spelling

3. **"Social account already linked"**
   - OAuth account is already linked to another user
   - Use existing account or contact support

4. **"Account pending approval"**
   - New OAuth users require admin approval
   - Contact system administrator

5. **"Authentication failed"**
   - OAuth provider returned an error
   - Check provider configuration and credentials

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will provide detailed OAuth flow information in server logs.
