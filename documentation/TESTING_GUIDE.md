# Sip-It Backend - Manual Testing Guide

This guide will walk you through testing every feature of the Sip-It backend API.

## Prerequisites

- Server running on `http://localhost:3000`
- A tool to make HTTP requests (we'll use `curl` in terminal)
- Optional: [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) for easier testing

## Table of Contents

1. [Health & Basic Checks](#1-health--basic-checks)
2. [Authentication](#2-authentication)
3. [User Management](#3-user-management)
4. [User Preferences](#4-user-preferences)
5. [Cafe Discovery](#5-cafe-discovery)
6. [Reviews & Ratings](#6-reviews--ratings)
7. [Social Features (Follow/Feed)](#7-social-features-followfeed)
8. [File Uploads](#8-file-uploads)
9. [Notifications](#9-notifications)

---

## 1. Health & Basic Checks

### Test 1.1: Health Endpoint
**Purpose:** Verify the server is running

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T05:00:00.000Z"
}
```

### Test 1.2: API Info
**Purpose:** Get API information

```bash
curl http://localhost:3000/
```

**Expected Response:**
```json
{
  "name": "Sip-It API",
  "version": "1.0.0",
  "status": "running"
}
```

---

## 2. Authentication

### Test 2.1: Register a New User (Email/Password)

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@gmail.com",
    "password": "SecurePass123",
    "name": "Alice Smith"
  }'
```

**Expected Response:**
```json
{
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "alice@gmail.com",
      "name": "Alice Smith",
      "personalityType": null,
      "profilePictureUrl": null,
      "createdAt": "2025-11-06T05:00:00.000Z"
    },
    "session": {
      "access_token": "jwt-token-here",
      "token_type": "bearer",
      ...
    }
  }
}
```

**Save the `access_token` - you'll need it for authenticated requests!**

### Test 2.2: Login with Email/Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@gmail.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:** Same structure as registration with user info and access token

### Test 2.3: Register Another User (for testing social features)

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@gmail.com",
    "password": "SecurePass123",
    "name": "Bob Johnson"
  }'
```

**Save Bob's access token too!**

---

## 3. User Management

**Set your token as a variable for easier testing:**
```bash
TOKEN="your-access-token-from-registration"
```

### Test 3.1: Get Current User Profile

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "alice@gmail.com",
      "name": "Alice Smith",
      "personalityType": null,
      "profilePictureUrl": null,
      "createdAt": "...",
      "updatedAt": "...",
      "preferences": {
        "currentMoodMetric": null,
        "preferredRadiusKm": 5.0,
        "lastMoodUpdate": null,
        ...
      }
    }
  }
}
```

### Test 3.2: Update User Profile (Add Personality Type)

```bash
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "personalityType": "ENTP"
  }'
```

**Expected Response:** Updated user object with `personalityType: "ENTP"`

### Test 3.3: Get Another User's Profile

First, get Bob's user ID from his registration response, then:

```bash
curl http://localhost:3000/api/v1/users/BOB_USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:** Bob's public profile with review counts, follower counts, etc.

### Test 3.4: Follow Another User

```bash
curl -X POST http://localhost:3000/api/v1/users/follow/BOB_USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "data": {
    "follow": {
      "id": "uuid",
      "createdAt": "..."
    }
  }
}
```

### Test 3.5: Get User's Followers

```bash
curl http://localhost:3000/api/v1/users/BOB_USER_ID/followers \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3.6: Get User's Following List

```bash
curl http://localhost:3000/api/v1/users/ALICE_USER_ID/following \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3.7: Unfollow a User

```bash
curl -X DELETE http://localhost:3000/api/v1/users/unfollow/BOB_USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. User Preferences

### Test 4.1: Update Mood Metric

```bash
curl -X PUT http://localhost:3000/api/v1/preferences/mood \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "moodMetric": "DRINKS"
  }'
```

**Valid values:** `"FOOD"`, `"DRINKS"`, `"AMBIENCE"`, `"SERVICE"`

**Expected Response:**
```json
{
  "data": {
    "preferences": {
      "currentMoodMetric": "DRINKS",
      "lastMoodUpdate": "2025-11-06T05:00:00.000Z",
      ...
    }
  }
}
```

### Test 4.2: Check if Should Show Mood Prompt

```bash
curl http://localhost:3000/api/v1/preferences/should-show-mood-prompt \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "data": {
    "shouldShowPrompt": false,
    "lastMoodUpdate": "2025-11-06T05:00:00.000Z",
    "currentMoodMetric": "DRINKS"
  }
}
```

**Note:** `shouldShowPrompt` will be `true` if more than 6 hours have passed since last update

### Test 4.3: Update Search Radius

```bash
curl -X PUT http://localhost:3000/api/v1/preferences/radius \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "radiusKm": 10.0
  }'
```

**Valid range:** 0.5 to 50 km

### Test 4.4: Update Notification Preferences

```bash
curl -X PUT http://localhost:3000/api/v1/preferences/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifyNewCafes": true,
    "notifyFriendActivity": true,
    "notifyWeekly": false
  }'
```

---

## 5. Cafe Discovery

### Test 5.1: Get Nearby Cafes (San Francisco)

```bash
curl "http://localhost:3000/api/v1/cafes/nearby?latitude=37.7749&longitude=-122.4194&radiusKm=5&sortBy=DRINKS&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radiusKm` (optional): Search radius (default: 5)
- `sortBy` (optional): `FOOD`, `DRINKS`, `AMBIENCE`, or `SERVICE` (default: FOOD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Try different locations:**
- **New York:** `latitude=40.7128&longitude=-74.0060`
- **Los Angeles:** `latitude=34.0522&longitude=-118.2437`
- **Chicago:** `latitude=41.8781&longitude=-87.6298`

**Expected Response:**
```json
{
  "data": {
    "cafes": [
      {
        "id": "uuid",
        "googlePlaceId": "ChIJ...",
        "name": "Blue Bottle Coffee",
        "address": "123 Main St, San Francisco, CA",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "photos": ["https://..."],
        "distance": 0.5,
        "ratings": {
          "avgFood": 4.5,
          "avgDrinks": 4.8,
          "avgAmbience": 4.2,
          "avgService": 4.6,
          "totalReviews": 42
        }
      }
    ],
    "pagination": { ... },
    "sortedBy": "DRINKS"
  }
}
```

### Test 5.2: Get Cafe Details

Get a cafe ID from the previous response, then:

```bash
curl http://localhost:3000/api/v1/cafes/CAFE_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:** Detailed cafe info including Google Places data (hours, phone, website)

### Test 5.3: Search Cafes by Name

```bash
curl "http://localhost:3000/api/v1/cafes/search?query=starbucks&latitude=37.7749&longitude=-122.4194" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Reviews & Ratings

### Test 6.1: Create a Review for a Cafe

**First, get a cafe ID from the nearby cafes endpoint, then:**

```bash
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cafeId": "CAFE_ID_HERE",
    "foodRating": 4.5,
    "drinksRating": 5.0,
    "ambienceRating": 4.0,
    "serviceRating": 4.5,
    "comment": "Amazing coffee! The atmosphere is cozy and perfect for working.",
    "photos": []
  }'
```

**Rating Scale:** 1.0 to 5.0 for each metric

**Expected Response:**
```json
{
  "data": {
    "review": {
      "id": "uuid",
      "foodRating": 4.5,
      "drinksRating": 5.0,
      "ambienceRating": 4.0,
      "serviceRating": 4.5,
      "comment": "Amazing coffee!...",
      "photos": [],
      "createdAt": "...",
      "user": {
        "id": "...",
        "name": "Alice Smith",
        "personalityType": "ENTP",
        "profilePictureUrl": null
      },
      "cafe": {
        "id": "...",
        "name": "Blue Bottle Coffee",
        "address": "..."
      }
    }
  }
}
```

### Test 6.2: Get All Reviews for a Cafe

```bash
curl "http://localhost:3000/api/v1/reviews/cafe/CAFE_ID?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 6.3: Update Your Review

```bash
curl -X PUT http://localhost:3000/api/v1/reviews/REVIEW_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "foodRating": 5.0,
    "comment": "Updated: Even better than I initially thought!"
  }'
```

**Note:** You can only update your own reviews

### Test 6.4: Delete Your Review

```bash
curl -X DELETE http://localhost:3000/api/v1/reviews/REVIEW_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Test 6.5: Get User's Reviews

```bash
curl "http://localhost:3000/api/v1/users/USER_ID/reviews?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Social Features (Follow/Feed)

### Test 7.1: Get Feed from Followed Users

**Prerequisites:** You need to follow at least one user who has posted reviews

```bash
curl "http://localhost:3000/api/v1/feed?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:** Reviews from users you follow

### Test 7.2: Get Discover Feed (Popular Reviews Nearby)

```bash
curl "http://localhost:3000/api/v1/feed/discover?latitude=37.7749&longitude=-122.4194&radiusKm=10&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**
- `latitude` (optional): Filter by location
- `longitude` (optional): Filter by location
- `radiusKm` (optional): Search radius
- `page` (optional): Page number
- `limit` (optional): Results per page

**Without location parameters:** Gets popular reviews globally

---

## 8. File Uploads

### Test 8.1: Generate Presigned Upload URL (for S3)

```bash
curl -X POST http://localhost:3000/api/v1/upload/presigned-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "profile.jpg",
    "fileType": "image/jpeg",
    "folder": "profiles"
  }'
```

**Folder options:** `"profiles"` or `"reviews"`

**Expected Response:**
```json
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "fileUrl": "https://sipit-uploads.s3.us-east-1.amazonaws.com/profiles/uuid.jpg",
    "key": "profiles/uuid.jpg"
  }
}
```

**To use the presigned URL:**
```bash
# Upload your image file to the uploadUrl
curl -X PUT "UPLOAD_URL_HERE" \
  -H "Content-Type: image/jpeg" \
  --upload-file /path/to/your/image.jpg
```

**Then update your profile with the fileUrl:**
```bash
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profilePictureUrl": "FILE_URL_HERE"
  }'
```

### Test 8.2: Direct File Upload

```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "profile=@/path/to/your/image.jpg"
```

**Field names:** `profile` for profile pictures, `review` for review photos

---

## 9. Notifications

### Test 9.1: Get All Notifications

```bash
curl "http://localhost:3000/api/v1/notifications?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**
- `unreadOnly=true`: Get only unread notifications

### Test 9.2: Get Unread Notification Count

```bash
curl http://localhost:3000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "data": {
    "unreadCount": 5
  }
}
```

### Test 9.3: Mark Notification as Read

```bash
curl -X PUT http://localhost:3000/api/v1/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer $TOKEN"
```

### Test 9.4: Mark All Notifications as Read

```bash
curl -X PUT http://localhost:3000/api/v1/notifications/read-all \
  -H "Authorization: Bearer $TOKEN"
```

### Test 9.5: Delete a Notification

```bash
curl -X DELETE http://localhost:3000/api/v1/notifications/NOTIFICATION_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Complete User Flow Test Scenario

Here's a complete end-to-end test scenario:

### Scenario: Alice discovers and reviews a cafe

```bash
# 1. Alice registers
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@gmail.com","password":"pass123","name":"Alice"}'

# Save the access token
ALICE_TOKEN="token-from-response"

# 2. Alice sets her personality type
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"personalityType":"ENTP"}'

# 3. Alice sets her mood to "DRINKS"
curl -X PUT http://localhost:3000/api/v1/preferences/mood \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moodMetric":"DRINKS"}'

# 4. Alice searches for cafes nearby, sorted by drinks rating
curl "http://localhost:3000/api/v1/cafes/nearby?latitude=37.7749&longitude=-122.4194&radiusKm=5&sortBy=DRINKS" \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Save a cafe ID from the response
CAFE_ID="cafe-id-from-response"

# 5. Alice reviews the cafe
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cafeId":"'$CAFE_ID'",
    "foodRating":4.5,
    "drinksRating":5.0,
    "ambienceRating":4.0,
    "serviceRating":4.5,
    "comment":"Best coffee in SF!"
  }'

