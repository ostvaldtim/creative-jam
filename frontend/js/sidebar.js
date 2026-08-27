/**
 * SIDEBAR MODULE
 * Логика переключения и управления сайдбаром
 * + Mobile: hamburger, backdrop, sliding drawer
 */

// Detect mobile
function isMobileLayout() {
    return window.matchMedia('(max-width: 767px)').matches;
}

// Переключить состояние сайдбара (ChatGPT-style)
function toggleSidebar() {
    const app = document.getElementById('app');
    const btn = document.getElementById('sidebarToggle');
    if (!app) return;

    const isExpanded = app.dataset.sidebar === 'expanded';
    const newState = isExpanded ? 'collapsed' : 'expanded';

    app.dataset.sidebar = newState;

    if (btn) {
        btn.setAttribute('aria-expanded', String(!isExpanded));
        btn.setAttribute('aria-label',
            isExpanded ? 'Развернуть боковую панель' : 'Свернуть боковую панель'
        );
    }

    // On mobile, toggle backdrop
    if (isMobileLayout()) {
        _toggleBackdrop(newState === 'expanded');
    }

    // Save preference (desktop only)
    if (!isMobileLayout()) {
        localStorage.setItem('sidebarCollapsed', newState === 'collapsed');
    }
}

// Show / hide backdrop
function _toggleBackdrop(show) {
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!backdrop) return;

    if (show) {
        backdrop.classList.add('visible');
        // Prevent body scroll while sidebar is open on mobile
        document.body.style.overflow = 'hidden';
    } else {
        backdrop.classList.remove('visible');
        document.body.style.overflow = '';
    }
}

// Close sidebar (mobile convenience)
function closeSidebar() {
    const app = document.getElementById('app');
    if (!app) return;
    app.dataset.sidebar = 'collapsed';
    _toggleBackdrop(false);
}

// Bind events
document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('sidebarToggle');
    if (btn) btn.addEventListener('click', toggleSidebar);

    // Mobile hamburger
    const hamburger = document.getElementById('mobileHamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function () {
            const app = document.getElementById('app');
            if (!app) return;
            app.dataset.sidebar = 'expanded';
            _toggleBackdrop(true);
        });
    }

    // Backdrop click → close
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeSidebar);
    }

    // Click on collapsed sidebar empty area → expand (desktop one-way only)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('click', function (e) {
            const app = document.getElementById('app');
            if (!app || app.dataset.sidebar !== 'collapsed') return;
            if (isMobileLayout()) return; // don't expand on mobile sidebar click

            // Ignore clicks on interactive elements
            if (e.target.closest('.sidebar-toggle, .new-btn, .user-btn, .menu-item, .user-menu, .project-item, a, button')) return;

            // Expand
            app.dataset.sidebar = 'expanded';
            const toggleBtn = document.getElementById('sidebarToggle');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.setAttribute('aria-label', 'Свернуть боковую панель');
            }
            localStorage.setItem('sidebarCollapsed', false);
        });
    }

    // On mobile, default to collapsed (sidebar hidden)
    if (isMobileLayout()) {
        const app = document.getElementById('app');
        if (app) {
            app.dataset.sidebar = 'collapsed';
        }
    }

    // On resize: if switching to desktop, restore sidebar; if to mobile, collapse
    let _prevMobile = isMobileLayout();
    window.addEventListener('resize', function () {
        const nowMobile = isMobileLayout();
        if (nowMobile === _prevMobile) return;
        _prevMobile = nowMobile;

        const app = document.getElementById('app');
        if (!app) return;

        if (nowMobile) {
            // Switching to mobile: collapse sidebar, hide backdrop
            app.dataset.sidebar = 'collapsed';
            _toggleBackdrop(false);
        } else {
            // Switching to desktop: restore from localStorage
            const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            app.dataset.sidebar = wasCollapsed ? 'collapsed' : 'expanded';
            _toggleBackdrop(false);
        }
    });
});
