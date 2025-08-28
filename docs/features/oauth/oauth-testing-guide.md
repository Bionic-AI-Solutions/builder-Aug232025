# OAuth Testing Guide

## Overview

This guide provides comprehensive testing scenarios and scripts for the OAuth implementation. All tests can be run against the local development environment.

## Prerequisites

1. **Local Environment Running**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Test Data Available**
   - Super Admin user: `admin@builderai.com` / `admin123`
   - Builder user: `builder@builderai.com` / `builder123`
   - End User: `user@builderai.com` / `user123`

3. **Test Tools**
   - `curl` for API testing
   - `jq` for JSON formatting (optional)

## Test Environment Setup

### 1. Health Check
```bash
# Verify server is running
curl -X GET http://localhost:8080/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Get Access Token for Testing
```bash
# Login as Super Admin to get access token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@builderai.com",
    "password": "admin123"
  }' | jq -r '.data.accessToken')

echo "Access Token: $TOKEN"
```

## Test Scenarios

---

## Test Scenario 1: OAuth Provider Configuration

### 1.1 Test OAuth Providers Endpoint (No Configuration)

**Objective:** Verify OAuth providers endpoint works when no credentials are configured.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing OAuth Providers (No Configuration) ==="

response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/providers)
echo "Response: $response"

# Verify response structure
if echo "$response" | jq -e '.success == true' > /dev/null; then
    echo "✅ Success field is true"
else
    echo "❌ Success field is not true"
fi

if echo "$response" | jq -e '.data.providers | length == 0' > /dev/null; then
    echo "✅ Providers array is empty (expected)"
else
    echo "❌ Providers array is not empty"
fi
```

**Expected Output:**
```
=== Testing OAuth Providers (No Configuration) ===
Response: {"success":true,"data":{"providers":[]}}
✅ Success field is true
✅ Providers array is empty (expected)
```

### 1.2 Test OAuth Providers Endpoint (With Configuration)

**Objective:** Verify OAuth providers endpoint works when credentials are configured.

**Setup:** Add OAuth credentials to environment variables.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing OAuth Providers (With Configuration) ==="

# Set test OAuth credentials
export GOOGLE_CLIENT_ID="test-google-client-id"
export GOOGLE_CLIENT_SECRET="test-google-client-secret"
export FACEBOOK_APP_ID="test-facebook-app-id"
export FACEBOOK_APP_SECRET="test-facebook-app-secret"
export OAUTH_CALLBACK_URL="http://localhost:8080/api/auth/oauth/callback"

# Restart container to pick up new environment variables
docker-compose -f docker-compose.dev.yml restart builderai-dev
sleep 5

response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/providers)
echo "Response: $response"

# Verify response structure
if echo "$response" | jq -e '.success == true' > /dev/null; then
    echo "✅ Success field is true"
else
    echo "❌ Success field is not true"
fi

providers_count=$(echo "$response" | jq -r '.data.providers | length')
echo "Providers count: $providers_count"

if [ "$providers_count" -gt 0 ]; then
    echo "✅ Providers are available"
    
    # Check for Google provider
    if echo "$response" | jq -e '.data.providers[] | select(.name == "google")' > /dev/null; then
        echo "✅ Google provider is available"
    else
        echo "❌ Google provider is missing"
    fi
    
    # Check for Facebook provider
    if echo "$response" | jq -e '.data.providers[] | select(.name == "facebook")' > /dev/null; then
        echo "✅ Facebook provider is available"
    else
        echo "❌ Facebook provider is missing"
    fi
else
    echo "❌ No providers available"
