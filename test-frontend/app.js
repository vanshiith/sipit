// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
let accessToken = localStorage.getItem('accessToken') || '';
let currentUserId = localStorage.getItem('userId') || '';
let selectedMoodTags = [];

// Utility Functions
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

function showResponse(elementId, data, isError = false) {
    const element = document.getElementById(elementId);
    element.className = 'response-box ' + (isError ? 'error' : 'success');
    element.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.className = 'response-box';
    element.innerHTML = '<div class="loading">Loading</div>';
}

async function apiCall(endpoint, method = 'GET', body = null, requiresAuth = true) {
    showLoading(getActiveResponseElement());

    const headers = {};

    if (requiresAuth && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            showResponse(getActiveResponseElement(), data, true);
            return null;
        }

        showResponse(getActiveResponseElement(), data, false);
        return data;
    } catch (error) {
        showResponse(getActiveResponseElement(), { error: error.message }, true);
        return null;
    }
}

function getActiveResponseElement() {
    const activeScreen = document.querySelector('.screen.active');
    const responseBox = activeScreen.querySelector('[id$="-response"]');
    return responseBox ? responseBox.id : 'auth-response';
}

function toggleChip(element, value) {
    element.classList.toggle('selected');
    const index = selectedMoodTags.indexOf(value);
    if (index > -1) {
        selectedMoodTags.splice(index, 1);
    } else {
        selectedMoodTags.push(value);
    }
}

// Authentication Functions
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;

    if (!email || !password || !name) {
        alert('Please fill in all fields');
        return;
    }

    const data = await apiCall('/auth/register', 'POST', {
        email,
        password,
        name
    }, false);

    if (data && data.data) {
        accessToken = data.data.session.access_token;
        currentUserId = data.data.user.id;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userId', currentUserId);
        alert('✅ Registration successful!\n\nToken saved. You can now proceed to profile setup.');

        // Show token info
        console.log('Access Token:', accessToken);
        console.log('User ID:', currentUserId);
    } else {
        // If rate limited, show helpful message
        const errorMsg = data?.error?.message || 'Registration failed';
        if (errorMsg.includes('rate limit')) {
            alert('⚠️ Rate Limit Hit!\n\nPlease try one of these:\n1. Wait 5-10 minutes and try again\n2. Use a different email address\n3. Use the manual token entry below if you have a token from a previous session');
        }
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    const data = await apiCall('/auth/login', 'POST', {
        email,
        password
    }, false);

    if (data && data.data) {
        accessToken = data.data.session.access_token;
        currentUserId = data.data.user.id;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userId', currentUserId);
        alert('Login successful! You can now proceed to the next screen.');
    }
}

// Profile Setup Functions
async function updateProfile() {
    const phone = document.getElementById('profile-phone').value;
    const birthday = document.getElementById('profile-birthday').value;
    const personality = document.getElementById('profile-personality').value;

    const body = {};
    if (phone) body.phoneNumber = phone;
    if (birthday) body.birthday = new Date(birthday).toISOString();
    if (personality) body.personalityType = personality;

    const data = await apiCall('/users/me', 'PUT', body);

    if (data) {
        alert('Profile updated successfully!');
    }
}

// Explore Functions
async function searchCafes() {
    const query = document.getElementById('search-query').value;

    if (!query) {
        alert('Please enter a search query');
        return;
    }

    const data = await apiCall(`/search/cafes?query=${encodeURIComponent(query)}&limit=10`, 'GET', null, false);

    if (data && data.data && data.data.cafes) {
        displayCafes(data.data.cafes, 'explore-response');
    }
}

async function getNearbyCafes() {
    const lat = document.getElementById('nearby-lat').value;
    const lng = document.getElementById('nearby-lng').value;
    const radius = document.getElementById('nearby-radius').value;
    const sortBy = document.getElementById('nearby-sortby').value;

    const data = await apiCall(
        `/cafes/nearby?latitude=${lat}&longitude=${lng}&radiusKm=${radius}&sortBy=${sortBy}&limit=10`,
        'GET',
        null,
        false
    );

    if (data && data.data && data.data.cafes) {
        displayCafes(data.data.cafes, 'explore-response');
    }
}

async function getSavedCafes() {
    const data = await apiCall('/saved-cafes', 'GET');

    if (data && data.data && data.data.cafes) {
        displayCafes(data.data.cafes, 'explore-response');
    }
}