# 6. Bob registers
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@gmail.com","password":"pass123","name":"Bob"}'

BOB_TOKEN="token-from-response"

# 7. Bob follows Alice
curl -X POST http://localhost:3000/api/v1/users/follow/ALICE_USER_ID \
  -H "Authorization: Bearer $BOB_TOKEN"

# 8. Bob sees Alice's review in his feed
curl http://localhost:3000/api/v1/feed \
  -H "Authorization: Bearer $BOB_TOKEN"
```

---

## Testing with Postman/Insomnia (Easier Method)

If you prefer a GUI, here's how to import these tests into Postman:

1. Create a new Postman Collection called "Sip-It API"
2. Add an environment variable `baseUrl` = `http://localhost:3000`
3. Add an environment variable `token` for your access token
4. For each endpoint, create a request with:
   - Method: GET/POST/PUT/DELETE
   - URL: `{{baseUrl}}/api/v1/...`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: JSON data

---

## Common Issues & Solutions

### Issue: "Invalid or expired token"
**Solution:** Your access token might have expired. Log in again to get a new one.

### Issue: "Failed to fetch nearby cafes"
**Solution:**
- Check that your Google Maps API key is valid
- Ensure Places API is enabled in Google Cloud Console
- Try a different location (latitude/longitude)

### Issue: "User not found in database"
**Solution:** Make sure you registered the user first before logging in

### Issue: "You can only update your own reviews"
**Solution:** Ensure you're using the correct user's token for the review owner

---

## Tips for Testing

1. **Save tokens in variables:** Makes testing much faster
   ```bash
   export ALICE_TOKEN="your-token-here"
   curl -H "Authorization: Bearer $ALICE_TOKEN" ...
   ```

2. **Use `jq` for prettier JSON output:**
   ```bash
   curl ... | jq
   ```

3. **Save IDs for reuse:** Keep track of user IDs, cafe IDs, review IDs

4. **Test error cases:** Try invalid data to ensure proper error handling

5. **Use Postman collections:** Save all your requests for easy re-testing

---

## Next Steps

Once you've tested the backend thoroughly:
1. Build the React Native frontend
2. Connect it to `http://localhost:3000`
3. Test the full user flow in the mobile app
4. Deploy to production when ready!

Happy Testing! 🎉