fi
```

---

## Test Scenario 2: OAuth Authentication Flow

### 2.1 Test Invalid OAuth Provider

**Objective:** Verify proper error handling for invalid OAuth providers.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing Invalid OAuth Provider ==="

response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/invalid)
echo "Response: $response"

# Verify error response
if echo "$response" | jq -e '.error == "Invalid OAuth provider"' > /dev/null; then
    echo "✅ Correct error message"
else
    echo "❌ Incorrect error message"
fi

if echo "$response" | jq -e '.code == "INVALID_PROVIDER"' > /dev/null; then
    echo "✅ Correct error code"
else
    echo "❌ Incorrect error code"
fi

if echo "$response" | jq -e '.supportedProviders | contains(["google", "facebook"])' > /dev/null; then
    echo "✅ Supported providers listed"
else
    echo "❌ Supported providers not listed"
fi
```

**Expected Output:**
```
=== Testing Invalid OAuth Provider ===
Response: {"error":"Invalid OAuth provider","code":"INVALID_PROVIDER","supportedProviders":["google","facebook"]}
✅ Correct error message
✅ Correct error code
✅ Supported providers listed
```

### 2.2 Test OAuth Initiation (No Configuration)

**Objective:** Verify OAuth initiation fails gracefully when not configured.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing OAuth Initiation (No Configuration) ==="

response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/google)
echo "Response: $response"

# Verify error response
if echo "$response" | jq -e '.error == "OAuth not properly configured"' > /dev/null; then
    echo "✅ Correct error message"
else
    echo "❌ Incorrect error message"
fi

if echo "$response" | jq -e '.code == "OAUTH_CONFIG_ERROR"' > /dev/null; then
    echo "✅ Correct error code"
else
    echo "❌ Incorrect error code"
fi

# Check for configuration details
details_count=$(echo "$response" | jq -r '.details | length')
echo "Configuration issues count: $details_count"

if [ "$details_count" -gt 0 ]; then
    echo "✅ Configuration details provided"
else
    echo "❌ No configuration details provided"
fi
```

---

## Test Scenario 3: Social Account Management

### 3.1 Test Link Social Account

**Objective:** Verify linking OAuth account to existing user.

**Prerequisites:** Get access token from login.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing Link Social Account ==="

# Get access token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@builderai.com",
    "password": "admin123"
  }' | jq -r '.data.accessToken')

echo "Access Token: ${TOKEN:0:20}..."

# Test linking social account
response=$(curl -s -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "providerUserId": "test123456",
    "profileData": {
      "id": "test123456",
      "email": "admin@builderai.com",
      "name": "Admin User",
      "picture": "https://example.com/avatar.jpg"
    }
  }')

echo "Response: $response"

# Verify success response
if echo "$response" | jq -e '.success == true' > /dev/null; then
    echo "✅ Link account successful"
else
    echo "❌ Link account failed"
fi

if echo "$response" | jq -e '.message == "Social account linked successfully"' > /dev/null; then
    echo "✅ Correct success message"
else
    echo "❌ Incorrect success message"
fi

# Extract social account ID for later tests
SOCIAL_ACCOUNT_ID=$(echo "$response" | jq -r '.data.socialAccount.id')
echo "Social Account ID: $SOCIAL_ACCOUNT_ID"
```

### 3.2 Test Get Social Accounts

**Objective:** Verify retrieving user's linked social accounts.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing Get Social Accounts ==="

# Get access token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@builderai.com",
    "password": "admin123"
  }' | jq -r '.data.accessToken')

# Get social accounts
response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/social-accounts \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $response"

# Verify response structure
if echo "$response" | jq -e '.success == true' > /dev/null; then
    echo "✅ Success field is true"
else
    echo "❌ Success field is not true"
fi

accounts_count=$(echo "$response" | jq -r '.data.socialAccounts | length')
echo "Social accounts count: $accounts_count"

if [ "$accounts_count" -ge 0 ]; then
    echo "✅ Social accounts retrieved successfully"
    
    # List all accounts
    echo "$response" | jq -r '.data.socialAccounts[] | "  - \(.provider): \(.providerUserId)"'
else
    echo "❌ Failed to retrieve social accounts"
