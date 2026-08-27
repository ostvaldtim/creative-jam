/* ══════════════════════════════════════════════════
   Partner Program Module
   ══════════════════════════════════════════════════ */

const PartnerProgram = {

    // ── Состояние ──────────────────────────────
    // Никаких придуманных цифр: пока нет серверного учёта переходов и регистраций,
    // блоки со статистикой и списком приглашений просто не показываются.
    _refLink: '',

    // ── Init ───────────────────────────────────────
    init() {
        const root = document.getElementById('ppRoot') || document;

        let refCode = null;
        try {
            const user = typeof Storage !== 'undefined' && Storage.getUser ? Storage.getUser() : null;
            if (user && (user.id || user.email)) refCode = String(user.id || user.email);
        } catch (_) { }

        const origin = (window.location && window.location.origin) || '';
        this._refLink = refCode
            ? `${origin}/register.html?ref=${encodeURIComponent(refCode)}`
            : '';

        const linkInput = document.getElementById('ppRefLink');
        if (linkInput) {
            if (this._refLink) {
                linkInput.value = this._refLink;
                linkInput.disabled = false;
            } else {
                linkInput.value = '';
                linkInput.placeholder = 'Войдите в аккаунт, чтобы получить личную ссылку';
                linkInput.disabled = true;
            }
        }

        this._hideUnbackedBlocks();
    },

    // ── Прячем то, за чем нет реальных данных ────
    _hideUnbackedBlocks() {
        ['ppStatsBlock', 'ppInvitesList', 'ppProgressBlock', 'ppEmptyState'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    },

    // ── Copy link ──────────────────────────────────
    copyLink() {
        const input = document.getElementById('ppRefLink');
        if (!input) return;

        navigator.clipboard.writeText(input.value).then(() => {
            PartnerProgram.showToast('Ссылка скопирована!', 'success');
            const btn = document.getElementById('ppCopyBtn');
            if (btn) {
                const orig = btn.innerHTML;
                btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Скопировано!`;
                btn.classList.add('pp-btn--success');
                setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('pp-btn--success'); }, 1500);
            }
        }).catch(() => {
            PartnerProgram.showToast('Не удалось скопировать', 'error');
        });
    },

    // ── Share via channel ──────────────────────────
    shareVia(channel) {
        if (!this._refLink) {
            PartnerProgram.showToast('Войдите в аккаунт — тогда появится личная ссылка', 'warning');
            return;
        }
        const link = this._refLink;
        const text = encodeURIComponent('Попробуй Creative Jam — AI-продюсер для маркетинга: ' + link);
        let url = '';

        switch (channel) {
            case 'telegram':
                url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Попробуй Creative Jam — AI-продюсер для маркетинга')}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${text}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent('Приглашение в Creative Jam')}&body=${text}`;
                break;
        }

        if (url) window.open(url, '_blank');
    },

    // ── Приглашение по email ────────────────────
    // Серверной рассылки пока нет, поэтому открываем почтовый клиент пользователя
    // с готовым письмом. Никаких сообщений "отправлено", которые не соответствуют правде.
    sendInvite() {
        const input = document.getElementById('ppInviteEmail');
        const hint = document.getElementById('ppEmailHint');
        if (!input) return;

        if (!this._refLink) {
            PartnerProgram.showToast('Войдите в аккаунт — тогда появится личная ссылка', 'warning');
            return;
        }

        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            input.classList.add('pp-input--error');
            if (hint) { hint.textContent = 'Введите корректный email'; hint.className = 'pp-hint pp-hint--error'; }
            PartnerProgram.showToast('Введите корректный email', 'error');
            return;
        }

        input.classList.remove('pp-input--error');
        if (hint) { hint.textContent = 'Письмо откроется в вашей почте — останется нажать «Отправить»'; hint.className = 'pp-hint'; }

        const subject = encodeURIComponent('Приглашение в Creative Jam');
        const body = encodeURIComponent(
            'Привет!\n\nПопробуй Creative Jam — AI-продюсер для маркетинга:\n' + this._refLink + '\n'
        );
        window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;

        input.value = '';
        PartnerProgram.showToast('Письмо подготовлено в вашей почте', 'info');
    },

    // ── Toast ──────────────────────────────────────
    showToast(message, type = 'info') {
        let container = document.getElementById('ppToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ppToastContainer';
            container.className = 'pp-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `pp-toast pp-toast--${type}`;

        const icons = {
            success: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
            error: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M15 9l-6 6M9 9l6 6"/></svg>',
            warning: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M12 2L2 20h20L12 2z"/></svg>',
            info: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 16v-4m0-4h.01"/></svg>'
        };

        toast.innerHTML = `
            <span class="pp-toast__icon">${icons[type] || icons.info}</span>
            <span class="pp-toast__msg">${this._escHtml(message)}</span>`;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('pp-toast--visible'));

        setTimeout(() => {
            toast.classList.remove('pp-toast--visible');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    },

    // ── Rules Modal ────────────────────────────────
    openRules() {
        const modal = document.getElementById('ppRulesModal');
        if (modal) {
            modal.classList.add('pp-modal--open');
            modal.setAttribute('aria-hidden', 'false');
        }
    },

    closeRules() {
        const modal = document.getElementById('ppRulesModal');
        if (modal) {
            modal.classList.remove('pp-modal--open');
            modal.setAttribute('aria-hidden', 'true');
        }
    },

    // ── FAQ Accordion ──────────────────────────────
    toggleFaq(idx) {
        const item = document.querySelector(`.pp-faq-item[data-idx="${idx}"]`);
        if (!item) return;
        const isOpen = item.classList.contains('pp-faq-item--open');

        // Close all
        document.querySelectorAll('.pp-faq-item--open').forEach(el => el.classList.remove('pp-faq-item--open'));

        // Toggle current
        if (!isOpen) item.classList.add('pp-faq-item--open');
    },

    // ── Helpers ────────────────────────────────────
    _escHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
};

// ── Bootstrap ──────────────────────────────────────
// ═══════════════════════════════════════════════════
// AFFILIATE_UI_DISABLED (03.08.2026, решение владельца)
// Партнёрская программа скрыта: пока нет серверного учёта переходов,
// регистраций и выплат обещать пользователям бонусы нельзя.
// Обратно включается одной строкой в любом скрипте до invites.js:
//     window.CRJ_FEATURES = { affiliate: true };
// Код и вёрстка не удалены — возврат не требует правки кода.
// ═══════════════════════════════════════════════════
function isAffiliateUiEnabled() {
    return !!(window.CRJ_FEATURES && window.CRJ_FEATURES.affiliate === true);
}

function hideAffiliateUi() {
    // 1. пункты меню (боковое и верхнее)
    document.querySelectorAll('[data-module="invites"]').forEach(function (el) { el.style.display = 'none'; });
    document.querySelectorAll('.menu-item').forEach(function (el) {
        var handler = el.getAttribute('onclick') || '';
        if (handler.indexOf("'invites'") !== -1) el.style.display = 'none';
    });

    // 2. сама панель
    var moduleEl = document.getElementById('overlayModule_invites');
    if (moduleEl) moduleEl.style.display = 'none';

    // 3. прямой вход по ссылке #invites и вызов из кода
    if (window.OverlayManager && typeof window.OverlayManager.open === 'function'
        && !window.OverlayManager.__affiliateGuard) {
        var originalOpen = window.OverlayManager.open.bind(window.OverlayManager);
        window.OverlayManager.open = function (moduleId) {
            if (moduleId === 'invites') {
                console.info('[партнёрская программа] раздел временно отключён');
                return;
            }
            return originalOpen.apply(null, arguments);
        };
        window.OverlayManager.__affiliateGuard = true;
    }
    if (window.location && window.location.hash === '#invites') {
        try { window.location.hash = ''; } catch (_) { }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // чистим наследие витринной версии
    try { localStorage.removeItem('pp_invites'); } catch (_) { }
    if (!isAffiliateUiEnabled()) {
        hideAffiliateUi();
        // OverlayManager может инициализироваться позже — повторяем после его загрузки
        setTimeout(hideAffiliateUi, 0);
        setTimeout(hideAffiliateUi, 500);
        return;
    }

    PartnerProgram.init();
});

// ── Globals for HTML onclick ───────────────────────
window.copyInviteLink = () => PartnerProgram.copyLink();
window.sendInvite = () => PartnerProgram.sendInvite();
window.ppShareVia = (ch) => PartnerProgram.shareVia(ch);
window.ppOpenRules = () => PartnerProgram.openRules();
window.ppCloseRules = () => PartnerProgram.closeRules();
window.ppToggleFaq = (i) => PartnerProgram.toggleFaq(i);
