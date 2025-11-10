# Sip-It Backend API

A scalable backend for a social cafe discovery app where users can find cafes nearby, rate them on four metrics (food, drinks, ambience, service), and follow friends to see their reviews.

## Features

- **User Authentication**: Email/password and OAuth (Google, Apple) via Supabase
- **Personality Profiling**: MBTI personality type integration
- **Location-Based Discovery**: Find cafes nearby using Google Places API
- **Smart Recommendations**: Cafes sorted by user's current mood metric
- **Social Features**: Follow users, view friends' reviews, social feed
- **Reviews & Ratings**: 4-metric rating system (food, drinks, ambience, service)
- **Notifications**: Push notifications for new cafes, friend activity, weekly recommendations
- **File Uploads**: Profile pictures and review photos via AWS S3
- **Performance**: Redis caching, database indexing, rate limiting

## Tech Stack

- **Framework**: Node.js + Fastify + TypeScript
- **Database**: PostgreSQL with PostGIS extension
- **Cache**: Redis
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **File Storage**: AWS S3
- **Push Notifications**: Firebase Cloud Messaging
- **APIs**: Google Maps & Places API

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL 15+ with PostGIS
- Redis 7+
- Docker & Docker Compose (optional)

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase credentials
- `GOOGLE_MAPS_API_KEY`: Google Maps API key
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`: AWS S3 configuration
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`: Firebase credentials

## Installation

### Using Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Manual Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register with email/password
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/oauth` - OAuth login (Google/Apple)
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users/follow/:id` - Follow user
- `DELETE /api/v1/users/unfollow/:id` - Unfollow user
- `GET /api/v1/users/:id/followers` - Get followers
- `GET /api/v1/users/:id/following` - Get following
- `GET /api/v1/users/:id/reviews` - Get user's reviews

### Preferences
- `PUT /api/v1/preferences/mood` - Update current mood metric
- `PUT /api/v1/preferences/radius` - Update search radius
- `PUT /api/v1/preferences/notifications` - Update notification settings
- `GET /api/v1/preferences/should-show-mood-prompt` - Check if should show mood prompt (6 hours)

### Cafes
- `GET /api/v1/cafes/nearby` - Get cafes nearby (sorted by mood metric)
- `GET /api/v1/cafes/:id` - Get cafe details
- `GET /api/v1/cafes/search` - Search cafes by name
- `POST /api/v1/cafes/sync/:googlePlaceId` - Sync cafe from Google Places

### Reviews
- `POST /api/v1/reviews` - Create review
- `PUT /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review
- `GET /api/v1/reviews/cafe/:cafeId` - Get cafe reviews

### Feed
- `GET /api/v1/feed` - Get feed from followed users
- `GET /api/v1/feed/discover` - Get discover feed (popular reviews nearby)

### Upload
- `POST /api/v1/upload/presigned-url` - Generate presigned URL for S3 upload
- `POST /api/v1/upload` - Direct file upload

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

## Database Schema

Main entities:
- **Users**: User accounts with personality types
- **UserPreferences**: User settings (mood metric, radius, notifications)
- **Cafes**: Cafe information from Google Places
- **CafeRatings**: Aggregated ratings per metric
- **Reviews**: User reviews with 4-metric ratings
- **Follows**: User follow relationships
- **Notifications**: Push notifications

## Performance Features

### Caching Strategy
- Nearby cafes cached for 1 hour
- User preferences cached for 5 minutes
- Cafe ratings cached for 30 minutes

### Database Optimization
- Geospatial indexing for location queries
- Foreign key indexes
- Composite indexes on frequently queried fields

### Rate Limiting
- 100 requests per minute per user
- Configurable via environment variables

## Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Configure production database with connection pooling
3. Setup Redis with persistence
4. Configure CORS origins
5. Enable HTTPS
6. Setup monitoring and logging
7. Configure CDN for S3 assets
8. Setup automated backups

### Scaling
- Horizontal scaling ready (stateless API)
- Database read replicas for read-heavy operations
- Redis cluster for high availability
- CDN for static assets
- Load balancer for multiple API instances

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Generate Prisma client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT
