# Sip-It API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "personalityType": null,
      "profilePictureUrl": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "session": {
      "access_token": "jwt_token",
      "token_type": "bearer",
      "expires_in": 3600
    }
  }
}
```

### Login
Authenticate with email and password.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### OAuth Login
Authenticate with Google or Apple.

**Endpoint:** `POST /auth/oauth`

**Request Body:**
```json
{
  "provider": "google",
  "idToken": "oauth_id_token"
}
```

---

## User Endpoints

### Get Current User Profile
Get the authenticated user's profile.

**Endpoint:** `GET /users/me`

**Headers:** Requires authentication

**Response:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "personalityType": "ENTP",
      "profilePictureUrl": "https://...",
      "preferences": {
        "currentMoodMetric": "FOOD",
        "preferredRadiusKm": 5.0,
        "lastMoodUpdate": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
```

### Update Profile
Update user profile information.

**Endpoint:** `PUT /users/me`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "name": "Jane Doe",
  "personalityType": "ENFJ",
  "profilePictureUrl": "https://..."
}
```

### Follow User
Follow another user.

**Endpoint:** `POST /users/follow/:id`

**Headers:** Requires authentication

**Response:** `201 Created`

### Unfollow User
Unfollow a user.

**Endpoint:** `DELETE /users/unfollow/:id`

**Headers:** Requires authentication

---

## Preferences Endpoints

### Update Mood Metric
Update the current mood metric (asked every 6 hours).

**Endpoint:** `PUT /preferences/mood`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "moodMetric": "DRINKS"
}
```

**Values:** `"FOOD"`, `"DRINKS"`, `"AMBIENCE"`, `"SERVICE"`

### Update Search Radius
Update preferred search radius.

**Endpoint:** `PUT /preferences/radius`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "radiusKm": 10.0
}
```

**Range:** 0.5 - 50 km

### Check Mood Prompt
Check if the mood prompt should be shown (6 hours since last update).

**Endpoint:** `GET /preferences/should-show-mood-prompt`

**Headers:** Requires authentication

**Response:**
```json
{
  "data": {
    "shouldShowPrompt": true,
    "lastMoodUpdate": "2024-01-01T00:00:00.000Z",
    "currentMoodMetric": "FOOD"
  }
}
```

---

## Cafe Endpoints

### Get Nearby Cafes
Get cafes near a location, sorted by the selected metric.

**Endpoint:** `GET /cafes/nearby`

**Query Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radiusKm` (optional): Search radius in km (default: 5)
- `sortBy` (optional): Metric to sort by - `"FOOD"`, `"DRINKS"`, `"AMBIENCE"`, `"SERVICE"` (default: `"FOOD"`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Example:**
```
GET /cafes/nearby?latitude=37.7749&longitude=-122.4194&radiusKm=5&sortBy=DRINKS&page=1&limit=20
```

**Response:**
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
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    },
    "sortedBy": "DRINKS"
  }
}
```

### Get Cafe Details
Get detailed information about a specific cafe.

**Endpoint:** `GET /cafes/:id`

**Response:**
```json
{
  "data": {
    "cafe": {
      "id": "uuid",
      "name": "Blue Bottle Coffee",
      "address": "123 Main St",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "photos": ["https://..."],
      "ratings": {
        "avgFood": 4.5,
        "avgDrinks": 4.8,
        "avgAmbience": 4.2,
        "avgService": 4.6,
        "totalReviews": 42
      },
      "googleDetails": {
        "phoneNumber": "+1234567890",
        "website": "https://...",
        "openingHours": {
          "open_now": true,
          "weekday_text": ["Monday: 7:00 AM – 6:00 PM", ...]
        },
        "googleRating": 4.5,
        "googleRatingsTotal": 150
      }
    }
  }
}
```

### Search Cafes
Search for cafes by name or query.

**Endpoint:** `GET /cafes/search`

**Query Parameters:**
- `query` (required): Search query
- `latitude` (optional): User's latitude
- `longitude` (optional): User's longitude

**Example:**
```
GET /cafes/search?query=blue+bottle&latitude=37.7749&longitude=-122.4194
```

---

## Review Endpoints

### Create Review
Create a new review for a cafe.

**Endpoint:** `POST /reviews`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "cafeId": "uuid",
  "foodRating": 4.5,
  "drinksRating": 5.0,
  "ambienceRating": 4.0,
  "serviceRating": 4.5,
  "comment": "Great coffee and atmosphere!",
  "photos": ["https://...", "https://..."]
}
```

**Rating Scale:** 1.0 - 5.0

**Response:** `201 Created`

### Update Review
Update an existing review (own reviews only).

**Endpoint:** `PUT /reviews/:id`

**Headers:** Requires authentication

**Request Body:** (all fields optional)
```json
{
  "foodRating": 5.0,
  "comment": "Updated: Even better than I thought!"
}
```

### Delete Review
Delete a review (own reviews only).

**Endpoint:** `DELETE /reviews/:id`

**Headers:** Requires authentication

### Get Cafe Reviews
Get all reviews for a specific cafe.

**Endpoint:** `GET /reviews/cafe/:cafeId`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:**
```json
{
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "foodRating": 4.5,
        "drinksRating": 5.0,
        "ambienceRating": 4.0,
        "serviceRating": 4.5,
        "comment": "Great coffee!",
        "photos": ["https://..."],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "personalityType": "ENTP",
          "profilePictureUrl": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

---

## Feed Endpoints

### Get Following Feed
Get reviews from users you follow.

**Endpoint:** `GET /feed`

**Headers:** Requires authentication

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Results per page

### Get Discover Feed
Get popular reviews nearby or globally.

**Endpoint:** `GET /feed/discover`

**Query Parameters:**
- `latitude` (optional): User's latitude
- `longitude` (optional): User's longitude
- `radiusKm` (optional): Search radius in km
- `page` (optional): Page number
- `limit` (optional): Results per page

---

## Upload Endpoints

### Generate Presigned Upload URL
Get a presigned URL for direct upload to S3.

**Endpoint:** `POST /upload/presigned-url`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "fileName": "profile.jpg",
  "fileType": "image/jpeg",
  "folder": "profiles"
}
```

**Folder Options:** `"profiles"` or `"reviews"`

**Response:**
```json
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "fileUrl": "https://...",
    "key": "profiles/uuid.jpg"
  }
}
```

### Direct File Upload
Upload a file directly through the API.

**Endpoint:** `POST /upload`

**Headers:**
- Requires authentication
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: The file to upload (max 10MB)
- Field name should be `profile` or `review`

---

## Notification Endpoints

### Get Notifications
Get user notifications.

**Endpoint:** `GET /notifications`

**Headers:** Requires authentication

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Results per page
- `unreadOnly` (optional): `true` to get only unread notifications

### Get Unread Count
Get count of unread notifications.

**Endpoint:** `GET /notifications/unread-count`

**Headers:** Requires authentication

**Response:**
```json
{
  "data": {
    "unreadCount": 5
  }
}
```

### Mark Notification as Read
Mark a specific notification as read.

**Endpoint:** `PUT /notifications/:id/read`

**Headers:** Requires authentication

### Mark All Notifications as Read
Mark all notifications as read.

**Endpoint:** `PUT /notifications/read-all`

**Headers:** Requires authentication

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Common Status Codes
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., already following)
- `500 Internal Server Error` - Server error

---

## Rate Limiting

API requests are rate limited to 100 requests per minute per user. Exceeding this limit will result in a `429 Too Many Requests` response.
