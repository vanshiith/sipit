# New Backend Features - API Documentation

This document describes all the new endpoints and features added to support your mobile app requirements.

## Overview

The following features have been implemented:
1. **Global Cafe Search** - Search for cafes anywhere in the world by name
2. **User Search** - Find other users by name or email
3. **Cafe Profiles** - Detailed cafe information with follow functionality
4. **Personal Menu** - Users can build and manage their personal food/drink menu
5. **Enhanced User Profiles** - Follower/following counts and user photos

## Database Changes

### New Tables

#### `cafe_follows`
Tracks which users follow which cafes.
- `id` (UUID)
- `user_id` (UUID) - Foreign key to users
- `cafe_id` (UUID) - Foreign key to cafes
- `created_at` (DateTime)

#### `personal_menu_items`
Stores user's personal menu items from various cafes.
- `id` (UUID)
- `user_id` (UUID) - Foreign key to users
- `cafe_place_id` (String) - Google Place ID
- `cafe_name` (String)
- `item_name` (String) - Name of food/drink
- `item_type` (String) - "food" or "drink"
- `rating` (Float) - 1-5 scale
- `photos` (String[]) - Array of photo URLs
- `notes` (String, optional)
- `created_at` (DateTime)
- `updated_at` (DateTime)

---

## New Endpoints

### 1. Search Endpoints

#### Search Cafes Globally
```
GET /api/v1/search/cafes?query={name}&limit={number}
```

**Description**: Search for cafes anywhere in the world by name using Google Places API.

**Query Parameters**:
- `query` (required): Cafe name to search for
- `limit` (optional): Number of results (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "cafes": [
      {
        "place_id": "ChIJ...",
        "name": "Blue Bottle Coffee",
        "formatted_address": "123 Main St, San Francisco, CA",
        "geometry": {
          "location": { "lat": 37.7749, "lng": -122.4194 }
        },
        "photos": [...],
        "rating": 4.5,
        "user_ratings_total": 1234
      }
    ],
    "count": 20
  }
}
```

#### Search Users
```
GET /api/v1/search/users?query={name_or_email}&limit={number}
```

**Description**: Search for users by name or email.

**Authentication**: Required

**Query Parameters**:
- `query` (required): Name or email to search for
- `limit` (optional): Number of results (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "profilePictureUrl": "https://...",
        "personalityType": "ENFP",
        "followersCount": 125,
        "followingCount": 89,
        "reviewsCount": 42
      }
    ],
    "count": 5
  }
}
```

---

### 2. Cafe Profile Endpoints

#### Get Cafe Details
```
GET /api/v1/cafes/details/:placeId
```

**Description**: Get comprehensive cafe details including Google data, follower count, and user's follow status.

**Authentication**: Optional (to get `isFollowing` status)

**Response**:
```json
{
  "data": {
    "cafe": {
      "id": "uuid",
      "googlePlaceId": "ChIJ...",
      "name": "Blue Bottle Coffee",
      "address": "123 Main St",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "photos": ["url1", "url2"],
      "ratings": {
        "avgFood": 4.5,
        "avgDrinks": 4.8,
        "avgAmbience": 4.2,
        "avgService": 4.3,
        "totalReviews": 156
      },
      "followersCount": 523,
      "reviewsCount": 156,
      "isFollowing": true,
      "googleDetails": {
        "phoneNumber": "+1-234-567-8900",
        "website": "https://...",
        "openingHours": {...},
        "googleRating": 4.6,
        "googleRatingsTotal": 2340
      }
    }
  }
}
```

#### Follow a Cafe
```
POST /api/v1/cafes/:placeId/follow
```

**Description**: Follow a cafe to receive updates.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Successfully followed cafe"
  }
}
```

#### Unfollow a Cafe
```
DELETE /api/v1/cafes/:placeId/follow
```

**Description**: Unfollow a cafe.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Successfully unfollowed cafe"
  }
}
```

#### Get Cafe Photos
```
GET /api/v1/cafes/:placeId/photos
```

**Description**: Get all user-submitted photos from reviews for this cafe.

**Response**:
```json
{
  "data": {
    "photos": [
      {
        "url": "https://...",
        "reviewId": "uuid",
        "user": {
          "id": "uuid",
          "name": "Jane Doe",
          "profilePictureUrl": "https://..."
        },
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "count": 45
  }
}
```

---

### 3. Personal Menu Endpoints

#### Get User's Personal Menu
```
GET /api/v1/menu/users/:userId
```

**Description**: Get a user's personal menu, grouped by cafe.

**Authentication**: Required

**Response**:
```json
{
  "data": {
    "menu": [
      {
        "cafePlaceId": "ChIJ...",
        "cafeName": "Blue Bottle Coffee",
        "items": [
          {
            "id": "uuid",
            "userId": "uuid",
            "itemName": "Iced Latte",
            "itemType": "drink",
            "rating": 4.5,
            "photos": ["https://..."],
            "notes": "Perfect morning coffee!",
            "createdAt": "2025-01-10T08:00:00Z"
          }
        ]
      }
    ],
    "totalItems": 28
  }
}
```