async function getVisitedCafes() {
    const data = await apiCall('/visited-cafes', 'GET');

    if (data && data.data && data.data.cafes) {
        displayCafes(data.data.cafes, 'explore-response');
    }
}

function displayCafes(cafes, elementId) {
    const element = document.getElementById(elementId);
    element.className = 'response-box';

    if (!cafes || cafes.length === 0) {
        element.innerHTML = '<p>No cafes found.</p>';
        return;
    }

    let html = '<h3 style="margin-bottom: 15px;">Results (' + cafes.length + ')</h3>';

    cafes.forEach(cafe => {
        html += `
            <div class="cafe-card">
                <h3>${cafe.name}</h3>
                <p><strong>Address:</strong> ${cafe.formatted_address || cafe.address || 'N/A'}</p>
                <p><strong>Place ID:</strong> <code>${cafe.place_id || cafe.googlePlaceId || 'N/A'}</code></p>
                ${cafe.ratings ? `
                    <div style="margin-top: 10px;">
                        <span class="rating-badge">Food: ${cafe.ratings.avgFood}</span>
                        <span class="rating-badge">Drinks: ${cafe.ratings.avgDrinks}</span>
                        <span class="rating-badge">Ambience: ${cafe.ratings.avgAmbience}</span>
                        <span class="rating-badge">Service: ${cafe.ratings.avgService}</span>
                    </div>
                ` : ''}
                ${cafe.rating ? `<p><strong>Google Rating:</strong> ${cafe.rating} ⭐</p>` : ''}
                ${cafe.distance ? `<p><strong>Distance:</strong> ${cafe.distance.toFixed(2)} km</p>` : ''}
            </div>
        `;
    });

    element.innerHTML = html;
}

// Cafe Profile Functions
async function getCafeDetails() {
    const placeId = document.getElementById('cafe-place-id').value;

    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }

    const data = await apiCall(`/cafes/details/${placeId}`, 'GET', null, true);

    if (data && data.data && data.data.cafe) {
        displayCafeDetails(data.data.cafe);
    }
}

function displayCafeDetails(cafe) {
    const element = document.getElementById('cafe-response');
    element.className = 'response-box success';

    let html = `
        <div class="cafe-card">
            <h2>${cafe.name}</h2>
            <p><strong>Cafe UUID (for reviews):</strong> <code style="background: #ffffcc; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${cafe.id}</code></p>
            <p><strong>Google Place ID:</strong> <code>${cafe.googlePlaceId}</code></p>
            <p><strong>Address:</strong> ${cafe.address}</p>
            <p><strong>Sip It Rating:</strong> ${cafe.sipItRating || 'N/A'} ⭐</p>

            <div style="margin-top: 15px;">
                <h3>Ratings</h3>
                <span class="rating-badge">Food: ${cafe.ratings?.avgFood || 0}</span>
                <span class="rating-badge">Drinks: ${cafe.ratings?.avgDrinks || 0}</span>
                <span class="rating-badge">Ambience: ${cafe.ratings?.avgAmbience || 0}</span>
                <span class="rating-badge">Service: ${cafe.ratings?.avgService || 0}</span>
            </div>

            <div style="margin-top: 15px;">
                <p><strong>Status:</strong></p>
                <span class="tag">${cafe.isFollowing ? '✓' : '✗'} Following</span>
                <span class="tag">${cafe.isSaved ? '✓' : '✗'} Saved</span>
                <span class="tag">${cafe.isVisited ? '✓' : '✗'} Visited</span>
            </div>

            <div style="margin-top: 15px;">
                <p><strong>Followers:</strong> ${cafe.followersCount || 0}</p>
                <p><strong>Reviews:</strong> ${cafe.reviewsCount || 0}</p>
            </div>
    `;

    if (cafe.mostPopularItems && cafe.mostPopularItems.length > 0) {
        html += `
            <div style="margin-top: 15px;">
                <h3>Most Popular Items</h3>
        `;
        cafe.mostPopularItems.forEach(item => {
            html += `<p>• ${item.itemName} (${item.itemType}) - ${item.avgRating} ⭐ (${item.count} orders)</p>`;
        });
        html += '</div>';
    }

    if (cafe.bestForTags && cafe.bestForTags.length > 0) {
        html += `
            <div style="margin-top: 15px;">
                <h3>Best For</h3>
        `;
        cafe.bestForTags.forEach(tag => {
            html += `<span class="tag">${tag.tag} (${tag.count})</span> `;
        });
        html += '</div>';
    }

    html += '</div>';
    element.innerHTML = html;
}

