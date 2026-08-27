/**
 * APP MODULE
 * Главная логика приложения — инициализация, состояние, утилиты UI
 */

// Состояние приложения
const AppState = {
    currentProject: null,
    briefMode: 'full', // 'full' or 'short'
    isGenerating: false
};

// ═══════════════════════════════════════════
// MAINTENANCE BANNER CONFIG
// Поставь true, чтобы показать баннер с уведомлением о техработах.
// ═══════════════════════════════════════════
const MAINTENANCE_ENABLED = false;

function initMaintenanceBanner() {
    if (!MAINTENANCE_ENABLED) return;
    if (sessionStorage.getItem('maintenanceDismissed')) return;
    const banner = document.getElementById('maintenanceBanner');
    if (banner) {
        banner.style.display = 'block';
        document.body.classList.add('has-maintenance-banner');
    }
}

function dismissMaintenanceBanner() {
    const banner = document.getElementById('maintenanceBanner');
    if (banner) {
        banner.style.animation = 'bannerSlideDown 0.3s ease reverse';
        setTimeout(() => { banner.style.display = 'none'; }, 300);
    }
    document.body.classList.remove('has-maintenance-banner');
    sessionStorage.setItem('maintenanceDismissed', 'true');
}



// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    initApp();
});

// Инициализация приложения
function initApp() {
    // Баннер техработ
    initMaintenanceBanner();

    // Инициализация темы
    Theme.init();

    // Проверка авторизации
    const user = Storage.getUser();

    // DEV MODE: Skip auth for local testing
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Показать body после проверки
    document.body.classList.add('loaded');

    if (!user && !isDev) {
        // Redirect to landing page for authentication
        window.location.href = '/';
        return;
    }

    // В dev режиме создаем временного пользователя
    if (isDev && !user) {
        const devUser = {
            id: 'dev-user',
            email: 'dev@localhost',
            name: 'Developer',
            avatar: null
        };
        Storage.setUser(devUser);
    }

    // Загрузить данные из localStorage
    loadUserData();
    loadProjects();

    // ВАЖНО: Загрузить свежий аватар с сервера
    if (typeof loadUserAvatar === 'function') {
        loadUserAvatar();
    }

    // Восстановить состояние сайдбара
    // На мобильных всегда начинаем со скрытым сайдбаром
    const isMobile = typeof isMobileLayout === 'function' ? isMobileLayout() : window.matchMedia('(max-width: 767px)').matches;
    const sidebarCollapsed = isMobile ? true : localStorage.getItem('sidebarCollapsed') === 'true';
    const app = document.getElementById('app');
    if (app) {
        app.dataset.sidebar = sidebarCollapsed ? 'collapsed' : 'expanded';
        const btn = document.getElementById('sidebarToggle');
        if (btn) {
            btn.setAttribute('aria-expanded', String(!sidebarCollapsed));
            btn.setAttribute('aria-label',
                sidebarCollapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'
            );
        }
    }

    // Обработка роутинга при загрузке
    handleRouting();

    // Слушатель изменения хеша
    window.addEventListener('hashchange', handleRouting);

    // Обработчик клика вне меню — закрыть userMenu
    document.addEventListener('click', function (e) {
        const menu = document.getElementById('userMenu');
        if (!menu || !menu.classList.contains('show')) return;

        // Не закрывать если клик внутри меню или на кнопке пользователя
        if (menu.contains(e.target)) return;
        if (e.target.closest('.user-btn')) return;

        menu.classList.remove('show');
    });

    // Настроить live-анализ брифа (если функция доступна)
    if (typeof setupLiveBriefAnalysis === 'function') {
        setupLiveBriefAnalysis();
    }

    // Авторасширение textarea
    setupAutoResizeTextarea();
}

/**
 * Авторасширение textarea: 
 * - минимум 5 строк
 * - растёт до 7 строк без скролла
 * - скролл появляется только при >7 строках
 */
function setupAutoResizeTextarea() {
    const textarea = document.getElementById('taskInput');
    if (!textarea) return;

    // Убираем предыдущий listener (на случай повторного вызова)
    textarea.removeEventListener('input', autoResizeHandler);
    textarea.addEventListener('input', autoResizeHandler);

    // Применить начальный размер
    autoResizeHandler.call(textarea);
}

function autoResizeHandler() {
    const textarea = this.tagName ? this : document.getElementById('taskInput');
    if (!textarea) return;

    // Сбрасываем высоту чтобы получить точный scrollHeight
    textarea.style.height = 'auto';

    const maxHeight = 260; // ~10 строк
    const scrollH = textarea.scrollHeight;

    if (scrollH > maxHeight) {
        // Больше 10 строк — фиксируем высоту и показываем скролл
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto';
    } else {
        // До 10 строк — расширяем без скролла
        textarea.style.height = scrollH + 'px';
        textarea.style.overflowY = 'hidden';
    }
}

// Показать модальное окно настройки
function showSetup() {
    document.getElementById('setupModal').classList.add('show');
}

// Закрыть модальное окно настройки
function closeSetup() {
    document.getElementById('setupModal').classList.remove('show');

    // If no user, redirect to landing
    if (!Storage.getUser()) {
        window.location.href = '/';
    }
}

