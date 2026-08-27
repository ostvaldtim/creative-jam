// РљРѕРЅС„РёРіСѓСЂР°С†РёСЏ backend API
const API_URL = '';

// РЈС‚РёР»РёС‚Р° РґР»СЏ РїРѕРєР°Р·Р° СѓРІРµРґРѕРјР»РµРЅРёР№
function showNotification(message, type = 'error') {
    // Get or create container
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('role', 'status');
        document.body.appendChild(container);
    }

    // SVG icons per type
    const icons = {
        success: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l2.5 2.5L16 9"/>
        </svg>`,
        error: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>`,
        warning: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`,
        info: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>`
    };

    // Close icon
    const closeIcon = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18M6 6l12 12"/>
    </svg>`;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    notification.innerHTML = `
        <div class="notification-accent"></div>
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close">${closeIcon}</button>
        <div class="notification-progress"><div class="notification-progress-bar"></div></div>
    `;

    // Close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });

    // Append to container
    container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    });

    // Auto remove after 4s
    let autoRemoveTimer = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);

    // Pause progress on hover
    notification.addEventListener('mouseenter', () => {
        clearTimeout(autoRemoveTimer);
        const bar = notification.querySelector('.notification-progress-bar');
        if (bar) bar.style.animationPlayState = 'paused';
    });

    notification.addEventListener('mouseleave', () => {
        const bar = notification.querySelector('.notification-progress-bar');
        if (bar) bar.style.animationPlayState = 'running';
        autoRemoveTimer = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    });
}

// Р’Р°Р»РёРґР°С†РёСЏ email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Р’Р°Р»РёРґР°С†РёСЏ РїР°СЂРѕР»СЏ
function validatePassword(password) {
    return password.length >= 6;
}

// РџРѕРєР°Р·Р°С‚СЊ РѕС€РёР±РєСѓ РІР°Р»РёРґР°С†РёРё  РїРѕРґ РїРѕР»РµРј
function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // РЈР±СЂР°С‚СЊ СЃС‚Р°СЂСѓСЋ РѕС€РёР±РєСѓ
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }

    // Р”РѕР±Р°РІРёС‚СЊ РєР»Р°СЃСЃ error
    input.classList.add('error');

    // РЎРѕР·РґР°С‚СЊ СЌР»РµРјРµРЅС‚ РѕС€РёР±РєРё
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.textContent = message;

    // Р”РѕР±Р°РІРёС‚СЊ РїРѕСЃР»Рµ input
    input.parentElement.appendChild(errorEl);
}

// РћС‡РёСЃС‚РёС‚СЊ РѕС€РёР±РєРё РїРѕР»СЏ
function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.remove('error');
    const errorEl = input.parentElement.querySelector('.field-error');
    if (errorEl) {
        errorEl.remove();
    }
}

// РџРµСЂРµРєР»СЋС‡РµРЅРёРµ РјРµР¶РґСѓ РІРєР»Р°РґРєР°РјРё Р’С…РѕРґ/Р РµРіРёСЃС‚СЂР°С†РёСЏ
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabs[1].classList.add('active');
    }

    // РћС‡РёСЃС‚РёС‚СЊ РІСЃРµ РѕС€РёР±РєРё РїСЂРё РїРµСЂРµРєР»СЋС‡РµРЅРёРё
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.field-error').forEach(el => el.remove());
}

// РђРІС‚РѕСЂРёР·Р°С†РёСЏ С‡РµСЂРµР· Google
function loginWithGoogle() {
    window.location.href = `${API_URL}/auth/google`;
}

// РђРІС‚РѕСЂРёР·Р°С†РёСЏ С‡РµСЂРµР· VK ID
async function loginWithVK() {
    // VK OAuth 2.0
    const VK_APP_ID = 54443210;
    const REDIRECT_URI = `${window.location.origin}/`;

    // Р“РµРЅРµСЂРёСЂСѓРµРј state РґР»СЏ Р·Р°С‰РёС‚С‹ РѕС‚ CSRF
    const state = generateState();
    sessionStorage.setItem('vk_state', state);

    // Р¤РѕСЂРјРёСЂСѓРµРј URL Р°РІС‚РѕСЂРёР·Р°С†РёРё VK
    const authUrl = `https://oauth.vk.com/authorize?` +
        `client_id=${VK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=email` +
        `&state=${state}` +
        `&v=5.131`;

    // Р РµРґРёСЂРµРєС‚ РЅР° VK OAuth
    window.location.href = authUrl;
}