#### Add Menu Item
```
POST /api/v1/menu
```

**Description**: Add an item to personal menu.

**Authentication**: Required

**Request Body**:
```json
{
  "cafePlaceId": "ChIJ...",
  "cafeName": "Blue Bottle Coffee",
  "itemName": "Iced Latte",
  "itemType": "drink",
  "rating": 4.5,
  "photos": ["https://s3.../photo.jpg"],
  "notes": "Perfect morning coffee!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "menuItem": {
      "id": "uuid",
      "userId": "uuid",
      "cafePlaceId": "ChIJ...",
      "cafeName": "Blue Bottle Coffee",
      "itemName": "Iced Latte",
      "itemType": "drink",
      "rating": 4.5,
      "photos": ["https://..."],
      "notes": "Perfect morning coffee!",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

#### Update Menu Item
```
PUT /api/v1/menu/:itemId
```

**Description**: Update a menu item (only owner can update).

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "itemName": "New Latte",
  "rating": 5.0,
  "photos": ["https://..."],
  "notes": "Even better now!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "menuItem": {
      ...updated item
    }
  }
}
```

#### Delete Menu Item
```
DELETE /api/v1/menu/:itemId
```

**Description**: Delete a menu item (only owner can delete).

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Menu item deleted successfully"
  }
}
```

---

### 4. Enhanced User Profile Endpoints

#### Get User Photos
```
GET /api/v1/users/:id/photos
```

**Description**: Get all photos a user has posted in their reviews.

**Response**:
```json
{
  "data": {
    "photos": [
      {
        "url": "https://...",
        "reviewId": "uuid",
        "cafe": {
          "id": "uuid",
          "googlePlaceId": "ChIJ...",
          "name": "Blue Bottle Coffee",
          "address": "123 Main St"
        },
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "count": 67
  }
}
```

**Note**: The existing `GET /api/v1/users/:id` endpoint now includes:
- `followersCount`
- `followingCount`
- `reviewsCount`

---

## Usage Examples

### Frontend Flow for Explore Page

1. **User searches for cafes**:
   ```javascript
   // Search bar input
   GET /api/v1/search/cafes?query=blue bottle&limit=10
   ```

2. **User selects metric and radius**:
   ```javascript
   // Get nearby cafes sorted by selected metric
   GET /api/v1/cafes/nearby?latitude=37.7749&longitude=-122.4194&radiusKm=5&sortBy=DRINKS&limit=20
   ```

3. **User clicks on a cafe**:
   ```javascript
   // Get full cafe details
   GET /api/v1/cafes/details/ChIJ...

   // Get user-submitted photos
   GET /api/v1/cafes/ChIJ.../photos

   // Get reviews
   GET /api/v1/reviews/cafe/{cafeId}?page=1&limit=20
   ```

4. **User follows the cafe**:
   ```javascript
   POST /api/v1/cafes/ChIJ.../follow
   ```

### Frontend Flow for User Profile

1. **View user profile**:
   ```javascript
   GET /api/v1/users/{userId}
   // Returns profile with follower/following counts
   ```

2. **Get user's personal menu**:
   ```javascript
   GET /api/v1/menu/users/{userId}
   ```

3. **Get user's photos**:
   ```javascript
   GET /api/v1/users/{userId}/photos
   ```

4. **Get user's reviews**:
   ```javascript
   GET /api/v1/users/{userId}/reviews?page=1&limit=20
   ```

### Frontend Flow for Personal Menu

1. **User finds a cafe and wants to add an item**:
   ```javascript
   // User searches for cafe
   GET /api/v1/search/cafes?query=starbucks

   // User adds their favorite drink
   POST /api/v1/menu
   {
     "cafePlaceId": "ChIJ...",
     "cafeName": "Starbucks",
     "itemName": "Caramel Macchiato",
     "itemType": "drink",
     "rating": 4.5,
     "photos": ["https://s3.../photo.jpg"],
     "notes": "Extra caramel!"
   }
   ```

2. **View personal menu**:
   ```javascript
   GET /api/v1/menu/users/{myUserId}
   // Returns menu grouped by cafe
   ```

3. **Edit or delete item**:
   ```javascript
   PUT /api/v1/menu/{itemId}
   // or
   DELETE /api/v1/menu/{itemId}
   ```

---

## Error Handling

All endpoints return errors in the following format:
```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": [...] // For validation errors
  }
}
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (not authorized to perform action)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

- All authenticated endpoints require the `Authorization: Bearer <token>` header
- Photo URLs should be obtained from the upload endpoint (`POST /api/v1/upload/presigned-url`)
- The Google Places API is used for cafe search and details
- All timestamps are in ISO 8601 format (UTC)
- Pagination is available on list endpoints with `page` and `limit` query parameters
