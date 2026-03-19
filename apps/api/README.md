# CareerHub API

A comprehensive NestJS-based API for the CareerHub platform, providing career development, online learning, coaching, and payment processing capabilities.

## Features

- **User Management**: Authentication, authorization, profile management
- **Career Development**: Career paths, assessments, recommendations
- **Course Management**: Course creation, enrollment, progress tracking
- **Video Streaming**: Video upload, processing, and streaming
- **Certificates**: Certificate generation and management
- **Coaching**: Session scheduling and management
- **Payments**: Stripe integration for payment processing
- **Notifications**: Email, push, and SMS notifications
- **Analytics**: Comprehensive analytics and reporting
- **Admin Panel**: Full administrative capabilities
- **File Upload**: Secure file upload and management
- **Health Monitoring**: System health checks and monitoring

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **File Storage**: AWS S3
- **Video Processing**: Cloudflare Stream
- **Payments**: Stripe
- **Email**: SendGrid
- **Push Notifications**: Firebase Cloud Messaging
- **SMS**: Twilio
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis
- AWS S3 bucket
- Stripe account
- Firebase project
- SendGrid account
- Twilio account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd careerhub/apps/api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Start the development server:
```bash
npm run start:dev
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/careerhub"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"

# SendGrid
SENDGRID_API_KEY="SG.your-api-key"

# Firebase
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"

# Twilio
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Frontend URLs
FRONTEND_URL="http://localhost:3000"
LEARN_URL="http://localhost:3002"

# API Configuration
PORT=4000
NODE_ENV="development"
API_PREFIX="api"
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:
```
http://localhost:4000/api/docs
```

## Project Structure

```
src/
├── common/                 # Shared utilities and decorators
│   ├── decorators/        # Custom decorators
│   ├── dto/              # Data transfer objects
│   ├── filters/          # Exception filters
│   ├── guards/           # Route guards
│   ├── interceptors/     # Response interceptors
│   ├── middleware/       # Custom middleware
│   ├── pipes/            # Validation pipes
│   └── utils/            # Utility functions
├── modules/               # Feature modules
│   ├── admin/            # Admin functionality
│   ├── analytics/        # Analytics and reporting
│   ├── auth/             # Authentication
│   ├── career/           # Career paths and assessments
│   ├── certificates/     # Certificate management
│   ├── coaching/         # Coaching sessions
│   ├── courses/          # Course management
│   ├── health/           # Health checks
│   ├── lessons/          # Lesson content
│   ├── notifications/    # Notification system
│   ├── payments/         # Payment processing
│   ├── upload/           # File upload
│   ├── users/            # User management
│   └── video/            # Video streaming
├── prisma/               # Database schema and migrations
├── app.module.ts         # Root module
├── main.ts               # Application entry point
└── ...                   # Other configuration files
```

## Available Scripts

- `npm run start` - Start the application in production mode
- `npm run start:dev` - Start the application in development mode
- `npm run start:debug` - Start the application in debug mode
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Run linting
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

### Courses
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/progress` - Get course progress

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Manage users
- `GET /api/admin/courses` - Manage courses
- `GET /api/admin/analytics` - View analytics

## Database Schema

The application uses Prisma as the ORM. The schema is defined in `prisma/schema.prisma` and includes models for:

- Users and profiles
- Courses and lessons
- Enrollments and progress
- Payments and subscriptions
- Certificates
- Coaching sessions
- Notifications
- Analytics events

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers (Helmet)
- File upload validation
- SQL injection prevention (Prisma)

## Monitoring and Logging

- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance monitoring
- Health check endpoints
- System metrics

## Testing

The application includes comprehensive test coverage:

- Unit tests for services and utilities
- Integration tests for controllers
- End-to-end tests for critical flows
- Test fixtures and factories

## Deployment

### Docker

```bash
# Build the image
docker build -t careerhub-api .

# Run the container
docker run -p 4000:4000 careerhub-api
```

### Environment Variables for Production

Ensure all required environment variables are set in production:

- Database connection string
- JWT secrets
- Third-party API keys
- File storage credentials
- Email and SMS service credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
