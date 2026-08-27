/**
 * Glass Overlay Manager
 * Handles the unified full-screen overlay system for all menu items.
 */
const OverlayManager = {
    overlayId: 'glassOverlay',
    activeModule: null,

    /**
     * Open a specific module in the overlay
     * @param {string} moduleId - The ID suffix of the module to open (e.g., 'settings', 'billing')
     * @param {boolean} updateHash - Whether to update the URL hash (default true)
     */
    open(moduleId, updateHash = true) {
        const overlay = document.getElementById(this.overlayId);
        if (!overlay) {
            console.error('Glass Overlay container not found');
            return;
        }

        // Hide all modules
        document.querySelectorAll('.overlay-module').forEach(el => {
            el.style.display = 'none';
        });

        // Show requested module
        const moduleElement = document.getElementById(`overlayModule_${moduleId}`);
        if (moduleElement) {
            moduleElement.style.display = 'flex';
            this.activeModule = moduleId;

            // Enable scrolling for modules with long content
            if (moduleId === 'help' || moduleId === 'invites') {
                overlay.classList.add('scrollable');
            } else {
                overlay.classList.remove('scrollable');
            }

            // Update active state in dropdown menu
            document.querySelectorAll('.overlay-menu-item').forEach(item => {
                if (item.dataset.module === moduleId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Trigger specific init logic if needed
            if (moduleId === 'settings' && typeof openSettingsOverlay === 'function') {
                openSettingsOverlay(true);
            }

            // Update URL hash for persistence
            if (updateHash) {
                window.location.hash = moduleId;
            }
        } else {
            console.warn(`Module ${moduleId} not found, showing placeholder`);
            this.showPlaceholder(moduleId);
        }

        // Sync overlay trigger position to match sidebar avatar BEFORE showing overlay
        this.syncAvatarPosition();

        // Show main overlay
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // A11y: update aria-label based on module
        const moduleLabels = {
            settings: 'Настройки аккаунта',
            billing: 'Тарифы и оплата',
            invites: 'Партнёрская программа',
            orders: 'Управление заказами',
            help: 'Помощь',
            feedback: 'Сообщить об ошибке'
        };
        overlay.setAttribute('aria-label', moduleLabels[moduleId] || moduleId);

        // A11y: trap focus inside the overlay
        if (window.FocusTrap) {
            FocusTrap.activate(overlay);
        }

        // FORCE SYNC: Ensure theme toggles inside the overlay are synchronized with global state
        if (window.Theme && window.Theme.current) {
            window.Theme.apply(window.Theme.current);
        }

        // Sync avatar from settings to menu button
        this.syncAvatar();

        // Close user menu if open
        const menu = document.getElementById('userMenu');
        if (menu) menu.classList.remove('show');
    },

    /**
     * Sync overlay trigger position with sidebar avatar
     */
    _cachedAvatarPos: null,

    syncAvatarPosition() {
        const trigger = document.getElementById('overlayMenuTrigger');
        if (!trigger) return;

        // Try to read fresh position from sidebar avatar (only works if sidebar visible)
        const sidebarAvatar = document.getElementById('userAvatar');
        if (sidebarAvatar) {
            const rect = sidebarAvatar.getBoundingClientRect();
            // Only cache if the element is actually visible (non-zero dimensions)
            if (rect.width > 0 && rect.height > 0) {
                this._cachedAvatarPos = {
                    left: rect.left,
                    bottom: window.innerHeight - rect.bottom
                };
            }
        }

        // Apply cached position
        if (this._cachedAvatarPos) {
            trigger.style.left = this._cachedAvatarPos.left + 'px';
            trigger.style.bottom = this._cachedAvatarPos.bottom + 'px';
        }
    },

    /**
     * Sync avatar from settings to overlay menu
     */
    syncAvatar() {
        const menuAvatar = document.getElementById('overlayMenuAvatar');
        const sidebarAvatar = document.getElementById('userAvatar');
        if (!menuAvatar) return;

        // Try to get avatar from user data (reliable source)
        let avatarUrl = null;
        if (window.Storage) {
            const user = Storage.getUser();
            if (user && user.avatar) {
                avatarUrl = user.avatar;
            }
        }

        // Fallback: try overlay settings element
        if (!avatarUrl) {
            const settingsAvatar = document.getElementById('overlayAvatar');
            if (settingsAvatar) {
                const bg = settingsAvatar.style.backgroundImage;
                if (bg && bg !== 'none' && bg !== '') {
                    avatarUrl = bg;
                }
            }
        }

        // Fallback: try sidebar avatar
        if (!avatarUrl && sidebarAvatar) {
            const bg = sidebarAvatar.style.backgroundImage;
            if (bg && bg !== 'none' && bg !== '') {
                avatarUrl = bg;
            }
        }

        if (avatarUrl) {
            // If it's a raw url (not wrapped in url()), wrap it
            const bgValue = avatarUrl.startsWith('url(') ? avatarUrl : `url(${avatarUrl})`;
            menuAvatar.style.backgroundImage = bgValue;
            menuAvatar.textContent = '';
        } else {
            // Show initials
            let initials = 'P';
            if (window.Storage) {
                const user = Storage.getUser();
                if (user && user.name) {
                    initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                }
            }
            menuAvatar.textContent = initials;
        }
    },

    /**
     * Close the overlay
     */
    close() {
        const overlay = document.getElementById(this.overlayId);
        if (overlay) {
            overlay.classList.remove('show');
            overlay.classList.remove('scrollable'); // Remove scrollable class on close
        }
        document.body.style.overflow = '';
        this.activeModule = null;

        // A11y: release focus trap
        if (window.FocusTrap) {
            FocusTrap.deactivate();
        }

        // Clear hash from URL without scrolling
        if (window.location.hash) {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    },

    /**
     * Show a generic placeholder for missing modules
     */
    showPlaceholder(title) {
        showNotification(`Модуль «${title}» в разработке`, 'info');
        this.close();
    },

    /**
     * Initialize sidebar navigation click handlers
     */
    initNavigation() {
        const menuTrigger = document.getElementById('overlayMenuTrigger');
        const dropdown = document.getElementById('overlayDropdownMenu');

        if (!menuTrigger || !dropdown) return;

        // Toggle dropdown on button click
        menuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== menuTrigger) {
                dropdown.classList.remove('show');
            }
        });

        // Handle module switching
        dropdown.querySelectorAll('.overlay-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const moduleId = item.dataset.module;
                if (moduleId && moduleId !== this.activeModule) {
                    this.open(moduleId, true);
                    dropdown.classList.remove('show');
                }
            });
        });

        // Theme toggle sync is handled globally by Theme.apply() in theme.js
    },

    /**
     * Initialize event listeners
     */
    init() {
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModule) {
                this.close();
            }
        });

        // Initialize navigation handlers
        this.initNavigation();

        // Expose to window for inline onclicks
        window.OverlayManager = this;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    OverlayManager.init();
});