// Р“РµРЅРµСЂР°С†РёСЏ code_verifier РґР»СЏ PKCE
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
}

// Р“РµРЅРµСЂР°С†РёСЏ code_challenge РёР· code_verifier
async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64URLEncode(new Uint8Array(hash));
}

// Base64 URL encoding
function base64URLEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Р“РµРЅРµСЂР°С†РёСЏ state РґР»СЏ Р·Р°С‰РёС‚С‹ РѕС‚ CSRF
function generateState() {
    return Math.random().toString(36).substring(2, 15);
}

// РћР±СЂР°Р±РѕС‚РєР° РІС…РѕРґР° С‡РµСЂРµР· email
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // РћС‡РёСЃС‚РёС‚СЊ РїСЂРµРґС‹РґСѓС‰РёРµ РѕС€РёР±РєРё
    clearFieldError('loginEmail');
    clearFieldError('loginPassword');

    // Р’Р°Р»РёРґР°С†РёСЏ
    let hasError = false;

    if (!email) {
        showFieldError('loginEmail', 'Р’РІРµРґРёС‚Рµ email');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError('loginEmail', 'РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ С„РѕСЂРјР°С‚ email');
        hasError = true;
    }

    if (!password) {
        showFieldError('loginPassword', 'Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ');
        hasError = true;
    }

    if (hasError) return;

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
            showNotification(data.message || 'Неверный email или пароль', 'error');
            return;
        }

        // РЎРѕС…СЂР°РЅРёС‚СЊ С‚РѕРєРµРЅ Рё РґР°РЅРЅС‹Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // РџРѕРєР°Р·Р°С‚СЊ СѓСЃРїРµС€РЅРѕРµ СѓРІРµРґРѕРјР»РµРЅРёРµ
        showNotification('Вход выполнен успешно', 'success');

        // РќРµР±РѕР»СЊС€Р°СЏ Р·Р°РґРµСЂР¶РєР° РґР»СЏ РїРѕРєР°Р·Р° СѓРІРµРґРѕРјР»РµРЅРёСЏ
        setTimeout(() => showApp(data.user), 500);

    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// РћР±СЂР°Р±РѕС‚РєР° СЂРµРіРёСЃС‚СЂР°С†РёРё С‡РµСЂРµР· email
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const termsAccepted = document.getElementById('termsAccepted').checked;

    // РћС‡РёСЃС‚РёС‚СЊ РїСЂРµРґС‹РґСѓС‰РёРµ РѕС€РёР±РєРё
    clearFieldError('registerName');
    clearFieldError('registerEmail');
    clearFieldError('registerPassword');

    // Р’Р°Р»РёРґР°С†РёСЏ
    let hasError = false;

    if (!name || name.length < 2) {
        showFieldError('registerName', 'Р’РІРµРґРёС‚Рµ РёРјСЏ (РјРёРЅРёРјСѓРј 2 СЃРёРјРІРѕР»Р°)');
        hasError = true;
    }

    if (!email) {
        showFieldError('registerEmail', 'Р’РІРµРґРёС‚Рµ email');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError('registerEmail', 'РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ С„РѕСЂРјР°С‚ email');
        hasError = true;
    }

    if (!password) {
        showFieldError('registerPassword', 'Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ');
        hasError = true;
    } else if (!validatePassword(password)) {
        showFieldError('registerPassword', 'РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РјРёРЅРёРјСѓРј 6 СЃРёРјРІРѕР»РѕРІ');
        hasError = true;
    }

    if (!termsAccepted) {
        showNotification('Необходимо принять условия использования', 'error');
        hasError = true;
    }

    if (hasError) return;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                termsAccepted
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || 'Ошибка регистрации', 'error');
            return;
        }

        // РЎРѕС…СЂР°РЅРёС‚СЊ С‚РѕРєРµРЅ Рё РґР°РЅРЅС‹Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // РџРѕРєР°Р·Р°С‚СЊ СѓСЃРїРµС€РЅРѕРµ СѓРІРµРґРѕРјР»РµРЅРёРµ
        showNotification('Регистрация прошла успешно', 'success');

        // РќРµР±РѕР»СЊС€Р°СЏ Р·Р°РґРµСЂР¶РєР° РґР»СЏ РїРѕРєР°Р·Р° СѓРІРµРґРѕРјР»РµРЅРёСЏ
        setTimeout(() => showApp(data.user), 500);

    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// РџРѕРєР°Р·Р°С‚СЊ РїСЂРёР»РѕР¶РµРЅРёРµ РїРѕСЃР»Рµ СѓСЃРїРµС€РЅРѕР№ Р°РІС‚РѕСЂРёР·Р°С†РёРё
