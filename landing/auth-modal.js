/**
 * AUTH MODAL — Creative Jam Landing
 * Self-contained authentication module for landing pages.
 * Adapted from creative-jam-complete-project/frontend/js/auth.js
 *
 * Exposes global: CJAuth
 */
;(function () {
  'use strict';

  /* ──────────────────────────── CONFIG ─────────────────────────── */
  const API_URL = ''; // Same origin — server serves both landing and API

  /* ──────────────────────────── STATE ──────────────────────────── */
  let isOpen = false;
  let currentTab = 'login';
  let pendingAction = null; // { type: 'starter' | 'pro' | 'agency' | 'trial' }

  /* ──────────────────────────── UTILITIES ──────────────────────── */

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFieldError(inputEl, msg) {
    clearFieldError(inputEl);
    inputEl.classList.add('error');
    const err = document.createElement('div');
    err.className = 'auth-modal-field-error';
    err.textContent = msg;
    inputEl.parentElement.appendChild(err);
  }

  function clearFieldError(inputEl) {
    inputEl.classList.remove('error');
    const err = inputEl.parentElement.querySelector('.auth-modal-field-error');
    if (err) err.remove();
  }

  /* ──────────────────────── NOTIFICATIONS ──────────────────────── */

  const NOTIF_ICONS = {
    success: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
    error: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    info: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  function showNotification(message, type) {
    type = type || 'info';
    let container = document.getElementById('auth-notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'auth-notification-container';
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = 'auth-notif auth-notif-' + type;
    el.innerHTML =
      '<div class="auth-notif-accent"></div>' +
      '<div class="auth-notif-icon">' + (NOTIF_ICONS[type] || NOTIF_ICONS.info) + '</div>' +
      '<span class="auth-notif-msg">' + message + '</span>' +
      '<button class="auth-notif-close" aria-label="Close"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
      '<div class="auth-notif-progress"><div class="auth-notif-progress-bar"></div></div>';

    el.querySelector('.auth-notif-close').addEventListener('click', function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    });

    container.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('show'); });
    });

    let timer = setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }, 4000);

    el.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      var bar = el.querySelector('.auth-notif-progress-bar');
      if (bar) bar.style.animationPlayState = 'paused';
    });
    el.addEventListener('mouseleave', function () {
      var bar = el.querySelector('.auth-notif-progress-bar');
      if (bar) bar.style.animationPlayState = 'running';
      timer = setTimeout(function () {
        el.classList.remove('show');
        setTimeout(function () { el.remove(); }, 300);
      }, 2000);
    });
  }

  /* ──────────────────────── MODAL OPEN/CLOSE ──────────────────── */

  function open(action) {
    pendingAction = action || null;
    var backdrop = document.getElementById('authModalBackdrop');
    if (!backdrop) return;

    // If already logged in → handle action directly
    if (isLoggedIn()) {
      handlePostAuth();
      return;
    }

    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    isOpen = true;

    // Focus the first input
    setTimeout(function () {
      var input = backdrop.querySelector('.auth-modal-panel.active input');
      if (input) input.focus();
    }, 400);
  }

  function close() {
    var backdrop = document.getElementById('authModalBackdrop');
    if (!backdrop) return;
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    isOpen = false;
    pendingAction = null;
  }

  /* ──────────────────────── AUTH STATE ─────────────────────────── */

  function isLoggedIn() {
    return !!localStorage.getItem('authToken');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }

  function handlePostAuth() {
    close();
    var user = getUser();
    updateNavbarState(user);

    if (!pendingAction) {
      showNotification('Вы вошли в систему!', 'success');
      return;
    }

    var action = pendingAction;
    pendingAction = null;

    if (action === 'trial' || action === 'login') {
      // Trial/Login → просто на платформу
      showNotification('Добро пожаловать! Ваша бесплатная генерация ждёт.', 'success');
      setTimeout(function () {
        window.location.href = '/app';
      }, 1000);
    } else if (action === 'start' || action === 'pro') {
      // Start/Pro → на страницу тарифов и оплаты
      showNotification('Перенаправляем к оформлению ' + action.toUpperCase() + '…', 'info');
      sessionStorage.setItem('cj_pending_plan', action);
      setTimeout(function () {
        window.location.href = '/app#billing';
      }, 1000);
    } else if (action === 'enterprise') {
      showNotification('Свяжитесь с нами для оформления Enterprise', 'info');
      setTimeout(function () {
        window.location.href = '/app';
      }, 1500);
    }
  }

  /* ──────────────────────── TABS ───────────────────────────────── */

  function switchTab(tab) {
    currentTab = tab;
    var tabs = document.querySelectorAll('.auth-modal-tab');
    var panels = document.querySelectorAll('.auth-modal-panel');

    tabs.forEach(function (t) { t.classList.remove('active'); });
    panels.forEach(function (p) { p.classList.remove('active'); });

    var targetTab = document.querySelector('.auth-modal-tab[data-tab="' + tab + '"]');
    var targetPanel = document.getElementById('authPanel_' + tab);
    if (targetTab) targetTab.classList.add('active');
    if (targetPanel) targetPanel.classList.add('active');

    // Clear errors
    document.querySelectorAll('.auth-modal-group input.error').forEach(function (el) {
      clearFieldError(el);
    });
  }

  /* ──────────────────────── LOGIN ──────────────────────────────── */

  async function handleLogin(e) {
    e.preventDefault();

    var emailEl = document.getElementById('authLoginEmail');
    var passEl = document.getElementById('authLoginPassword');
    var email = emailEl.value.trim();
    var password = passEl.value;

    clearFieldError(emailEl);
    clearFieldError(passEl);

    var hasError = false;
    if (!email) { showFieldError(emailEl, 'Введите email'); hasError = true; }
    else if (!validateEmail(email)) { showFieldError(emailEl, 'Некорректный формат email'); hasError = true; }
    if (!password) { showFieldError(passEl, 'Введите пароль'); hasError = true; }
    if (hasError) return;

    setSubmitLoading('authLoginSubmit', true);

    try {
      var response = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      var data = await response.json();

      if (!response.ok) {
        showNotification(data.message || 'Неверный email или пароль', 'error');
        setSubmitLoading('authLoginSubmit', false);
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showNotification('Вход выполнен успешно!', 'success');
      setTimeout(function () { handlePostAuth(); }, 600);

    } catch (err) {
      console.error('Login error:', err);
      showNotification('Ошибка подключения к серверу', 'error');
    }

    setSubmitLoading('authLoginSubmit', false);
  }

  /* ──────────────────────── REGISTER ──────────────────────────── */

  async function handleRegister(e) {
    e.preventDefault();

    var nameEl = document.getElementById('authRegisterName');
    var emailEl = document.getElementById('authRegisterEmail');
    var passEl = document.getElementById('authRegisterPassword');
    var termsEl = document.getElementById('authTermsAccepted');

    var name = nameEl.value.trim();
    var email = emailEl.value.trim();
    var password = passEl.value;

    clearFieldError(nameEl);
    clearFieldError(emailEl);
    clearFieldError(passEl);

    var hasError = false;
    if (!name || name.length < 2) { showFieldError(nameEl, 'Введите имя (минимум 2 символа)'); hasError = true; }
    if (!email) { showFieldError(emailEl, 'Введите email'); hasError = true; }
    else if (!validateEmail(email)) { showFieldError(emailEl, 'Некорректный формат email'); hasError = true; }
    if (!password) { showFieldError(passEl, 'Введите пароль'); hasError = true; }
    else if (password.length < 6) { showFieldError(passEl, 'Пароль должен быть минимум 6 символов'); hasError = true; }
    if (!termsEl.checked) { showNotification('Необходимо принять условия использования', 'error'); hasError = true; }
    if (hasError) return;

    setSubmitLoading('authRegisterSubmit', true);

    try {
      var response = await fetch(API_URL + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, password: password, termsAccepted: true })
      });

      var data = await response.json();

      if (!response.ok) {
        showNotification(data.message || 'Ошибка регистрации', 'error');
        setSubmitLoading('authRegisterSubmit', false);
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showNotification('Регистрация прошла успешно!', 'success');
      setTimeout(function () { handlePostAuth(); }, 600);

    } catch (err) {
      console.error('Register error:', err);
      showNotification('Ошибка подключения к серверу', 'error');
    }

    setSubmitLoading('authRegisterSubmit', false);
  }

  /* ──────────────────────── GOOGLE OAUTH ──────────────────────── */

  function loginWithGoogle() {
    // Save pending action to restore after OAuth redirect
    if (pendingAction) {
      sessionStorage.setItem('cj_pending_action', pendingAction);
    }
    window.location.href = API_URL + '/auth/google';
  }

  /* ──────────────────────── VK ID SDK ──────────────────────────── */

  var VK_APP_ID = 54443210; // Same as in creative-jam-complete-project

  function initVkIdSdk() {
    // Dynamically load VK ID SDK
    if (document.getElementById('vkid-sdk-script')) return;
    var script = document.createElement('script');
    script.id = 'vkid-sdk-script';
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.onload = function () { renderVkButtons(); };
    script.onerror = function () { console.warn('VK ID SDK failed to load'); };
    document.head.appendChild(script);
  }

  function renderVkButtons() {
    if (!('VKIDSDK' in window)) return;
    var VKID = window.VKIDSDK;

    try {
      VKID.Config.init({
        app: VK_APP_ID,
        redirectUrl: 'https://oauth.vk.com/blank.html',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: ''
      });
    } catch (e) {
      // Config may already be initialized
      console.warn('VK ID Config init:', e.message);
    }

    // Shared success handler
    async function handleVKSuccess(payload) {
      var code = payload.code;
      var deviceId = payload.device_id;

      try {
        // Exchange code via VK SDK
        var vkData = await VKID.Auth.exchangeCode(code, deviceId);

        // Send to our backend
        var response = await fetch(API_URL + '/auth/vk-sdk/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: vkData.access_token,
            user_id: vkData.user_id,
            email: vkData.email
          })
        });

        var data = await response.json();

        if (response.ok && data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          showNotification('Вход через VK успешен!', 'success');
          setTimeout(function () { handlePostAuth(); }, 600);
        } else {
          showNotification(data.message || 'Ошибка авторизации через VK', 'error');
        }
      } catch (error) {
        console.error('VK ID Error:', error);
        showNotification('Ошибка авторизации через VK', 'error');
      }
    }

    function vkidOnError(error) {
      console.error('VK ID Error:', error);
    }

    // Render OneTap for Login tab
    var containerLogin = document.getElementById('authVkContainerLogin');
    if (containerLogin && !containerLogin.dataset.rendered) {
      try {
        var oneTapLogin = new VKID.OneTap();
        oneTapLogin.render({
          container: containerLogin,
          showAlternativeLogin: true
        })
          .on(VKID.WidgetEvents.ERROR, vkidOnError)
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, handleVKSuccess);
        containerLogin.dataset.rendered = '1';
      } catch (e) {
        console.warn('VK OneTap Login render error:', e);
      }
    }

    // Render OneTap for Register tab
    var containerSignup = document.getElementById('authVkContainerSignup');
    if (containerSignup && !containerSignup.dataset.rendered) {
      try {
        var oneTapSignup = new VKID.OneTap();
        oneTapSignup.render({
          container: containerSignup,
          showAlternativeLogin: true
        })
          .on(VKID.WidgetEvents.ERROR, vkidOnError)
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, handleVKSuccess);
        containerSignup.dataset.rendered = '1';
      } catch (e) {
        console.warn('VK OneTap Signup render error:', e);
      }
    }
  }

  /* ──────────────────────── SUBMIT LOADING ─────────────────────── */

  function setSubmitLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /* ──────────────────────── NAVBAR STATE ──────────────────────── */

  function updateNavbarState(user) {
    var loginBtns = document.querySelectorAll('[data-auth-action="login"]');
    var trialBtns = document.querySelectorAll('[data-auth-action="trial"]');

    if (user && isLoggedIn()) {
      // User is logged in — replace navbar buttons with user pill
      loginBtns.forEach(function (btn) {
        btn.style.display = 'none';
      });

      // Change "Попробовать бесплатно" buttons in navbar to show user name
      trialBtns.forEach(function (btn) {
        if (btn.closest('.navbar-actions') || btn.closest('.nav-mobile-actions')) {
          btn.textContent = '→ Платформа';
          btn.onclick = function () { window.location.href = '/app'; };
        }
      });
    }
  }

  /* ──────────────────────── LOGOUT ──────────────────────────────── */

  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    showNotification('Вы вышли из системы', 'success');
    
    // Restore navbar
    var loginBtns = document.querySelectorAll('[data-auth-action="login"]');
    loginBtns.forEach(function (btn) { btn.style.display = ''; });
    
    var trialBtns = document.querySelectorAll('[data-auth-action="trial"]');
    trialBtns.forEach(function (btn) {
      if (btn.closest('.navbar-actions') || btn.closest('.nav-mobile-actions')) {
        btn.textContent = 'Попробовать бесплатно';
        btn.onclick = function () { open('trial'); };
      }
    });
  }

  /* ──────────────────────── INIT ───────────────────────────────── */

  function init() {
    var backdrop = document.getElementById('authModalBackdrop');
    if (!backdrop) return;

    // Close on backdrop click
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });

    // Tab switching
    document.querySelectorAll('.auth-modal-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(this.getAttribute('data-tab'));
      });
    });

    // Form submissions
    var loginForm = document.getElementById('authLoginForm');
    var registerForm = document.getElementById('authRegisterForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Close button
    var closeBtn = backdrop.querySelector('.auth-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Google button
    document.querySelectorAll('.auth-modal-google-btn').forEach(function (btn) {
      btn.addEventListener('click', loginWithGoogle);
    });

    // Clear errors on input
    backdrop.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('input', function () { clearFieldError(this); });
    });

    // Wire up all trigger buttons across the page
    wireUpTriggers();

    // Load VK ID SDK
    initVkIdSdk();

    // Check if already logged in
    if (isLoggedIn()) {
      var user = getUser();
      if (user) updateNavbarState(user);
    }

    // Check for pending action from OAuth redirect
    var savedAction = sessionStorage.getItem('cj_pending_action');
    if (savedAction && isLoggedIn()) {
      sessionStorage.removeItem('cj_pending_action');
      pendingAction = savedAction;
      handlePostAuth();
    }
  }

  /* ──────────────────────── TRIGGER WIRING ─────────────────────── */

  function wireUpTriggers() {
    // All elements with data-auth-action will open the modal
    document.querySelectorAll('[data-auth-action]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var action = this.getAttribute('data-auth-action');
        open(action);
      });
    });
  }

  /* ──────────────────────── DOM READY ──────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ──────────────────────── PUBLIC API ─────────────────────────── */

  window.CJAuth = {
    open: open,
    close: close,
    isLoggedIn: isLoggedIn,
    getUser: getUser,
    logout: logout,
    showNotification: showNotification
  };

})();