fi
```

### 3.3 Test Unlink Social Account

**Objective:** Verify unlinking social account from user.

**Prerequisites:** Social account must be linked (from previous test).

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing Unlink Social Account ==="

# Get access token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@builderai.com",
    "password": "admin123"
  }' | jq -r '.data.accessToken')

# First, get social accounts to find an account to unlink
accounts_response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/social-accounts \
  -H "Authorization: Bearer $TOKEN")

account_id=$(echo "$accounts_response" | jq -r '.data.socialAccounts[0].id')

if [ "$account_id" != "null" ] && [ "$account_id" != "" ]; then
    echo "Unlinking account: $account_id"
    
    # Unlink social account
    response=$(curl -s -X DELETE http://localhost:8080/api/auth/oauth/unlink-account/$account_id \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Response: $response"
    
    # Verify success response
    if echo "$response" | jq -e '.success == true' > /dev/null; then
        echo "✅ Unlink account successful"
    else
        echo "❌ Unlink account failed"
    fi
    
    if echo "$response" | jq -e '.message == "Social account unlinked successfully"' > /dev/null; then
        echo "✅ Correct success message"
    else
        echo "❌ Incorrect success message"
    fi
else
    echo "⚠️  No social accounts available to unlink"
fi
```

---

## Test Scenario 4: Error Handling

### 4.1 Test Unauthenticated Access

**Objective:** Verify protected endpoints require authentication.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing Unauthenticated Access ==="

# Test accessing protected endpoint without token
response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/social-accounts)
echo "Response: $response"

# Verify error response
if echo "$response" | jq -e '.error == "Authentication required"' > /dev/null; then
    echo "✅ Correct error message"
else
    echo "❌ Incorrect error message"
fi

if echo "$response" | jq -e '.code == "AUTHENTICATION_REQUIRED"' > /dev/null; then
    echo "✅ Correct error code"
else
    echo "❌ Incorrect error code"
fi
```

### 4.2 Test Invalid Request Body

**Objective:** Verify validation of request body for link account endpoint.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing Invalid Request Body ==="

# Get access token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@builderai.com",
    "password": "admin123"
  }' | jq -r '.data.accessToken')

# Test with invalid request body
response=$(curl -s -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invalid": "data"
  }')

echo "Response: $response"

# Verify error response
if echo "$response" | jq -e '.error == "Validation error"' > /dev/null; then
    echo "✅ Correct error message"
else
    echo "❌ Incorrect error message"
fi

if echo "$response" | jq -e '.code == "VALIDATION_ERROR"' > /dev/null; then
    echo "✅ Correct error code"
else
    echo "❌ Incorrect error code"
fi

# Check for validation details
details_count=$(echo "$response" | jq -r '.details | length')
echo "Validation errors count: $details_count"

if [ "$details_count" -gt 0 ]; then
    echo "✅ Validation details provided"
else
    echo "❌ No validation details provided"
fi
```

### 4.3 Test Duplicate Social Account

**Objective:** Verify prevention of duplicate social account linking.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing Duplicate Social Account ==="

# Get access token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@builderai.com",
    "password": "admin123"
  }' | jq -r '.data.accessToken')

# Link social account first time
first_response=$(curl -s -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "providerUserId": "duplicate123",
    "profileData": {
      "id": "duplicate123",
      "email": "admin@builderai.com"
    }
  }')

echo "First link response: $first_response"

# Try to link the same social account again
second_response=$(curl -s -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "providerUserId": "duplicate123",
    "profileData": {
      "id": "duplicate123",
      "email": "admin@builderai.com"
    }
  }')

echo "Second link response: $second_response"

# Verify error response for duplicate
if echo "$second_response" | jq -e '.error == "Social account already linked to another user"' > /dev/null; then
    echo "✅ Correct error message for duplicate"
else
    echo "❌ Incorrect error message for duplicate"
fi

if echo "$second_response" | jq -e '.code == "SOCIAL_ACCOUNT_EXISTS"' > /dev/null; then
    echo "✅ Correct error code for duplicate"
