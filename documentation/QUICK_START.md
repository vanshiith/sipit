# Sip-It Backend - Quick Start Guide

This guide will help you get the Sip-It backend up and running quickly.

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Docker & Docker Compose** (recommended) - [Download](https://www.docker.com/)

OR manually install:
- PostgreSQL 15+ with PostGIS extension
- Redis 7+

## Setup Instructions

### Option 1: Using Docker (Recommended - Fastest)

1. **Clone and navigate to the project:**
   ```bash
   cd sip-it
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your credentials:**
   - Get Supabase credentials from [supabase.com](https://supabase.com)
   - Get Google Maps API key from [Google Cloud Console](https://console.cloud.google.com)
   - Get AWS S3 credentials from [AWS Console](https://console.aws.amazon.com)
   - Get Firebase credentials from [Firebase Console](https://console.firebase.google.com)

4. **Start all services:**
   ```bash
   docker-compose up -d
   ```

5. **Check logs:**
   ```bash
   docker-compose logs -f api
   ```

6. **API is now running at:**
   ```
   http://localhost:3000
   ```

7. **Test the API:**
   ```bash
   curl http://localhost:3000/health
   ```

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup PostgreSQL database:**
   - Create a database named `sipit`
   - Install PostGIS extension:
     ```sql
     CREATE EXTENSION postgis;
     ```

3. **Setup Redis:**
   - Start Redis server on default port 6379

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your credentials.

5. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

6. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

7. **Start development server:**
   ```bash
   npm run dev
   ```

8. **API is now running at:**
   ```
   http://localhost:3000
   ```

## Required External Services Setup

### 1. Supabase (Authentication)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Enable Email authentication in Authentication settings
3. Enable Google and Apple OAuth providers
4. Copy these values to `.env`:
   - Project URL → `SUPABASE_URL`
   - Anon/Public key → `SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Google Maps & Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Copy API key to `.env` → `GOOGLE_MAPS_API_KEY`

### 3. AWS S3 (File Storage)

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Create an S3 bucket (e.g., `sipit-uploads`)
3. Set bucket permissions to allow public read for uploaded files
4. Create IAM user with S3 access
5. Copy credentials to `.env`:
   - Access Key ID → `AWS_ACCESS_KEY_ID`
   - Secret Access Key → `AWS_SECRET_ACCESS_KEY`
   - Bucket name → `AWS_S3_BUCKET`
   - Region → `AWS_REGION`

### 4. Firebase Cloud Messaging (Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Go to Project Settings → Service Accounts
4. Generate new private key (downloads JSON file)
5. Copy values from JSON to `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Testing the API

### 1. Check Health
```bash
curl http://localhost:3000/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 3. Get Nearby Cafes
```bash
curl "http://localhost:3000/api/v1/cafes/nearby?latitude=37.7749&longitude=-122.4194&radiusKm=5"
```

## Development Tools

### Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```
Opens at `http://localhost:5555`

### View Logs (Docker)
```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f api

# Database only
docker-compose logs -f postgres
```

### Database Migrations
```bash
# Create a new migration
npm run prisma:migrate

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Common Issues & Solutions

### Issue: Port 3000 already in use
**Solution:** Change `PORT` in `.env` file or stop the service using port 3000

### Issue: Database connection error
**Solution:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- For Docker: ensure postgres service is healthy (`docker-compose ps`)

### Issue: Redis connection error
**Solution:**
- Check Redis is running
- Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
- For Docker: ensure redis service is healthy

### Issue: Google Places API error
**Solution:**
- Verify `GOOGLE_MAPS_API_KEY` is correct
- Ensure Places API is enabled in Google Cloud Console
- Check API key restrictions

## Project Structure

```
sip-it/
├── src/
│   ├── config/          # Configuration files
│   ├── lib/             # Database & cache clients
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API route handlers
│   │   ├── auth/        # Authentication endpoints
│   │   ├── users/       # User management
│   │   ├── cafes/       # Cafe discovery
│   │   ├── reviews/     # Reviews & ratings
│   │   ├── feed/        # Social feed
│   │   └── ...
│   ├── services/        # External services (S3, Firebase, Google Places)
│   ├── utils/           # Utility functions
│   ├── app.ts           # Fastify app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── docker-compose.yml   # Docker services
├── Dockerfile           # API container
└── package.json         # Dependencies
```

## Next Steps

1. **Review API Documentation:** See `API_DOCUMENTATION.md` for detailed endpoint documentation
2. **Configure Frontend:** Use the API endpoints in your React Native app (built with Figma MCP)
3. **Deploy to Production:** See `README.md` for deployment instructions
4. **Monitor Performance:** Setup monitoring and logging for production

## Need Help?

- Check `README.md` for detailed documentation
- Review `API_DOCUMENTATION.md` for endpoint details
- Check logs: `docker-compose logs -f api` (Docker) or console output (manual)
