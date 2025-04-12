// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginFormElement = document.getElementById('login-form');
const signupFormElement = document.getElementById('signup-form');
const loginResponseMessage = document.getElementById('login-response');
const signupResponseMessage = document.getElementById('signup-response');

// API URLs
const API_URL = '/api';

// Switch tabs
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  loginFormElement.classList.add('active');
  signupFormElement.classList.remove('active');
});

signupTab.addEventListener('click', () => {
  signupTab.classList.add('active');
  loginTab.classList.remove('active');
  signupFormElement.classList.add('active');
  loginFormElement.classList.remove('active');
});

// Helper to display response messages
function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.remove('response-success', 'response-error');
  element.classList.add(isError ? 'response-error' : 'response-success');
  element.style.display = 'block';
  
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

// Store user data in session storage
function storeUserData(userData, token) {
  sessionStorage.setItem('user', JSON.stringify(userData));
  sessionStorage.setItem('token', token);
}

// Check if user is logged in
function checkAuth() {
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
  if (token && user.user_id) {
    return true;
  }
  return false;
}

// Update UI based on auth state
function updateAuthUI() {
  const isLoggedIn = checkAuth();
  const authButtons = document.getElementById('auth-buttons');
  const welcomeMessage = document.getElementById('welcome-message');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
  if (isLoggedIn && authButtons) {
    authButtons.innerHTML = `
      <button id="logout-btn" class="btn btn-outline">Logout</button>
      <a href="/profile" class="btn btn-primary">My Profile</a>
    `;
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    if (welcomeMessage) {
      welcomeMessage.textContent = `Welcome, ${user.first_name || 'User'}!`;
      welcomeMessage.style.display = 'block';
    }
    
    // Hide auth forms if user is logged in
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.style.display = 'none';
    }
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showMessage(loginResponseMessage, 'Please fill in all fields', true);
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to login');
    }
    
    showMessage(loginResponseMessage, 'Login successful! Redirecting...');
    storeUserData(data.user, data.token);
    
    // Redirect after successful login
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
    
  } catch (error) {
    showMessage(loginResponseMessage, error.message, true);
  }
}

// Handle Signup
async function handleSignup(e) {
  e.preventDefault();
  const firstName = document.getElementById('signup-firstname').value;
  const lastName = document.getElementById('signup-lastname').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  if (!firstName || !lastName || !email || !password) {
    showMessage(signupResponseMessage, 'Please fill in all fields', true);
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to sign up');
    }
    
    showMessage(signupResponseMessage, 'Signup successful! Redirecting to login...');
    storeUserData(data.user, data.token);
    
    // Redirect after successful signup
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
    
  } catch (error) {
    showMessage(signupResponseMessage, error.message, true);
  }
}

// Handle Logout
async function handleLogout() {
  try {
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to logout');
    }
    
    // Clear session storage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    
    // Redirect after logout
    window.location.href = '/';
    
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear session storage even if the API call fails
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    window.location.href = '/';
  }
}

// Event Listeners
if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

if (signupForm) {
  signupForm.addEventListener('submit', handleSignup);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
}); 