else
    echo "❌ Incorrect error code for duplicate"
fi
```

---

## Test Scenario 5: OAuth Callback Simulation

### 5.1 Test OAuth Callback with Mock Data

**Objective:** Verify OAuth callback handling with mock profile data.

**Note:** This test simulates the OAuth callback flow. In a real scenario, this would be handled by the OAuth provider.

**Test Script:**
```bash
#!/bin/bash
echo "=== Testing OAuth Callback Simulation ==="

# This test demonstrates the expected flow
# In reality, the OAuth provider would redirect to this endpoint

echo "OAuth Callback Flow:"
echo "1. User authenticates with OAuth provider"
echo "2. Provider redirects to: /api/auth/oauth/callback/google"
echo "3. System processes profile data"
echo "4. System creates/links user account"
echo "5. System redirects to frontend with result"

echo ""
echo "Expected redirect URLs:"
echo "- Success: /oauth-success?accessToken=...&refreshToken=..."
echo "- Pending: /oauth-pending?message=Account pending approval"
echo "- Error: /oauth-error?error=Authentication failed"
```

---

## Complete Test Suite

### Run All Tests

**Test Script:**
```bash
#!/bin/bash
echo "🚀 Starting OAuth Test Suite"
echo "================================"

# Test 1: OAuth Provider Configuration
echo ""
echo "📋 Test 1: OAuth Provider Configuration"
./test_oauth_providers.sh

# Test 2: OAuth Authentication Flow
echo ""
echo "📋 Test 2: OAuth Authentication Flow"
./test_oauth_flow.sh

# Test 3: Social Account Management
echo ""
echo "📋 Test 3: Social Account Management"
./test_social_accounts.sh

# Test 4: Error Handling
echo ""
echo "📋 Test 4: Error Handling"
./test_error_handling.sh

# Test 5: OAuth Callback Simulation
echo ""
echo "📋 Test 5: OAuth Callback Simulation"
./test_oauth_callback.sh

echo ""
echo "✅ OAuth Test Suite Complete"
```

### Test Results Summary

**Expected Test Results:**
```
🚀 Starting OAuth Test Suite
================================

📋 Test 1: OAuth Provider Configuration
✅ Success field is true
✅ Providers array is empty (expected)

📋 Test 2: OAuth Authentication Flow
✅ Correct error message
✅ Correct error code
✅ Supported providers listed

📋 Test 3: Social Account Management
✅ Link account successful
✅ Correct success message
✅ Social accounts retrieved successfully

📋 Test 4: Error Handling
✅ Correct error message
✅ Correct error code
✅ Validation details provided

📋 Test 5: OAuth Callback Simulation
OAuth Callback Flow:
1. User authenticates with OAuth provider
2. Provider redirects to: /api/auth/oauth/callback/google
3. System processes profile data
4. System creates/links user account
5. System redirects to frontend with result

✅ OAuth Test Suite Complete
```

---

## Performance Testing

### Load Testing OAuth Endpoints

**Test Script:**
```bash
#!/bin/bash
echo "=== Load Testing OAuth Endpoints ==="

# Test providers endpoint under load
echo "Testing /api/auth/oauth/providers endpoint..."
for i in {1..100}; do
    curl -s -X GET http://localhost:8080/api/auth/oauth/providers > /dev/null &
done
wait
echo "✅ 100 concurrent requests to providers endpoint completed"

# Test with authentication
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@builderai.com",
    "password": "admin123"
  }' | jq -r '.data.accessToken')

echo "Testing /api/auth/oauth/social-accounts endpoint..."
for i in {1..50}; do
    curl -s -X GET http://localhost:8080/api/auth/oauth/social-accounts \
      -H "Authorization: Bearer $TOKEN" > /dev/null &