// Custom Confirm Modal
function showConfirm(message, title = 'Подтверждение', isDanger = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const okBtn = document.getElementById('confirmOkBtn');

        if (!modal) {
            // Fallback if modal DOM is missing
            resolve(confirm(message));
            return;
        }

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Reset classes
        const modalContent = modal.querySelector('.custom-modal');
        modalContent.classList.remove('danger');
        okBtn.classList.remove('danger');

        if (isDanger) {
            modalContent.classList.add('danger');
            okBtn.classList.add('danger');
        }

        const close = (result) => {
            modal.classList.remove('show');
            // Clean up event listeners to avoid leaks/duplicates
            cancelBtn.onclick = null;
            okBtn.onclick = null;
            // A11y: release focus trap
            if (window.FocusTrap) FocusTrap.deactivate();
            resolve(result);
        };

        cancelBtn.onclick = () => close(false);
        okBtn.onclick = () => close(true);

        modal.classList.add('show');

        // A11y: trap focus inside the modal
        if (window.FocusTrap) {
            FocusTrap.activate(modal);
        }
    });
}

// Сохранить настройки
function saveSetup() {
    const userNameInput = document.getElementById('userName');
    const openrouterKeyInput = document.getElementById('openrouterKey');
    const userPlan = document.getElementById('userPlan').value;

    const userName = userNameInput.value.trim();
    const openrouterKey = openrouterKeyInput.value.trim();

    if (!userName) {
        userNameInput.style.borderColor = 'var(--error)';
        userNameInput.focus();
        setTimeout(() => userNameInput.style.borderColor = '', 2000);
        return;
    }

    if (!openrouterKey) {
        openrouterKeyInput.style.borderColor = 'var(--error)';
        openrouterKeyInput.focus();
        setTimeout(() => openrouterKeyInput.style.borderColor = '', 2000);
        return;
    }

    // Сохранить данные пользователя
    const user = {
        name: userName,
        plan: userPlan,
        avatar: userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    };
    Storage.setUser(user);

    // Сохранить API ключи
    Storage.setApiKeys({
        openrouter: openrouterKey
    });

    // Закрыть модальное окно
    document.getElementById('setupModal').classList.remove('show');

    // Загрузить данные
    loadUserData();
    loadProjects();
}

// Загрузить данные пользователя
function loadUserData() {
    const user = Storage.getUser();

    if (!user) return;

    // Обновить UI
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = user.name || 'Артём Оствальд';

    const planEl = document.getElementById('userPlan');
    if (planEl) {
        planEl.textContent = (user.plan || 'TRIAL').toUpperCase();
    }

    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        if (user.avatar && user.avatar.startsWith('data:image')) {
            avatarEl.style.backgroundImage = `url(${user.avatar})`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.textContent = '';
        } else {
            avatarEl.style.backgroundImage = '';
            avatarEl.textContent = (user.name || 'Артём Оствальд').charAt(0).toUpperCase();
        }
    }

    const badgeEl = document.getElementById('userPlanBadge');
    if (badgeEl) badgeEl.textContent = (user.plan || 'TRIAL').toUpperCase();

    // Загрузить usage
    const usage = Storage.getUsage();
    updateUsageDisplay(usage);

    // PATCH (правка 42): кэш показан сразу, но истина — с сервера
    if (typeof Storage.syncUsage === 'function') {
        Storage.syncUsage().then(fresh => {
            if (fresh) updateUsageDisplay(fresh);
        });
    }
}

// Обновить отображение usage
function updateUsageDisplay(usage) {
    // PATCH (правка 42): защита от деления на ноль, пока серверный лимит ещё не пришёл
    const total = Number(usage?.total || 0);
    const used = Number(usage?.used || 0);
    const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    const fillEl = document.getElementById('usageFill');
    const textEl = document.getElementById('usageText');
    if (fillEl) fillEl.style.width = `${percentage}%`;
    if (textEl) {
        textEl.textContent = total > 0
            ? `${used} из ${total} джемов использовано`
            : 'Счётчик запусков загружается…';
    }
}

// Переключить меню пользователя
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('show');
}

// Выбрать тип контента (toggle)
function selectChip(element) {
    const isAlreadyActive = element.classList.contains('active');

    // Сбросить все
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.remove('active');
    });

    if (isAlreadyActive) {
        // Если был активен — снимаем выделение
        AppState.selectedType = null;
    } else {
        // Иначе — активируем этот
        element.classList.add('active');
        AppState.selectedType = element.getAttribute('data-type');
    }
}

// Раскрыть дополнительные опции
function toggleExpand(button) {
    button.classList.toggle('open');
    document.getElementById('expandContent').classList.toggle('show');
}

// Выбрать опцию
function selectOpt(element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.q-opt').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
}

// Выбор тона общения (toggle)
function selectTone(el) {
    const isAlreadySelected = el.classList.contains('selected');

    document.querySelectorAll('.tone-chip').forEach(chip => chip.classList.remove('selected'));

    if (!isAlreadySelected) {
        el.classList.add('selected');
    }
}

// Показать модальное окно с pricing.html
function showPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Закрыть модальное окно pricing
function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Выйти
async function logout() {
    if (await showConfirm('Вы уверены, что хотите выйти?', 'Выход', false)) {
        try {
            // Очистить сессию на backend
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Очистить локальное хранилище
        Storage.clear();

        // Redirect to landing page
        window.location.href = '/';
    }
}

// Пригласить друзей
function inviteFriends() {
    document.getElementById('userMenu').classList.remove('show');
    showNotification('Функция "Партнерская программа" скоро будет доступна', 'info');
}

// Управление заказами
function showOrders() {
    document.getElementById('userMenu').classList.remove('show');
    showNotification('Функция "Управление заказами" в разработке', 'info');
}

// Сообщить об ошибке
function reportBug() {
    document.getElementById('userMenu').classList.remove('show');
    const message = prompt('Опишите проблему:');
    if (message && message.trim()) {
        showNotification('Сообщение отправлено', 'success');
        console.log('Bug report:', message);
        // TODO: отправить на backend
    }
}