async function followCafe() {
    const placeId = document.getElementById('cafe-place-id').value;
    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }
    await apiCall(`/cafes/${placeId}/follow`, 'POST');
}

async function unfollowCafe() {
    const placeId = document.getElementById('cafe-place-id').value;
    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }
    await apiCall(`/cafes/${placeId}/follow`, 'DELETE');
}

async function saveCafe() {
    const placeId = document.getElementById('cafe-place-id').value;
    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }
    await apiCall(`/saved-cafes/${placeId}`, 'POST');
}

async function unsaveCafe() {
    const placeId = document.getElementById('cafe-place-id').value;
    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }
    await apiCall(`/saved-cafes/${placeId}`, 'DELETE');
}

async function markVisited() {
    const placeId = document.getElementById('cafe-place-id').value;
    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }
    await apiCall(`/visited-cafes/${placeId}`, 'POST');
}

async function getCafePhotos() {
    const placeId = document.getElementById('cafe-place-id').value;
    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }
    await apiCall(`/cafes/${placeId}/photos`, 'GET', null, false);
}

async function getCafeReviews() {
    const placeId = document.getElementById('cafe-place-id').value;
    if (!placeId) {
        alert('Please enter a Place ID');
        return;
    }

    // First get cafe details to get the cafe UUID
    const cafeData = await fetch(`${API_BASE_URL}/cafes/details/${placeId}`, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
    });
    const cafeJson = await cafeData.json();

    if (cafeJson.data && cafeJson.data.cafe) {
        const cafeId = cafeJson.data.cafe.id;
        await apiCall(`/reviews/cafe/${cafeId}?page=1&limit=10`, 'GET', null, false);
    }
}

// Review Functions
async function createReview() {
    const cafeId = document.getElementById('review-cafe-id').value;
    const foodRating = parseFloat(document.getElementById('review-food').value);
    const drinksRating = parseFloat(document.getElementById('review-drinks').value);
    const ambienceRating = parseFloat(document.getElementById('review-ambience').value);
    const serviceRating = parseFloat(document.getElementById('review-service').value);
    const comment = document.getElementById('review-comment').value;

    if (!cafeId) {
        alert('Please enter a Cafe ID');
        return;
    }

    const body = {
        cafeId,
        foodRating,
        drinksRating,
        ambienceRating,
        serviceRating,
        comment,
        moodTags: selectedMoodTags
    };

    const data = await apiCall('/reviews', 'POST', body);

    if (data) {
        alert('Review created successfully!');
        selectedMoodTags = [];
        document.querySelectorAll('.chip.selected').forEach(chip => {
            chip.classList.remove('selected');
        });
    }
}

// User Profile Functions
async function getUserProfile() {
    const userId = document.getElementById('profile-user-id').value || currentUserId;

    if (!userId) {
        alert('Please login first or enter a user ID');
        return;
    }

    const data = await apiCall(`/users/${userId}`, 'GET', null, false);

    if (data && data.data && data.data.user) {
        displayUserProfile(data.data.user);
    }
}

function displayUserProfile(user) {
    const element = document.getElementById('profile-response');
    element.className = 'response-box success';

    let html = `
        <div class="user-card">
            <h2>${user.name}</h2>
            <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${user.phoneNumber || 'N/A'}</p>
            <p><strong>Birthday:</strong> ${user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Personality Type:</strong> ${user.personalityType || 'N/A'}</p>

            ${user.expertise ? `<p><strong>Expertise:</strong> <span class="rating-badge">${user.expertise}</span></p>` : ''}

            <div style="margin-top: 15px;">
                <p><strong>Stats:</strong></p>
                <p>👥 Followers: ${user.followersCount || 0}</p>
                <p>👥 Following: ${user.followingCount || 0}</p>
                <p>📝 Reviews: ${user.reviewsCount || 0}</p>
                <p>☕ Cafes Visited: ${user.cafesVisitedCount || 0}</p>
            </div>
        </div>
    `;

    element.innerHTML = html;
}

async function getUserMenu() {
    const userId = document.getElementById('profile-user-id').value || currentUserId;

    if (!userId) {
        alert('Please login first or enter a user ID');
        return;
    }

    const data = await apiCall(`/menu/users/${userId}`, 'GET');

    if (data && data.data && data.data.menu) {
        displayUserMenu(data.data.menu);
    }
}