function showApp(user) {
    document.getElementById('app').style.display = 'flex';

    // Обновить UI с данными пользователя
    updateUserUI(user);

    // Подгрузить актуальный план с сервера (может отличаться от localStorage)
    fetchCurrentPlan();
}

// Обновить UI с данными пользователя
function updateUserUI(user) {
    const finalName = user.name || 'Артём Оствальд';
    const finalPlan = (user.plan || 'TRIAL').toUpperCase();

    // Имя пользователя
    const userNameElements = document.querySelectorAll('#userName');
    userNameElements.forEach(el => {
        el.textContent = finalName;
    });

    // Аватар (инициалы)
    const initials = finalName.charAt(0).toUpperCase();
    const userAvatarElements = document.querySelectorAll('#userAvatar');
    userAvatarElements.forEach(el => {
        el.textContent = initials;
        if (user.avatar) {
            el.style.backgroundImage = `url(${user.avatar})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.textContent = '';
        } else {
            el.style.backgroundImage = '';
            el.textContent = initials;
        }
    });

    // Тариф
    const userPlanElements = document.querySelectorAll('#userPlan, #menuUserPlan, #userPlanBadge');
    const planKey = (user.plan || 'trial').toLowerCase();
    userPlanElements.forEach(el => {
        el.textContent = finalPlan;
        el.setAttribute('data-plan', planKey);
    });

    // Usage
    if (user.usage !== undefined) {
        const limit = user.limit || 100;
        const percentage = (user.usage / limit) * 100;
        const usageFill = document.getElementById('usageFill');
        const usageText = document.getElementById('usageText');

        if (usageFill) usageFill.style.width = `${percentage}%`;
        if (usageText) usageText.textContent = `${user.usage} из ${limit} джемов подготовлено`;
    }
}

// Загрузить актуальный план с сервера и обновить UI + localStorage
async function fetchCurrentPlan() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/payments/plan`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

        // Обновляем localStorage и UI если план изменился
        if (data.plan && data.plan !== savedUser.plan) {
            savedUser.plan = data.plan;
            savedUser.usage = data.usage;
            savedUser.limit = data.limit;
            localStorage.setItem('user', JSON.stringify(savedUser));
            updateUserUI(savedUser);
            console.log(`🔄 План обновлён: ${data.plan.toUpperCase()}`);
        }
    } catch (err) {
        console.error('Ошибка загрузки плана:', err);
    }
}

// Выход
async function handleLogout() {
    if (!await showConfirm('Вы уверены, что хотите выйти?', 'Выход', false)) {
        return;
    }

    const token = localStorage.getItem('authToken');

    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // РћС‡РёСЃС‚РёС‚СЊ РґР°РЅРЅС‹Рµ
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Redirect to landing page
    window.location.href = '/';
}

// РџРѕРєР°Р·Р°С‚СЊ Terms & Conditions
function showTerms() {
    showNotification('Страница условий использования в разработке', 'info');
}

// РџРѕРєР°Р·Р°С‚СЊ Privacy Policy
function showPrivacy() {
    showNotification('Страница политики конфиденциальности в разработке', 'info');
}

// РџСЂРѕРІРµСЂРєР° Р°РІС‚РѕСЂРёР·Р°С†РёРё РїСЂРё Р·Р°РіСЂСѓР·РєРµ СЃС‚СЂР°РЅРёС†С‹
async function checkAuth() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for OAuth exchange code
    const oauthCode = urlParams.get('code');
    const vkState = urlParams.get('state');

    // VK callback (has state param)
    if (oauthCode && vkState) {
        try {
            const savedState = sessionStorage.getItem('vk_state');

            if (savedState && savedState !== vkState) {
                throw new Error('Invalid state parameter');
            }

            const response = await fetch(`${API_URL}/auth/vk-id/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: oauthCode
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                sessionStorage.removeItem('vk_state');
                window.history.replaceState({}, document.title, window.location.pathname);

                showNotification('Авторизация через VK выполнена', 'success');
                setTimeout(() => showApp(data.user), 500);
                return;
            } else {
                showNotification(data.message || 'Ошибка авторизации через VK', 'error');
                sessionStorage.removeItem('vk_state');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('VK callback error:', error);
            showNotification('Ошибка авторизации через VK', 'error');
            sessionStorage.removeItem('vk_state');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    // Google OAuth exchange code (no state param)
    else if (oauthCode && !urlParams.get('token')) {
        try {
            const response = await fetch(`${API_URL}/auth/exchange`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: oauthCode })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                window.history.replaceState({}, document.title, window.location.pathname);

                showNotification('Авторизация через Google выполнена', 'success');
                setTimeout(() => showApp(data.user), 500);
                return;
            } else {
                showNotification(data.error || 'Ошибка авторизации', 'error');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('OAuth exchange error:', error);
            showNotification('Ошибка подключения к серверу', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    // Р•СЃР»Рё РµСЃС‚СЊ С‚РѕРєРµРЅ РІ URL (Google OAuth callback)
    if (token && userParam) {
        try {
            const user = JSON.parse(decodeURIComponent(userParam));
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(user));

            // РћС‡РёСЃС‚РёС‚СЊ URL
            window.history.replaceState({}, document.title, window.location.pathname);

            showApp(user);
            return;
        } catch (error) {
            console.error('OAuth callback error:', error);
        }
    }

    // РџСЂРѕРІРµСЂРёС‚СЊ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ С‚РѕРєРµРЅ
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
        try {
            // РџСЂРѕРІРµСЂРёС‚СЊ РІР°Р»РёРґРЅРѕСЃС‚СЊ С‚РѕРєРµРЅР°
            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${savedToken}`
                }
            });

            if (response.ok) {
                const user = JSON.parse(savedUser);
                showApp(user);
                return;
            }
        } catch (error) {
            console.error('Token verification error:', error);
        }

        // РўРѕРєРµРЅ РЅРµРІР°Р»РёРґРµРЅ - РѕС‡РёСЃС‚РёС‚СЊ
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // Redirect to landing for authentication
    window.location.href = '/';
}

// Р”РѕР±Р°РІРёС‚СЊ РѕР±СЂР°Р±РѕС‚С‡РёРєРё РѕС‡РёСЃС‚РєРё РѕС€РёР±РѕРє РїСЂРё РІРІРѕРґРµ
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // РћС‡РёС‰Р°С‚СЊ РѕС€РёР±РєРё РїСЂРё РІРІРѕРґРµ
    const inputs = ['loginEmail', 'loginPassword', 'registerName', 'registerEmail', 'registerPassword'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearFieldError(id));
        }
    });
});
