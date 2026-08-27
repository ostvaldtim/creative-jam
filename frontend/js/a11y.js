/**
 * A11Y MODULE
 * Accessibility utilities: focus trap, keyboard navigation, Escape handling
 */

// ════════════════════════════════════════════
// FOCUS TRAP — keeps Tab cycling inside a container
// ════════════════════════════════════════════

const FocusTrap = {
    _previouslyFocused: null,
    _handler: null,
    _activeContainer: null,

    /**
     * Trap Tab/Shift+Tab focus within the given container.
     * Saves the currently focused element so it can be restored later.
     */
    activate(container) {
        if (!container) return;

        // Save the element that had focus before the trap
        this._previouslyFocused = document.activeElement;
        this._activeContainer = container;

        // Find all focusable elements
        const focusables = this._getFocusables(container);
        if (focusables.length === 0) return;

        // Focus the first focusable element
        focusables[0].focus();

        // Create the keydown handler
        this._handler = (e) => {
            if (e.key !== 'Tab') return;

            const currentFocusables = this._getFocusables(container);
            if (currentFocusables.length === 0) return;

            const first = currentFocusables[0];
            const last = currentFocusables[currentFocusables.length - 1];

            if (e.shiftKey) {
                // Shift+Tab: if on first element, wrap to last
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                // Tab: if on last element, wrap to first
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', this._handler);
    },

    /**
     * Release the focus trap and restore focus to the previously focused element.
     */
    deactivate() {
        if (this._handler) {
            document.removeEventListener('keydown', this._handler);
            this._handler = null;
        }

        // Restore focus
        if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
            this._previouslyFocused.focus();
        }

        this._previouslyFocused = null;
        this._activeContainer = null;
    },

    /**
     * Get all focusable elements within a container.
     */
    _getFocusables(container) {
        const selector = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');

        return Array.from(container.querySelectorAll(selector)).filter(el => {
            // Exclude hidden elements
            return el.offsetParent !== null || el.style.position === 'fixed';
        });
    }
};

// ════════════════════════════════════════════
// GLOBAL ESCAPE KEY — closes any visible modal
// ════════════════════════════════════════════

document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    // 1. Confirm modal
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal && confirmModal.classList.contains('show')) {
        const cancelBtn = document.getElementById('confirmCancelBtn');
        if (cancelBtn) cancelBtn.click();
        return;
    }

    // 2. PP Rules modal
    const ppModal = document.getElementById('ppRulesModal');
    if (ppModal && ppModal.classList.contains('pp-modal--open')) {
        if (typeof ppCloseRules === 'function') ppCloseRules();
        return;
    }

    // 3. Pricing modal
    const pricingModal = document.getElementById('pricingModal');
    if (pricingModal && pricingModal.classList.contains('show')) {
        if (typeof closePricingModal === 'function') closePricingModal();
        return;
    }

    // Note: Glass overlay Escape is handled by overlay-manager.js
});

// Expose globally
window.FocusTrap = FocusTrap;
