# CareerHub API Setup Guide

## Prerequisites

Before setting up the CareerHub API, ensure you have the following installed:

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/platform-fastify
npm install @nestjs/config @nestjs/swagger @nestjs/throttler @nestjs/bull @nestjs/elastic
npm install @prisma/client prisma
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install bcryptjs argon2
npm install class-validator class-transformer
npm install aws-sdk sharp uuid validator
npm install helmet compression morgan winston
npm install nodemailer handlebars
npm install firebase-admin twilio stripe bull
npm install @elastic/elasticsearch puppeteer
npm install multer csv-parser
npm install reflect-metadata rxjs

# Development dependencies
npm install --save-dev @types/node @types/multer @types/uuid @types/validator
npm install --save-dev @types/nodemailer @types/csv-parser @types/sharp
npm install --save-dev @types/bcryptjs @types/argon2 @types/passport-jwt @types/passport-local
npm install --save-dev @types/aws-sdk
npm install --save-dev nodemon @nestjs/cli
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual configuration values.

### 3. Database Setup

#### PostgreSQL Setup

1. Create a database:
```sql
CREATE DATABASE careerhub;
```

2. Update your `.env` file with the database connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/careerhub"
```

#### Prisma Setup

1. Generate Prisma client:
```bash
npx prisma generate
```

2. Run database migrations:
```bash
npx prisma migrate dev --name init
```

3. (Optional) Seed the database:
```bash
npx prisma db seed
```

### 4. Redis Setup

Install and start Redis:

```bash
# On macOS with Homebrew
brew install redis
brew services start redis

# On Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# On Windows (using WSL)
sudo apt-get install redis-server
sudo systemctl start redis-server
```

Update your `.env` file with Redis configuration:
```env
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
```

### 5. External Services Setup

#### AWS S3 Setup

1. Create an AWS account if you don't have one
2. Create an S3 bucket
3. Create an IAM user with S3 access permissions
4. Update your `.env` file:
```env
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

#### Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Update your `.env` file:
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### Firebase Setup

1. Create a Firebase project
2. Generate a private key for service account
3. Update your `.env` file:
```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### SendGrid Setup

1. Create a SendGrid account
2. Generate an API key
3. Update your `.env` file:
```env
SENDGRID_API_KEY="SG.your-api-key"
EMAIL_FROM_NAME="CareerHub"
EMAIL_FROM_ADDRESS="noreply@careerhub.com"
```

#### Twilio Setup

1. Create a Twilio account
2. Get your account SID and auth token
3. Purchase a phone number
4. Update your `.env` file:
```env
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### 6. Running the Application

#### Development Mode

```bash
npm run start:dev
```

#### Production Mode

```bash
npm run build
npm run start:prod
```

### 7. API Documentation

Once the server is running, you can access the Swagger documentation at:
```
http://localhost:4000/api/docs
```

### 8. Health Check

Check if the application is running correctly:
```bash
curl http://localhost:4000/health
```

## Troubleshooting

### Common Issues

#### 1. Module Not Found Errors

If you encounter "Cannot find module" errors, run:
```bash
npm install
npx prisma generate
```

#### 2. Database Connection Errors

- Ensure PostgreSQL is running
- Check your database connection string in `.env`
- Verify the database exists

#### 3. Redis Connection Errors

- Ensure Redis is running
- Check Redis configuration in `.env`
- Verify Redis is accessible from your application

#### 4. Permission Errors

- Check file permissions for the project directory
- Ensure your user has access to required directories

#### 5. Port Already in Use

If port 4000 is already in use, you can either:
- Kill the process using the port:
  ```bash
  lsof -ti:4000 | xargs kill -9
  ```
- Or change the port in your `.env` file:
  ```env
  PORT=4001
  ```

### Development Tips

#### 1. Hot Reloading

The development server supports hot reloading. Changes to your code will automatically restart the server.

#### 2. Database Schema Changes

When making changes to the Prisma schema:
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your-migration-name`
3. Run `npx prisma generate` if you added new models

#### 3. Environment Variables

All environment variables are documented in `.env.example`. Copy this file to `.env` and update the values.

#### 4. Logging

The application uses Winston for logging. Log levels can be configured via the `LOG_LEVEL` environment variable.

#### 5. Testing

Run tests with:
```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Deployment

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t careerhub-api .
```

2. Run the container:
```bash
docker run -p 4000:4000 --env-file .env careerhub-api
```

### Environment Variables for Production

Ensure all required environment variables are set in production:
- Database connection string
- JWT secrets
- Third-party API keys
- File storage credentials

### Security Considerations

- Use strong, unique secrets in production
- Enable HTTPS
- Configure proper CORS settings
- Set up proper database security
- Regularly update dependencies
- Enable rate limiting
- Set up monitoring and alerting

## Support

For additional support:
1. Check the logs for error messages
2. Review the troubleshooting section above
3. Ensure all dependencies are properly installed
4. Verify environment configuration
5. Check external service status (database, Redis, etc.)

## Next Steps

After setting up the API:
1. Review the API documentation at `/api/docs`
2. Test the authentication endpoints
3. Set up your frontend application
4. Configure your external services
5. Set up monitoring and logging
6. Deploy to your production environment