function displayUserMenu(menu) {
    const element = document.getElementById('profile-response');
    element.className = 'response-box success';

    if (!menu || menu.length === 0) {
        element.innerHTML = '<p>No menu items found.</p>';
        return;
    }

    let html = '<h3>Personal Menu</h3>';

    menu.forEach(cafeMenu => {
        html += `
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4>${cafeMenu.cafeName}</h4>
        `;

        cafeMenu.items.forEach(item => {
            html += `
                <div class="menu-item-card">
                    <h4>${item.itemName}</h4>
                    <p><strong>Type:</strong> ${item.itemType}</p>
                    <p><strong>Rating:</strong> ${item.rating} ⭐</p>
                    ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
                    <p style="font-size: 12px; color: #666;">Added: ${new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
            `;
        });

        html += '</div>';
    });

    element.innerHTML = html;
}

async function getUserReviews() {
    const userId = document.getElementById('profile-user-id').value || currentUserId;

    if (!userId) {
        alert('Please login first or enter a user ID');
        return;
    }

    await apiCall(`/users/${userId}/reviews?page=1&limit=10`, 'GET', null, false);
}

async function getUserPhotos() {
    const userId = document.getElementById('profile-user-id').value || currentUserId;

    if (!userId) {
        alert('Please login first or enter a user ID');
        return;
    }

    await apiCall(`/users/${userId}/photos`, 'GET', null, false);
}

async function addToMenu() {
    const placeId = document.getElementById('menu-place-id').value;
    const cafeName = document.getElementById('menu-cafe-name').value;
    const itemName = document.getElementById('menu-item-name').value;
    const itemType = document.getElementById('menu-item-type').value;
    const rating = parseFloat(document.getElementById('menu-rating').value);
    const notes = document.getElementById('menu-notes').value;

    if (!placeId || !cafeName || !itemName) {
        alert('Please fill in required fields');
        return;
    }

    const body = {
        cafePlaceId: placeId,
        cafeName,
        itemName,
        itemType,
        rating,
        notes: notes || undefined
    };

    const data = await apiCall('/menu', 'POST', body);

    if (data) {
        alert('Item added to menu successfully!');
    }
}

// Settings Functions
async function updateProfileSettings() {
    const name = document.getElementById('edit-name').value;
    const phone = document.getElementById('edit-phone').value;
    const birthday = document.getElementById('edit-birthday').value;
    const personality = document.getElementById('edit-personality').value;

    const body = {};
    if (name) body.name = name;
    if (phone) body.phoneNumber = phone;
    if (birthday) body.birthday = new Date(birthday).toISOString();
    if (personality) body.personalityType = personality;

    const data = await apiCall('/users/me', 'PUT', body);

    if (data) {
        alert('Profile updated successfully!');
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    if (!currentPassword || !newPassword) {
        alert('Please fill in both password fields');
        return;
    }

    if (newPassword.length < 8) {
        alert('New password must be at least 8 characters');
        return;
    }

    const data = await apiCall('/auth/change-password', 'POST', {
        currentPassword,
        newPassword
    });

    if (data) {
        alert('Password changed successfully!');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
    }
}

// Manual Token Functions
function setManualToken() {
    const token = document.getElementById('manual-token').value;
    const userId = document.getElementById('manual-user-id').value;

    if (!token || !userId) {
        alert('Please enter both token and user ID');
        return;
    }

    accessToken = token;
    currentUserId = userId;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userId', userId);

    alert('✅ Token set successfully!\n\nYou can now use all authenticated features.');
    console.log('Token set:', token.substring(0, 20) + '...');
    console.log('User ID:', userId);

    // Clear the input fields
    document.getElementById('manual-token').value = '';
    document.getElementById('manual-user-id').value = '';
}

function clearToken() {
    accessToken = '';
    currentUserId = '';
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    alert('✅ Token cleared!\n\nYou will need to login again to use authenticated features.');
    console.log('Token cleared');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (accessToken) {
        console.log('✅ Logged in!');
        console.log('Token:', accessToken.substring(0, 30) + '...');
        console.log('User ID:', currentUserId);

        // Show status in auth screen
        const authResponse = document.getElementById('auth-response');
        if (authResponse) {
            authResponse.className = 'response-box success';
            authResponse.innerHTML = `
                <h3>✅ Already Logged In</h3>
                <p><strong>User ID:</strong> ${currentUserId}</p>
                <p><strong>Token:</strong> ${accessToken.substring(0, 30)}...</p>
                <p style="margin-top: 10px;">You can proceed to the next screens or clear your token to test login again.</p>
            `;
        }
    } else {
        console.log('❌ Not logged in - please register or login');
    }
});
