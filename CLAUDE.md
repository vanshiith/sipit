# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sip-It is a social cafe discovery app backend built with Fastify, TypeScript, PostgreSQL, Redis, and Firebase Auth. Users discover cafes nearby, rate them on four metrics (food, drinks, ambience, service), and follow friends to see their reviews.

**AI Prompts**: All prompts in this project use the Context7 MCP for enhanced AI assistance.

## Development Commands

```bash
# Development
npm run dev                  # Start dev server with hot reload (tsx watch)
PORT=3001 npm run dev        # Start dev server on custom port

# Database
npm run prisma:generate      # Generate Prisma client after schema changes
npm run prisma:migrate       # Create and run new migration
npm run prisma:studio        # Open Prisma Studio GUI

# Build & Production
npm run build                # Compile TypeScript to dist/
npm start                    # Run production server from dist/

# Code Quality
npm run lint                 # ESLint
npm run format               # Prettier
npm test                     # Jest

# Docker
docker-compose up -d         # Start PostgreSQL (port 5433) + Redis + API
docker-compose logs -f api   # View API logs
docker-compose down          # Stop all services
```

## Architecture

### Authentication Flow (Firebase)

The app uses **Firebase Authentication** (migrated from Supabase). Key architectural notes:

1. **Firebase Admin SDK** is initialized from `firebase-service-account.json` (not environment variables) in `src/services/firebase.ts`
2. **Email/Password auth** requires Firebase Console configuration to be enabled
3. **Token flow**:
   - Registration creates user in Firebase � creates user in PostgreSQL � returns Firebase ID token
   - Login verifies password via Firebase REST API � returns ID token
   - Protected endpoints verify ID token via Firebase Admin SDK in `src/middleware/auth.ts`

**Auth middleware** (`src/middleware/auth.ts`):
- `authenticate()`: Verifies Firebase token, checks user exists in PostgreSQL, attaches `request.user`
- `optionalAuthenticate()`: Same but doesn't fail if no token provided

### Route Structure

All routes are registered in `src/app.ts` with prefix `/api/v1/`:
- Auth: `/api/v1/auth/*` - Register, login, OAuth, logout, change password
- Users: `/api/v1/users/*` - Profile, follow/unfollow, user data
- Preferences: `/api/v1/preferences/*` - Mood metric, radius, notifications
- Cafes: `/api/v1/cafes/*` - Nearby search, details, sync from Google Places
- Reviews: `/api/v1/reviews/*` - CRUD operations
- Feed: `/api/v1/feed/*` - Following feed, discover feed
- Upload: `/api/v1/upload/*` - S3 presigned URLs, direct uploads
- Notifications: `/api/v1/notifications/*` - Push notifications, read status

Each route module follows the pattern:
- `routes/{domain}/index.ts` - Route definitions with Fastify schemas
- `routes/{domain}/handlers.ts` - Request handlers (business logic)
- `routes/{domain}/schemas.ts` - Zod validation schemas

### Database Architecture

**PostgreSQL + PostGIS** for geospatial queries. Key models:

- **User** � **UserPreferences** (1:1): Mood metric, radius, notification settings
- **Cafe**: Google Places data cached locally with lat/lng indexes
- **CafeRatings**: Denormalized aggregated ratings (updated on review create/update/delete)
- **Review**: 4 metrics (food, drinks, ambience, service) + photos + mood tags
- **Follow**: User-to-user relationships (bidirectional indexes)
- **Notification**: Push notification records

**Geospatial queries**: Use PostGIS extension for location-based cafe search. Indexes on `(latitude, longitude)`.

**Rating aggregation**: When a review is created/updated/deleted, `CafeRatings` is updated with new averages. This denormalization prevents expensive aggregation queries.

### Caching Strategy (Redis)

Redis is used for performance-critical data with TTLs configured in `src/config/index.ts`:

- **Nearby cafes**: 1 hour (3600s) - sorted by user's mood metric
- **User preferences**: 5 minutes (300s) - frequently accessed
- **Cafe ratings**: 30 minutes (1800s) - aggregated data

Cache keys follow pattern: `{domain}:{identifier}` (e.g., `cafe:nearby:37.7749:-122.4194:5`)

### Mood-Based Recommendations

Core feature: Users set a "mood metric" (FOOD, DRINKS, AMBIENCE, SERVICE) that:
1. Determines sorting order for nearby cafes
2. Asked every 6 hours (enforced in `/preferences/should-show-mood-prompt`)
3. Stored in `UserPreferences.currentMoodMetric` + `lastMoodUpdate`

The mood metric personalizes the cafe discovery experience.

## Important Integration Details

### Google Places API
- Cafes are synced from Google Places via `POST /cafes/sync/:googlePlaceId`
- Returns cafe details (name, address, photos, hours, phone, website)
- Data is cached in PostgreSQL to reduce API calls

### AWS S3
- Two upload methods: presigned URLs (client-direct) or server upload
- Folders: `profiles/` for profile pictures, `reviews/` for review photos
- Max file size: 10MB (enforced by multipart config in `src/app.ts`)

### Firebase Cloud Messaging
- Send push notifications via `src/services/firebase.ts`:
  - `sendNotification()`: Single device
  - `sendMulticastNotification()`: Multiple devices
- Notification types: `NEW_CAFE_NEARBY`, `FRIEND_REVIEW`, `NEW_FOLLOWER`, `WEEKLY_RECOMMENDATION`

## Configuration

All configuration is centralized in `src/config/index.ts` and loaded from environment variables:

**Required environment variables:**
- `DATABASE_URL`: PostgreSQL connection (Docker uses port 5433)
- `REDIS_HOST`, `REDIS_PORT`: Redis connection
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_WEB_API_KEY`: Firebase credentials
- `GOOGLE_MAPS_API_KEY`: Google Maps & Places API
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`: S3 upload

**Note**: `FIREBASE_PRIVATE_KEY` is in `.env` but **NOT USED** - the app reads from `firebase-service-account.json` instead.

## Common Patterns

### Adding a new endpoint
1. Create handler in `src/routes/{domain}/handlers.ts`
2. Add Zod schema in `src/routes/{domain}/schemas.ts`
3. Register route in `src/routes/{domain}/index.ts` with schema and auth middleware
4. Update route registration in `src/app.ts` if new domain

### Working with Prisma
After modifying `prisma/schema.prisma`:
```bash
npm run prisma:generate  # Regenerate client
npm run prisma:migrate   # Create migration
```

### Adding authentication to a route
```typescript
app.post('/endpoint', {
  preHandler: app.authenticate,  // Add this
  handler: yourHandler,
});
```

### Cache invalidation
When updating data, invalidate related cache keys:
```typescript
await redis.del(`cafe:ratings:${cafeId}`);
await redis.del(`cafe:nearby:${lat}:${lng}:${radius}`);
```

## Testing Notes

The default port is **3000**, but the dev server often runs on **3001** to avoid conflicts.

API base URL: `http://localhost:3001/api/v1`

Test endpoints:
- Health check: `GET /health`
- Root: `GET /`

All endpoints return errors in format:
```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "ISO-8601"
  }
}
```

## Migration from Supabase to Firebase

This project recently migrated authentication from Supabase to Firebase. Key points:

1. Firebase Admin SDK reads credentials from `firebase-service-account.json` at project root
2. Email/Password authentication must be enabled in Firebase Console
3. The migration maintains API compatibility - same endpoints, same response formats
4. JWT tokens are now Firebase ID tokens (verified via Firebase Admin SDK)
5. User data remains in PostgreSQL; Firebase only handles authentication
