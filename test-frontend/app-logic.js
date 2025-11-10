// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';

// App State
const state = {
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    userId: localStorage.getItem('userId') || null,
    currentView: 'welcome',
    viewHistory: [],
    selectedCafe: null,
    cafes: [],
    savedCafes: [],
    visitedCafes: [],
    userProfile: null,
};

// Available mood tags
const MOOD_TAGS = [
    'study', 'work meeting', 'coffee chat', 'date', 'solo time',
    'reading', 'creative work', 'catch up', 'first date', 'group hang'
];

// API Helper
async function apiCall(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (requiresAuth && state.accessToken) {
        headers['Authorization'] = `Bearer ${state.accessToken}`;
    }

    const options = { method, headers };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Alert Helper
function showAlert(title, message) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    document.getElementById('overlay').classList.add('show');
    document.getElementById('alert').classList.add('show');
}

function hideAlert() {
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('alert').classList.remove('show');
}

// App Controller
const app = {
    init() {
        // Check if user is logged in
        if (state.accessToken && state.userId) {
            this.navigate('explore');
        } else {
            this.navigate('welcome');
        }
    },

    navigate(view, data = {}) {
        // Add current view to history
        if (state.currentView && state.currentView !== view) {
            state.viewHistory.push(state.currentView);
        }

        state.currentView = view;

        // Update header
        const headerTitle = document.getElementById('header-title');
        const backBtn = document.getElementById('back-btn');
        const bottomNav = document.getElementById('bottom-nav');

        // Show/hide back button
        if (state.viewHistory.length > 0 && !['welcome', 'explore', 'saved', 'visited', 'profile'].includes(view)) {
            backBtn.style.display = 'block';
        } else {
            backBtn.style.display = 'none';
        }

        // Show/hide bottom nav
        if (['explore', 'saved', 'visited', 'profile'].includes(view)) {
            bottomNav.style.display = 'flex';
        } else {
            bottomNav.style.display = 'none';
        }

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(
            item => item.onclick?.toString().includes(`'${view}'`)
        );
        if (activeNav) {
            activeNav.classList.add('active');
        }

        // Render view
        this.render(view, data);
    },

    goBack() {
        if (state.viewHistory.length > 0) {
            const previousView = state.viewHistory.pop();
            state.currentView = previousView;
            this.render(previousView);
        }
    },

    render(view, data = {}) {
        const content = document.getElementById('app-content');
        const headerTitle = document.getElementById('header-title');

        switch(view) {
            case 'welcome':
                headerTitle.textContent = 'Welcome';
                content.innerHTML = this.renderWelcome();
                break;
            case 'register':
                headerTitle.textContent = 'Create Account';
                content.innerHTML = this.renderRegister();
                break;
            case 'login':
                headerTitle.textContent = 'Log In';
                content.innerHTML = this.renderLogin();
                break;
            case 'profile-setup':
                headerTitle.textContent = 'Setup Profile';
                content.innerHTML = this.renderProfileSetup();
                break;
            case 'explore':
                headerTitle.textContent = 'Explore';
                content.innerHTML = this.renderExplore();
                break;
            case 'saved':
                headerTitle.textContent = 'Saved Cafes';
                content.innerHTML = this.renderSaved();
                this.loadSavedCafes();
                break;
            case 'visited':
                headerTitle.textContent = 'Visited';
                content.innerHTML = this.renderVisited();
                this.loadVisitedCafes();
                break;
            case 'profile':
                headerTitle.textContent = 'Profile';
                content.innerHTML = this.renderProfile();
                this.loadUserProfile();
                break;
            case 'cafe-detail':
                headerTitle.textContent = 'Cafe Details';
                content.innerHTML = this.renderCafeDetail(data.cafe);
                break;
            case 'write-review':
                headerTitle.textContent = 'Write Review';
                content.innerHTML = this.renderWriteReview(data.cafe);
                break;
            case 'settings':
                headerTitle.textContent = 'Settings';
                content.innerHTML = this.renderSettings();
                break;
            default:
                content.innerHTML = '<div class="empty-state"><div class="empty-icon">❓</div><p>View not found</p></div>';
        }
    },

    // VIEWS

    renderWelcome() {
        return `
            <div class="onboarding">
                <div style="font-size: 80px; margin-bottom: 30px;">☕</div>
                <h2>Welcome to Sip-It</h2>
                <p>Discover amazing cafes, share your experiences, and connect with fellow coffee lovers.</p>
                <button class="btn" onclick="app.navigate('register')">Get Started</button>
                <button class="btn btn-secondary" onclick="app.navigate('login')">I Have an Account</button>
            </div>
        `;
    },

    renderRegister() {
        return `
            <div class="form-container">
                <p style="color: #666; margin-bottom: 20px;">Create your account to start discovering cafes</p>

                <div class="input-group">
                    <label>Name</label>
                    <input type="text" id="name" placeholder="John Doe">
                </div>

                <div class="input-group">
                    <label>Email</label>
                    <input type="email" id="email" placeholder="john@example.com">
                </div>

                <div class="input-group">
                    <label>Password</label>
                    <input type="password" id="password" placeholder="Min 8 characters">
                </div>

                <button class="btn" onclick="handleRegister()">Create Account</button>
                <button class="btn btn-secondary" onclick="app.navigate('login')">Already have an account?</button>
            </div>
        `;
    },

    renderLogin() {
        return `
            <div class="form-container">
                <p style="color: #666; margin-bottom: 20px;">Welcome back! Login to continue</p>

                <div class="input-group">
                    <label>Email</label>
                    <input type="email" id="email" placeholder="john@example.com">
                </div>

                <div class="input-group">
                    <label>Password</label>
                    <input type="password" id="password" placeholder="Your password">
                </div>

                <button class="btn" onclick="handleLogin()">Log In</button>
                <button class="btn btn-secondary" onclick="app.navigate('register')">Create new account</button>
            </div>
        `;
    },

    renderProfileSetup() {
        return `
            <div class="form-container">
                <p style="color: #666; margin-bottom: 20px;">Tell us a bit about yourself</p>

                <div class="input-group">
                    <label>Phone Number (Optional)</label>
                    <input type="tel" id="phone" placeholder="+1-555-123-4567">
                </div>

                <div class="input-group">
                    <label>Birthday (Optional)</label>
                    <input type="date" id="birthday">
                </div>

                <div class="input-group">
                    <label>Personality Type (Optional)</label>
                    <select id="personality">
                        <option value="">Select your MBTI</option>
                        <option value="INTJ">INTJ</option>
                        <option value="INTP">INTP</option>
                        <option value="ENTJ">ENTJ</option>
                        <option value="ENTP">ENTP</option>
                        <option value="INFJ">INFJ</option>
                        <option value="INFP">INFP</option>
                        <option value="ENFJ">ENFJ</option>
                        <option value="ENFP">ENFP</option>
                        <option value="ISTJ">ISTJ</option>
                        <option value="ISFJ">ISFJ</option>
                        <option value="ESTJ">ESTJ</option>
                        <option value="ESFJ">ESFJ</option>
                        <option value="ISTP">ISTP</option>
                        <option value="ISFP">ISFP</option>
                        <option value="ESTP">ESTP</option>
                        <option value="ESFP">ESFP</option>
                    </select>
                </div>

                <button class="btn" onclick="handleProfileSetup()">Continue</button>
                <button class="btn btn-secondary" onclick="app.navigate('explore')">Skip for now</button>
            </div>
        `;
    },

    renderExplore() {
        return `
            <div class="search-container">
                <input type="text" class="search-bar" id="search-query" placeholder="Search for cafes..." onkeypress="if(event.key==='Enter') searchCafes()">
                <button class="btn" onclick="searchCafes()" style="margin-top: 10px;">Search</button>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="switchTab('search')">Search</button>
                <button class="tab" onclick="switchTab('nearby')">Nearby</button>
            </div>

            <div id="search-tab">
                <div id="search-results" class="cafe-list">
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <p>Search for cafes by name</p>
                    </div>
                </div>
            </div>

            <div id="nearby-tab" style="display: none;">
                <div class="form-container" style="padding-top: 0;">
                    <div class="input-group">
                        <label>Latitude</label>
                        <input type="text" id="latitude" placeholder="37.7749" value="37.7749">
                    </div>
                    <div class="input-group">
                        <label>Longitude</label>
                        <input type="text" id="longitude" placeholder="-122.4194" value="-122.4194">
                    </div>
                    <div class="input-group">
                        <label>Radius (km)</label>
                        <input type="number" id="radius" value="5">
                    </div>
                    <div class="input-group">
                        <label>Sort By</label>
                        <select id="sort-by">
                            <option value="">Default</option>
                            <option value="FOOD">Food</option>
                            <option value="DRINKS">Drinks</option>
                            <option value="AMBIENCE">Ambience</option>
                            <option value="SERVICE">Service</option>
                        </select>
                    </div>
                    <button class="btn" onclick="searchNearby()">Find Nearby Cafes</button>
                </div>
                <div id="nearby-results" class="cafe-list"></div>
            </div>
        `;
    },

    renderSaved() {
        return `
            <div id="saved-cafes" class="cafe-list">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading saved cafes...</p>
                </div>
            </div>
        `;
    },

    renderVisited() {
        return `
            <div id="visited-cafes" class="cafe-list">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading visited cafes...</p>
                </div>
            </div>
        `;
    },

    renderProfile() {
        return `
            <div id="profile-content">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        `;
    },

    renderCafeDetail(cafe) {
        state.selectedCafe = cafe;

        return `
            <div class="cafe-detail">
                <div class="cafe-hero">☕</div>

                <h2 style="font-size: 24px; margin-bottom: 10px;">${cafe.name}</h2>
                <p style="color: #666; margin-bottom: 15px;">${cafe.address || 'Address not available'}</p>

                <div class="cafe-actions">
                    <button class="action-btn" id="follow-btn" onclick="toggleFollow()">
                        ${cafe.isFollowing ? '✓ Following' : '+ Follow'}
                    </button>
                    <button class="action-btn" id="save-btn" onclick="toggleSave()">
                        ${cafe.isSaved ? '📌 Saved' : 'Save'}
                    </button>
                    <button class="action-btn" id="visit-btn" onclick="toggleVisited()">
                        ${cafe.isVisited ? '✓ Visited' : 'Mark Visited'}
                    </button>
                </div>

                <button class="btn" onclick="app.navigate('write-review', { cafe: state.selectedCafe })">Write a Review</button>

                <div class="section">
                    <div class="section-title">Sip It Rating</div>
                    <div style="font-size: 36px; color: #6366F1; font-weight: 600;">
                        ${cafe.sipItRating ? cafe.sipItRating.toFixed(1) : 'N/A'} <span style="font-size: 16px; color: #666;">/5.0</span>
                    </div>
                </div>

                ${cafe.ratings ? `
                <div class="section">
                    <div class="section-title">Ratings Breakdown</div>
                    <div class="rating-bars">
                        <div class="rating-item">
                            <span class="rating-label">Food</span>
                            <div class="rating-bar">
                                <div class="rating-fill" style="width: ${(cafe.ratings.avgFood / 5) * 100}%"></div>
                            </div>
                            <span class="rating-value">${cafe.ratings.avgFood.toFixed(1)}</span>
                        </div>
                        <div class="rating-item">
                            <span class="rating-label">Drinks</span>
                            <div class="rating-bar">
                                <div class="rating-fill" style="width: ${(cafe.ratings.avgDrinks / 5) * 100}%"></div>
                            </div>
                            <span class="rating-value">${cafe.ratings.avgDrinks.toFixed(1)}</span>
                        </div>
                        <div class="rating-item">
                            <span class="rating-label">Ambience</span>
                            <div class="rating-bar">
                                <div class="rating-fill" style="width: ${(cafe.ratings.avgAmbience / 5) * 100}%"></div>
                            </div>
                            <span class="rating-value">${cafe.ratings.avgAmbience.toFixed(1)}</span>
                        </div>
                        <div class="rating-item">
                            <span class="rating-label">Service</span>
                            <div class="rating-bar">
                                <div class="rating-fill" style="width: ${(cafe.ratings.avgService / 5) * 100}%"></div>
                            </div>
                            <span class="rating-value">${cafe.ratings.avgService.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${cafe.bestForTags && cafe.bestForTags.length > 0 ? `
                <div class="section">
                    <div class="section-title">Best For</div>
                    <div class="tags">
                        ${cafe.bestForTags.map(tag => `<span class="tag">${tag.tag} (${tag.count})</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                ${cafe.mostPopularItems && cafe.mostPopularItems.length > 0 ? `
                <div class="section">
                    <div class="section-title">Most Popular Menu Items</div>
                    ${cafe.mostPopularItems.map(item => `
                        <div class="menu-item">
                            <div class="menu-item-name">${item.itemName}</div>
                            <div class="menu-item-meta">
                                ${item.itemType} • ⭐ ${item.avgRating.toFixed(1)} • Ordered by ${item.count} ${item.count === 1 ? 'person' : 'people'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
    },

    renderWriteReview(cafe) {
        return `
            <div class="form-container">
                <p style="color: #666; margin-bottom: 20px;">Rate ${cafe.name}</p>

                <div class="input-group">
                    <label>Food (1-5)</label>
                    <input type="number" id="food-rating" min="1" max="5" step="0.5" value="5">
                </div>

                <div class="input-group">
                    <label>Drinks (1-5)</label>
                    <input type="number" id="drinks-rating" min="1" max="5" step="0.5" value="5">
                </div>

                <div class="input-group">
                    <label>Ambience (1-5)</label>
                    <input type="number" id="ambience-rating" min="1" max="5" step="0.5" value="5">
                </div>

                <div class="input-group">
                    <label>Service (1-5)</label>
                    <input type="number" id="service-rating" min="1" max="5" step="0.5" value="5">
                </div>

                <div class="input-group">
                    <label>Comment (Optional)</label>
                    <textarea id="comment" rows="4" placeholder="Share your experience..."></textarea>
                </div>

                <div class="section">
                    <div class="section-title">What's the Move?</div>
                    <div class="mood-tags" id="mood-tags">
                        ${MOOD_TAGS.map(tag => `
                            <div class="mood-tag" onclick="toggleMoodTag(this, '${tag}')">${tag}</div>
                        `).join('')}
                    </div>
                </div>

                <button class="btn" onclick="submitReview()">Submit Review</button>
            </div>
        `;
    },

    renderSettings() {
        return `
            <div class="form-container">
                <div class="section">
                    <div class="section-title">Change Password</div>
                    <div class="input-group">
                        <label>Current Password</label>
                        <input type="password" id="current-password" placeholder="Current password">
                    </div>
                    <div class="input-group">
                        <label>New Password</label>
                        <input type="password" id="new-password" placeholder="New password (min 8 chars)">
                    </div>
                    <button class="btn" onclick="changePassword()">Change Password</button>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

                <button class="btn btn-secondary" onclick="logout()">Log Out</button>
            </div>
        `;
    },

    // DATA LOADING

    async loadSavedCafes() {
        try {
            const response = await apiCall('/saved-cafes');
            const cafes = response.data || [];

            const container = document.getElementById('saved-cafes');
            if (cafes.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📌</div>
                        <p>No saved cafes yet</p>
                        <button class="btn" onclick="app.navigate('explore')" style="max-width: 200px; margin: 20px auto 0;">Explore Cafes</button>
                    </div>
                `;
            } else {
                container.innerHTML = cafes.map(item => renderCafeCard(item.cafe)).join('');
            }
        } catch (error) {
            showAlert('Error', error.message);
        }
    },

    async loadVisitedCafes() {
        try {
            const response = await apiCall('/visited-cafes');
            const cafes = response.data || [];

            const container = document.getElementById('visited-cafes');
            if (cafes.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">✓</div>
                        <p>No visited cafes yet</p>
                        <button class="btn" onclick="app.navigate('explore')" style="max-width: 200px; margin: 20px auto 0;">Explore Cafes</button>
                    </div>
                `;
            } else {
                container.innerHTML = cafes.map(item => renderCafeCard(item.cafe)).join('');
            }
        } catch (error) {
            showAlert('Error', error.message);
        }
    },

    async loadUserProfile() {
        try {
            const response = await apiCall(`/users/${state.userId}`);
            const user = response.data;
            state.userProfile = user;

            const container = document.getElementById('profile-content');
            container.innerHTML = `
                <div class="profile-header">
                    <div class="profile-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div class="profile-name">${user.name}</div>
                    ${user.expertise ? `<div class="profile-badge">🏆 ${user.expertise} Expert</div>` : ''}
                </div>

                <div class="profile-stats">
                    <div class="stat">
                        <div class="stat-number">${user.cafesVisitedCount || 0}</div>
                        <div class="stat-label">Cafes Visited</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${user._count?.reviews || 0}</div>
                        <div class="stat-label">Reviews</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${user._count?.personalMenuItems || 0}</div>
                        <div class="stat-label">Menu Items</div>
                    </div>
                </div>

                <div class="list-item" onclick="app.navigate('settings')">
                    <div class="list-item-title">⚙️ Settings</div>
                    <div class="list-item-subtitle">Manage your account</div>
                </div>

                ${user.personalMenuItems && user.personalMenuItems.length > 0 ? `
                <div style="padding: 20px;">
                    <div class="section-title">My Menu</div>
                    ${user.personalMenuItems.map(item => `
                        <div class="menu-item">
                            <div class="menu-item-name">${item.itemName}</div>
                            <div class="menu-item-meta">
                                ${item.itemType} • ⭐ ${item.rating.toFixed(1)} • ${item.cafeName}
                            </div>
                            ${item.notes ? `<p style="margin-top: 5px; font-size: 14px; color: #666;">${item.notes}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            `;
        } catch (error) {
            showAlert('Error', error.message);
        }
    }
};

// HELPERS

function renderCafeCard(cafe) {
    return `
        <div class="cafe-card" onclick="viewCafeDetails('${cafe.googlePlaceId}')">
            <h3>${cafe.name}</h3>
            ${cafe.ratings ? `
                <div class="rating">⭐ ${cafe.sipItRating ? cafe.sipItRating.toFixed(1) : 'N/A'}</div>
            ` : ''}
            ${cafe.address ? `<div class="address">${cafe.address}</div>` : ''}
            ${cafe.bestForTags && cafe.bestForTags.length > 0 ? `
                <div class="tags">
                    ${cafe.bestForTags.slice(0, 3).map(tag => `<span class="tag">${tag.tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// EVENT HANDLERS

async function handleRegister() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        showAlert('Error', 'Please fill in all fields');
        return;
    }

    try {
        const response = await apiCall('/auth/register', 'POST', { name, email, password }, false);

        state.accessToken = response.data.session.access_token;
        state.userId = response.data.user.id;
        localStorage.setItem('accessToken', state.accessToken);
        localStorage.setItem('userId', state.userId);

        showAlert('Success', 'Account created successfully!');
        setTimeout(() => {
            hideAlert();
            app.navigate('profile-setup');
        }, 1500);
    } catch (error) {
        if (error.message.includes('rate limit')) {
            showAlert('Rate Limited', 'Too many attempts. Please wait a few minutes or try a different email address.');
        } else {
            showAlert('Error', error.message);
        }
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showAlert('Error', 'Please fill in all fields');
        return;
    }

    try {
        const response = await apiCall('/auth/login', 'POST', { email, password }, false);

        state.accessToken = response.data.session.access_token;
        state.userId = response.data.user.id;
        localStorage.setItem('accessToken', state.accessToken);
        localStorage.setItem('userId', state.userId);

        showAlert('Success', 'Logged in successfully!');
        setTimeout(() => {
            hideAlert();
            app.navigate('explore');
        }, 1500);
    } catch (error) {
        showAlert('Error', error.message);
    }
}

async function handleProfileSetup() {
    const phone = document.getElementById('phone').value;
    const birthday = document.getElementById('birthday').value;
    const personality = document.getElementById('personality').value;

    const body = {};
    if (phone) body.phoneNumber = phone;
    if (birthday) body.birthday = new Date(birthday).toISOString();
    if (personality) body.personalityType = personality;

    try {
        if (Object.keys(body).length > 0) {
            await apiCall('/users/profile', 'PUT', body);
        }

        showAlert('Success', 'Profile updated!');
        setTimeout(() => {
            hideAlert();
            app.navigate('explore');
        }, 1500);
    } catch (error) {
        showAlert('Error', error.message);
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'search') {
        document.getElementById('search-tab').style.display = 'block';
        document.getElementById('nearby-tab').style.display = 'none';
    } else {
        document.getElementById('search-tab').style.display = 'none';
        document.getElementById('nearby-tab').style.display = 'block';
    }
}

async function searchCafes() {
    const query = document.getElementById('search-query').value;
    if (!query) {
        showAlert('Error', 'Please enter a search term');
        return;
    }

    const container = document.getElementById('search-results');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';

    try {
        const response = await apiCall(`/search/cafes?query=${encodeURIComponent(query)}`);
        const cafes = response.data || [];

        if (cafes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😕</div>
                    <p>No cafes found</p>
                </div>
            `;
        } else {
            container.innerHTML = cafes.map(cafe => renderCafeCard(cafe)).join('');
        }
    } catch (error) {
        showAlert('Error', error.message);
        container.innerHTML = '';
    }
}

async function searchNearby() {
    const lat = document.getElementById('latitude').value;
    const lng = document.getElementById('longitude').value;
    const radius = document.getElementById('radius').value;
    const sortBy = document.getElementById('sort-by').value;

    const container = document.getElementById('nearby-results');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Finding cafes...</p></div>';

    try {
        let url = `/explore/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`;
        if (sortBy) url += `&sortBy=${sortBy}`;

        const response = await apiCall(url);
        const cafes = response.data || [];

        if (cafes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📍</div>
                    <p>No cafes found nearby</p>
                </div>
            `;
        } else {
            container.innerHTML = cafes.map(cafe => renderCafeCard(cafe)).join('');
        }
    } catch (error) {
        showAlert('Error', error.message);
        container.innerHTML = '';
    }
}

async function viewCafeDetails(placeId) {
    try {
        const response = await apiCall(`/cafes/details/${placeId}`);
        app.navigate('cafe-detail', { cafe: response.data });
    } catch (error) {
        showAlert('Error', error.message);
    }
}

async function toggleFollow() {
    const cafe = state.selectedCafe;
    const btn = document.getElementById('follow-btn');

    try {
        if (cafe.isFollowing) {
            await apiCall(`/cafes/${cafe.googlePlaceId}/unfollow`, 'DELETE');
            cafe.isFollowing = false;
            btn.textContent = '+ Follow';
            btn.classList.remove('active');
        } else {
            await apiCall(`/cafes/${cafe.googlePlaceId}/follow`, 'POST');
            cafe.isFollowing = true;
            btn.textContent = '✓ Following';
            btn.classList.add('active');
        }
    } catch (error) {
        showAlert('Error', error.message);
    }
}

async function toggleSave() {
    const cafe = state.selectedCafe;
    const btn = document.getElementById('save-btn');

    try {
        if (cafe.isSaved) {
            await apiCall(`/saved-cafes/${cafe.googlePlaceId}`, 'DELETE');
            cafe.isSaved = false;
            btn.textContent = 'Save';
            btn.classList.remove('active');
        } else {
            await apiCall(`/saved-cafes/${cafe.googlePlaceId}`, 'POST');
            cafe.isSaved = true;
            btn.textContent = '📌 Saved';
            btn.classList.add('active');
        }
    } catch (error) {
        showAlert('Error', error.message);
    }
}

async function toggleVisited() {
    const cafe = state.selectedCafe;
    const btn = document.getElementById('visit-btn');

    try {
        if (cafe.isVisited) {
            await apiCall(`/visited-cafes/${cafe.googlePlaceId}`, 'DELETE');
            cafe.isVisited = false;
            btn.textContent = 'Mark Visited';
            btn.classList.remove('active');
        } else {
            await apiCall(`/visited-cafes/${cafe.googlePlaceId}`, 'POST');
            cafe.isVisited = true;
            btn.textContent = '✓ Visited';
            btn.classList.add('active');
        }
    } catch (error) {
        showAlert('Error', error.message);
    }
}

const selectedMoodTags = [];

function toggleMoodTag(element, tag) {
    const index = selectedMoodTags.indexOf(tag);
    if (index > -1) {
        selectedMoodTags.splice(index, 1);
        element.classList.remove('selected');
    } else {
        selectedMoodTags.push(tag);
        element.classList.add('selected');
    }
}

async function submitReview() {
    const cafe = state.selectedCafe;
    const foodRating = parseFloat(document.getElementById('food-rating').value);
    const drinksRating = parseFloat(document.getElementById('drinks-rating').value);
    const ambienceRating = parseFloat(document.getElementById('ambience-rating').value);
    const serviceRating = parseFloat(document.getElementById('service-rating').value);
    const comment = document.getElementById('comment').value;

    try {
        await apiCall('/reviews', 'POST', {
            cafeId: cafe.id,
            foodRating,
            drinksRating,
            ambienceRating,
            serviceRating,
            comment: comment || undefined,
            moodTags: selectedMoodTags
        });

        showAlert('Success', 'Review submitted successfully!');
        selectedMoodTags.length = 0;

        setTimeout(() => {
            hideAlert();
            app.goBack();
        }, 1500);
    } catch (error) {
        showAlert('Error', error.message);
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    if (!currentPassword || !newPassword) {
        showAlert('Error', 'Please fill in both fields');
        return;
    }

    if (newPassword.length < 8) {
        showAlert('Error', 'New password must be at least 8 characters');
        return;
    }

    try {
        await apiCall('/auth/change-password', 'POST', { currentPassword, newPassword });
        showAlert('Success', 'Password changed successfully!');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
    } catch (error) {
        showAlert('Error', error.message);
    }
}

function logout() {
    state.accessToken = null;
    state.userId = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');

    showAlert('Success', 'Logged out successfully!');
    setTimeout(() => {
        hideAlert();
        app.navigate('welcome');
    }, 1500);
}

// Export for use in HTML
window.app = app;
window.hideAlert = hideAlert;
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.handleProfileSetup = handleProfileSetup;
window.switchTab = switchTab;
window.searchCafes = searchCafes;
window.searchNearby = searchNearby;
window.viewCafeDetails = viewCafeDetails;
window.toggleFollow = toggleFollow;
window.toggleSave = toggleSave;
window.toggleVisited = toggleVisited;
window.toggleMoodTag = toggleMoodTag;
window.submitReview = submitReview;
window.changePassword = changePassword;
window.logout = logout;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
