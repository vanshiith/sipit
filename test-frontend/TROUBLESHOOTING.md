# Troubleshooting Guide

## ⚠️ "Email Rate Limit Exceeded" Error

### Why This Happens
Supabase has rate limits on authentication endpoints to prevent abuse. During testing, you might hit this limit if you:
- Register/login multiple times in a short period
- Use the same email repeatedly
- Create many test accounts quickly

### Solutions

#### Option 1: Use Different Email Addresses ✅ RECOMMENDED
```
First attempt:  test1@example.com
Second attempt: test2@example.com
Third attempt:  test3@example.com
```

**Tip:** Supabase treats these as different users even though they're not real emails.

#### Option 2: Wait and Retry ⏱️
- Wait **5-10 minutes** before trying again
- The rate limit resets automatically
- Use this time to plan your test cases

#### Option 3: Use Manual Token Entry 🔑
If you already have a token from a previous successful login:

1. Go to the **Authentication** screen
2. Scroll to **"Manual Token Entry (For Testing)"**
3. Paste your access token and user ID
4. Click **"Set Token"**

**Where to find your token:**
- Check browser console (F12) after successful login
- Look in localStorage: `localStorage.getItem('accessToken')`
- Look in the response JSON from previous login

#### Option 4: Use Existing Login 🔄
If you successfully registered earlier:
1. Use the **Login** section instead of Register
2. Enter the email/password you used before
3. Click **Login**

### How to Get Your Token & User ID

#### From Browser Console (F12):
```javascript
// Get saved token
localStorage.getItem('accessToken')

// Get saved user ID
localStorage.getItem('userId')
```

#### From Previous API Response:
After successful registration/login, copy from response:
```json
{
  "data": {
    "session": {
      "access_token": "eyJ..." <- COPY THIS
    },
    "user": {
      "id": "uuid-here" <- AND THIS
    }
  }
}
```

### Testing Without Re-authenticating

Once you have a token saved, you can:
1. ✅ Close and reopen the test frontend
2. ✅ Refresh the page
3. ✅ Test all features without logging in again
4. ✅ The token persists in localStorage

### Clearing Your Session

To test login/registration again:
1. Go to Authentication screen
2. Click **"Clear Saved Token"** button
3. Or manually clear: `localStorage.clear()`

## Other Common Issues

### "Unauthorized" Error
**Solution:**
- Make sure you're logged in (check console)
- Token might have expired - login again
- Check that Bearer token is being sent

### "Cafe not found" Error
**Solution:**
- Use the Search Cafes feature first
- Copy the `place_id` from search results
- The cafe must exist in Google Places API

### CORS Errors
**Solution:**
- Backend must be running on port 3001
- Check backend CORS settings
- Make sure `origin: true` is set for development

### Network Errors
**Solution:**
- Verify backend is running: `http://localhost:3001/health`
- Check Docker containers are up
- Check PostgreSQL and Redis are running

## Best Practices for Testing

### 1. Create Multiple Test Users
```
User 1: test1@example.com (for main testing)
User 2: test2@example.com (for social features)
User 3: test3@example.com (for backup)
```

### 2. Save Important Tokens
After successful registration:
```javascript
// Copy from console
const myToken = localStorage.getItem('accessToken');
const myUserId = localStorage.getItem('userId');

// Save these somewhere (notes app, file, etc.)
```

### 3. Use Login Instead of Register
- Only register once per test user
- Use login for all subsequent sessions
- Faster and avoids rate limits

### 4. Test in Batches
Instead of rapid-fire testing:
```
✅ Good: Register → Test features → Take notes → Continue
❌ Bad: Register, delete, register, delete, register...
```

### 5. Keep Browser Console Open
- See real-time logs
- Catch errors immediately
- Copy tokens easily
- Debug API responses

## Quick Recovery Steps

If you're stuck and can't proceed:

1. **Check if you're logged in:**
   ```javascript
   localStorage.getItem('accessToken')
   ```

2. **If you have a token but it's not working:**
   - Click "Clear Saved Token"
   - Login again with existing credentials

3. **If rate limited:**
   - Wait 10 minutes
   - OR use different email (test4@, test5@, etc.)
   - OR use manual token entry

4. **If completely stuck:**
   - Clear localStorage: `localStorage.clear()`
   - Restart backend
   - Use a different browser
   - Wait 15 minutes and try again

## Environment-Specific Issues

### Supabase Email Rate Limits
- **Development:** Usually 3-5 attempts per 10 minutes
- **Production:** Higher limits with paid plans

### Solution for Heavy Testing
Consider using Supabase CLI to create test users directly:
```bash
# This bypasses email rate limits
supabase auth create-user --email test@example.com --password password123
```

## Contact & Support

If issues persist:
1. Check backend logs for detailed errors
2. Verify Supabase dashboard for auth issues
3. Check PostgreSQL database is accessible
4. Ensure Redis is running

## Pro Tips 💡

1. **Save successful tokens** - Keep 2-3 working tokens handy
2. **Use unique emails** - test1@, test2@, test3@, etc.
3. **Test features, not auth** - Focus on API functionality
4. **Batch your tests** - Plan what to test before starting
5. **Keep console open** - Catch issues early
6. **Use manual entry** - Bypass auth when needed

Remember: The test frontend is designed to persist your session. Once logged in successfully, you rarely need to login again! 🎉
