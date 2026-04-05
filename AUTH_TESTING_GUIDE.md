# Authentication System Testing Guide

This guide provides comprehensive testing commands for the NestJS authentication system using HTTPie (command-line) and Postman examples.

## Base URL
```
http://localhost:3001
```

## 1. User Registration

### HTTPie Command
```bash
http POST localhost:3001/auth/register \
  email="test@example.com" \
  password="Password123!" \
  firstName="John" \
  lastName="Doe" \
  phone="+201234567890" \
  country="Egypt" \
  city="Cairo" \
  language="en"
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/register`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+201234567890",
  "country": "Egypt",
  "city": "Cairo",
  "language": "en"
}
```

### Expected Success Response (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "test@example.com",
      "role": "USER",
      "isActive": true,
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "language": "en"
      }
    },
    "accessToken": "jwt-access-token"
  }
}
```

### Error Responses
- **400 Bad Request**: Validation errors
```json
{
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400
}
```

- **409 Conflict**: Email already exists
```json
{
  "message": "Email already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

## 2. User Login

### HTTPie Command
```bash
http POST localhost:3001/auth/login \
  email="test@example.com" \
  password="Password123!" \
  --cookie-jar cookies.txt
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "test@example.com",
      "role": "USER",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "accessToken": "jwt-access-token"
  }
}
```

### Error Responses
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Invalid credentials

## 3. Refresh Access Token

### HTTPie Command
```bash
http POST localhost:3001/auth/refresh \
  --cookie cookies.txt \
  --cookie-jar cookies.txt
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/refresh`
- **Headers**: `Content-Type: application/json`
- **Cookies**: Automatically include refresh_token cookie from login response

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-access-token"
  }
}
```

## 4. Get Current User Profile

### HTTPie Command
```bash
http GET localhost:3001/auth/me \
  "Authorization:Bearer YOUR_ACCESS_TOKEN"
```

### Postman Setup
- **Method**: GET
- **URL**: `{{baseUrl}}/auth/me`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{accessToken}}`

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "test@example.com",
      "role": "USER",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "language": "en"
      }
    }
  }
}
```

## 5. User Logout

### HTTPie Command
```bash
http POST localhost:3001/auth/logout \
  "Authorization:Bearer YOUR_ACCESS_TOKEN" \
  --cookie cookies.txt
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/logout`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{accessToken}}`
- **Cookies**: Include refresh_token cookie

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## 6. Forgot Password

### HTTPie Command
```bash
http POST localhost:3001/auth/forgot-password \
  email="test@example.com"
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/forgot-password`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "test@example.com"
}
```

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

## 7. Reset Password

### HTTPie Command
```bash
http POST localhost:3001/auth/reset-password \
  token="reset-token-from-email" \
  newPassword="NewPassword123!"
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/reset-password`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123!"
}
```

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

## 8. Change Password (Authenticated)

### HTTPie Command
```bash
http POST localhost:3001/auth/change-password \
  "Authorization:Bearer YOUR_ACCESS_TOKEN" \
  currentPassword="Password123!" \
  newPassword="NewPassword123!"
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/change-password`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{accessToken}}`
- **Body** (raw JSON):
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!"
}
```

## 9. Admin Login

### HTTPie Command
```bash
http POST localhost:3001/auth/admin/login \
  email="admin@example.com" \
  password="AdminPassword123!" \
  --cookie-jar admin-cookies.txt
```

### Postman Setup
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/admin/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

## Testing Script (Bash)

Create a test script `test-auth.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001"
EMAIL="test$(date +%s)@example.com"
PASSWORD="Password123!"

echo "🧪 Testing Authentication System"
echo "=================================="

# 1. Register
echo "1. Testing Registration..."
REGISTER_RESPONSE=$(http POST $BASE_URL/auth/register \
  email="$EMAIL" \
  password="$PASSWORD" \
  firstName="Test" \
  lastName="User" \
  country="Egypt" \
  --print=b)

echo "$REGISTER_RESPONSE" | jq .

# Extract access token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken')
echo "Access Token: $ACCESS_TOKEN"

# 2. Login
echo -e "\n2. Testing Login..."
LOGIN_RESPONSE=$(http POST $BASE_URL/auth/login \
  email="$EMAIL" \
  password="$PASSWORD" \
  --cookie-jar cookies.txt \
  --print=b)

echo "$LOGIN_RESPONSE" | jq .

# 3. Get Current User
echo -e "\n3. Testing Get Current User..."
http GET $BASE_URL/auth/me \
  "Authorization:Bearer $ACCESS_TOKEN" | jq .

# 4. Refresh Token
echo -e "\n4. Testing Refresh Token..."
http POST $BASE_URL/auth/refresh \
  --cookie cookies.txt | jq .

# 5. Logout
echo -e "\n5. Testing Logout..."
http POST $BASE_URL/auth/logout \
  "Authorization:Bearer $ACCESS_TOKEN" \
  --cookie cookies.txt | jq .

echo -e "\n✅ Testing Complete!"
```

Make it executable:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

## Postman Collection

Import this Postman collection:

```json
{
  "info": {
    "name": "CareerHub Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Password123!\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"country\": \"Egypt\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/auth/register",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "register"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Password123!\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "login"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const response = pm.response.json();",
              "    if (response.success && response.data.accessToken) {",
              "        pm.collectionVariables.set('accessToken', response.data.accessToken);",
              "    }",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/auth/me",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "me"]
        }
      }
    }
  ]
}
```

## Common Testing Issues & Solutions

### 1. CORS Errors
- Ensure backend allows `http://localhost:3000` (or your frontend URL)
- Check that credentials are included in requests

### 2. Cookie Issues
- Use `credentials: 'include'` in fetch requests
- Ensure cookies are being set with correct domain/path

### 3. Token Issues
- Check that JWT secrets are properly configured
- Verify token expiration times
- Ensure refresh tokens are stored securely

### 4. Validation Errors
- Check that all required fields are included
- Verify field formats (email, password complexity)
- Ensure Content-Type header is set to `application/json`

### 5. Database Connection
- Ensure Prisma is properly connected
- Check that database schema is up to date
- Verify user permissions

## Environment Variables Required

```bash
# Backend .env
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_URL=your-database-connection-string
NODE_ENV=development
```

This comprehensive testing guide covers all authentication endpoints with proper error handling and debugging capabilities.