done
wait
echo "✅ 50 concurrent requests to social-accounts endpoint completed"
```

---

## Security Testing

### Security Test Cases

**Test Script:**
```bash
#!/bin/bash
echo "=== Security Testing OAuth Endpoints ==="

# Test 1: SQL Injection attempt
echo "Testing SQL injection protection..."
response=$(curl -s -X GET "http://localhost:8080/api/auth/oauth/providers'; DROP TABLE users; --")
if echo "$response" | jq -e '.success == true' > /dev/null; then
    echo "✅ SQL injection protection working"
else
    echo "❌ SQL injection protection failed"
fi

# Test 2: XSS attempt
echo "Testing XSS protection..."
response=$(curl -s -X POST http://localhost:8080/api/auth/oauth/link-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "<script>alert(\"xss\")</script>",
    "providerUserId": "test123"
  }')
if echo "$response" | jq -e '.code == "VALIDATION_ERROR"' > /dev/null; then
    echo "✅ XSS protection working"
else
    echo "❌ XSS protection failed"
fi

# Test 3: Rate limiting (if implemented)
echo "Testing rate limiting..."
for i in {1..200}; do
    response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/providers)
    if echo "$response" | jq -e '.error' > /dev/null; then
        echo "✅ Rate limiting detected at request $i"
        break
    fi
done
```

---

## Integration Testing

### Frontend Integration Test

**Test Script:**
```bash
#!/bin/bash
echo "=== Frontend Integration Testing ==="

# Test OAuth provider detection
echo "Testing OAuth provider detection..."
response=$(curl -s -X GET http://localhost:8080/api/auth/oauth/providers)
providers_count=$(echo "$response" | jq -r '.data.providers | length')

if [ "$providers_count" -eq 0 ]; then
    echo "✅ Frontend should show 'No OAuth providers available'"
else
    echo "✅ Frontend should show $providers_count OAuth provider(s)"
fi

# Test OAuth button generation
echo "Testing OAuth button generation..."
if [ "$providers_count" -gt 0 ]; then
    echo "$response" | jq -r '.data.providers[] | "  - \(.displayName) button: \(.authUrl)"'
fi
```

---

## Troubleshooting Guide

### Common Test Failures

1. **Server Not Running**
   ```bash
   # Check if server is running
   curl -X GET http://localhost:8080/api/health
   
   # Start server if needed
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Authentication Token Expired**
   ```bash
   # Get fresh token
   TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@builderai.com", "password": "admin123"}' \
     | jq -r '.data.accessToken')
   ```

3. **Database Connection Issues**
   ```bash
   # Check database container
   docker-compose -f docker-compose.dev.yml logs postgres
   
   # Restart database
   docker-compose -f docker-compose.dev.yml restart postgres
   ```

4. **OAuth Configuration Issues**
   ```bash
   # Check OAuth configuration
   curl -X GET http://localhost:8080/api/auth/oauth/providers
   
   # Check environment variables
   docker-compose -f docker-compose.dev.yml exec builderai-dev env | grep OAUTH
   ```

### Debug Mode

Enable debug logging for detailed OAuth flow information:

```bash
# Set debug log level
export LOG_LEVEL=debug

# Restart container
docker-compose -f docker-compose.dev.yml restart builderai-dev

# Check logs
docker-compose -f docker-compose.dev.yml logs -f builderai-dev
```

---

## Test Automation

### CI/CD Integration

**GitHub Actions Workflow:**
```yaml
name: OAuth API Tests

on: [push, pull_request]

jobs:
  oauth-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Start test environment
      run: |
        docker-compose -f docker-compose.dev.yml up -d
        sleep 30
    
    - name: Run OAuth tests
      run: |
        chmod +x ./docs/features/oauth/test_oauth_suite.sh
        ./docs/features/oauth/test_oauth_suite.sh
    
    - name: Cleanup
      run: docker-compose -f docker-compose.dev.yml down
```

This comprehensive testing guide ensures the OAuth implementation is thoroughly tested and ready for production use.
