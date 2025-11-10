# Sip-It Test Frontend

A comprehensive screen-by-screen testing tool for the Sip-It API.

## 🚀 Quick Start

1. **Make sure your backend is running**:
   ```bash
   cd /Users/vanshbhandari/Documents/sip-it
   PORT=3001 npm run dev
   ```

2. **Open the test frontend**:
   ```bash
   cd test-frontend
   open index.html
   ```

   Or simply double-click `index.html` in Finder.

## 📱 Screens Overview

The test frontend mirrors your mobile app's screen flow:

### 1. Welcome Screen
- Introduction to the test tool
- Navigation to get started

### 2. Authentication
- **Register** a new user account
- **Login** to existing account
- Automatically saves your access token

### 3. Profile Setup
- Add phone number
- Add birthday
- Select personality type (MBTI)
- Updates your user profile

### 4. Explore Page
- **Search cafes globally** by name
- **Browse nearby cafes** by location and radius
- **Filter by metric** (Food, Drinks, Ambience, Service)
- View **saved cafes**
- View **visited cafes**

### 5. Cafe Profile
- View comprehensive cafe details
- See **Sip It Rating** (average of 4 metrics)
- View **Most Popular Menu Items**
- View **Best For tags** (mood tags)
- **Follow/Unfollow** cafe
- **Save/Unsave** cafe
- **Mark as visited**
- View cafe photos
- View cafe reviews

### 6. Write Review
- Rate cafe on 4 metrics (Food, Drinks, Ambience, Service)
- Add comment
- Select **mood tags** ("What's the Move?")
- Submit review

### 7. User Profile
- View user information
- See **Expertise Badge** (auto-calculated)
- See **Cafes Visited count**
- View follower/following stats
- View **Personal Menu** (grouped by cafe)
- **Add items to Personal Menu**
- View user's reviews
- View user's photos

### 8. Settings
- Edit profile information
- Change password

## 🎯 Testing Workflow

### Complete User Journey

Follow this recommended testing flow:

1. **Register/Login** → Creates account and saves token
2. **Update Profile** → Add personal info
3. **Search Cafes** → Find cafes to test with
4. **Get Nearby Cafes** → Browse local cafes
5. **View Cafe Details** → Copy Place ID for next steps
6. **Follow Cafe** → Test follow functionality
7. **Save Cafe** → Test bookmark feature
8. **Create Review** → Rate cafe with mood tags
9. **Add to Menu** → Save favorite items
10. **View Profile** → See expertise badge and stats
11. **Change Password** → Test settings

## 📝 Important Notes

### Getting Cafe IDs

To test cafe-specific features, you need two types of IDs:

1. **Google Place ID** (starts with `ChIJ...`):
   - Get from Search Cafes or Nearby Cafes results
   - Copy the `place_id` or `googlePlaceId` field
   - Use for: Cafe Details, Follow, Save, Mark Visited

2. **Cafe UUID** (internal database ID):
   - Get from Cafe Details response
   - Look for the `id` field in the cafe object
   - Use for: Creating Reviews

### Authentication

- Your access token is automatically saved in localStorage
- It persists across page refreshes
- Use the same browser session for continuous testing
- To test with a different user, clear localStorage or use a different browser

### Common Place IDs for Testing

If you don't have real cafe data yet, you can:
1. Search for "Starbucks" or "Blue Bottle" in Search Cafes
2. Use the Nearby Cafes feature with coordinates:
   - San Francisco: `37.7749, -122.4194`
   - New York: `40.7128, -74.0060`
   - Los Angeles: `34.0522, -118.2437`

## 🎨 Features

### Visual Feedback
- ✅ Success messages in green
- ❌ Error messages in red
- 📊 Formatted JSON responses
- 🔄 Loading indicators
- 🎯 Interactive mood tag selection

### Data Persistence
- Access token saved in localStorage
- User ID saved in localStorage
- Persists across page reloads

### Response Display
- All API responses shown in formatted JSON
- Color-coded success/error states
- Scrollable response boxes
- Easy to copy API responses

## 🧪 Testing Each Feature

### Authentication
```javascript
// Test Registration
Email: test@example.com
Password: password123
Name: Test User

// Test Login
Email: test@example.com
Password: password123
```

### Profile Setup
```javascript
Phone: +1-555-123-4567
Birthday: 1995-06-15
Personality: ENFP
```

### Explore
```javascript
// Search
Query: Starbucks

// Nearby
Latitude: 37.7749
Longitude: -122.4194
Radius: 5 km
Sort By: DRINKS
```

### Review
```javascript
Cafe ID: [Get from cafe details]
Food: 4.5
Drinks: 5.0
Ambience: 4.0
Service: 4.5
Mood Tags: study, work meeting
```

### Personal Menu
```javascript
Place ID: ChIJ...
Cafe Name: Blue Bottle Coffee
Item: Iced Latte
Type: drink
Rating: 4.5
Notes: Perfect morning coffee!
```

## 🔧 Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in
- Check that access token is saved (check browser console)
- Try logging in again

### "Cafe not found" Error
- Make sure you're using a valid Google Place ID
- The cafe must exist in Google Places
- Try searching for the cafe first

### CORS Errors
- Make sure backend is running on port 3001
- Check that CORS is enabled in backend
- Backend should have: `origin: true` for development

### No Data Showing
- Check browser console for errors
- Verify backend is running
- Check network tab in browser dev tools
- Ensure database is connected

## 💡 Tips

1. **Keep browser console open** to see any errors
2. **Copy Place IDs immediately** after searching
3. **Test in order** for best experience
4. **Use the same coordinates** when testing nearby cafes
5. **Create multiple users** to test social features
6. **Add reviews** to populate expertise badges
7. **Add menu items** to test popular items aggregation

## 📊 What Gets Tested

- ✅ User registration and login
- ✅ Profile management (phone, birthday, personality)
- ✅ Global cafe search
- ✅ Nearby cafe search with filtering
- ✅ Cafe details with aggregated data
- ✅ Follow/unfollow cafes
- ✅ Save/unsave cafes (bookmarks)
- ✅ Mark cafes as visited
- ✅ Create reviews with mood tags
- ✅ Personal menu CRUD operations
- ✅ User profile with expertise badge
- ✅ Cafes visited count
- ✅ Most popular menu items
- ✅ Best for tags aggregation
- ✅ Sip It Rating calculation
- ✅ Password change

## 🎉 Success Indicators

You'll know features are working when you see:

1. **Expertise Badge** appears after creating reviews
2. **Cafes Visited count** matches your reviews
3. **Most Popular Items** shows on cafe profiles
4. **Best For tags** appear based on reviews
5. **Sip It Rating** calculates correctly
6. **Saved/Visited status** updates in real-time

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify backend is running on port 3001
3. Check that all migrations have been run
4. Ensure database is connected
5. Look at backend logs for server errors

Happy Testing! ☕️
