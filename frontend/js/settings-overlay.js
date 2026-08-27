/**
 * Settings Overlay Logic
 * Full-page account settings management
 */

// Open settings overlay
function openSettingsOverlay(fromManager = false) {
    // If not called by OverlayManager, delegate to it
    if (!fromManager && window.OverlayManager) {
        window.OverlayManager.open('settings');
        return;
    }

    const user = Storage.getUser();

    if (user) {
        // Update overlay data
        const nameEl = document.getElementById('overlayName');
        const emailEl = document.getElementById('overlayEmail');
        const authMethodEl = document.getElementById('overlayAuthMethod');

        if (nameEl) nameEl.textContent = user.name || 'User';
        if (emailEl) emailEl.textContent = user.email || 'user@example.com';
        if (authMethodEl) authMethodEl.textContent = user.authMethod || 'Email';

        // Avatar logic: Prioritize local data to avoid flicker
        const avatarEl = document.getElementById('overlayAvatar');
        if (avatarEl) {
            if (user.avatar) {
                // Instant load from localStorage
                avatarEl.style.backgroundImage = `url(${user.avatar})`;
                avatarEl.textContent = '';
            } else {
                // Fallback to initials
                const initials = (user.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                avatarEl.textContent = initials;
                avatarEl.style.backgroundImage = '';
            }
        }
    }

    // PATCH (правка 4): тянем статус оплаты с сервера при каждом открытии профиля
    loadPlanStatus();

    // Ensure Profile tab is active and Danger Zone handles are set
    switchOverlayTab('Profile');
}

// ============================================================
// PATCH (правка 4): в профиле не было ни тарифа, ни срока оплаты,
// ни остатка запусков — хотя на сервере эти данные были.
// ============================================================
const PLAN_TITLES = {
    trial: 'Пробный',
    start: 'START',
    pro: 'PRO'
};

async function loadPlanStatus(forceNotify = false) {
    const planEl = document.getElementById('overlayPlan');
    const usageEl = document.getElementById('overlayUsage');
    if (!planEl && !usageEl) return null;

    const token = localStorage.getItem('authToken');
    if (!token) {
        if (planEl) planEl.textContent = 'Нужен вход в аккаунт';
        if (usageEl) usageEl.textContent = '—';
        return null;
    }

    if (planEl) planEl.textContent = 'Загружаем…';
    if (usageEl) usageEl.textContent = 'Загружаем…';

    try {
        const response = await fetch('/api/user/usage', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const billing = data.billing || {};
        const planKey = String(billing.plan || data.plan || 'trial').toLowerCase();
        const planTitle = PLAN_TITLES[planKey] || planKey.toUpperCase();

        if (planEl) {
            if (billing.isPaid && billing.expiresAt) {
                const until = new Date(billing.expiresAt).toLocaleDateString('ru-RU');
                planEl.textContent = `${planTitle} — оплачен до ${until}`;
            } else if (billing.isExpired) {
                planEl.textContent = `${planTitle} — срок оплаты истёк`;
            } else if (billing.isPaid) {
                planEl.textContent = `${planTitle} — оплачен`;
            } else {
                planEl.textContent = `${planTitle} — без оплаты`;
            }
        }

        if (usageEl) {
            const limit = Number(billing.limit || 0);
            const used = Number(billing.used || 0);
            usageEl.textContent = limit > 0
                ? `${Math.max(0, limit - used)} из ${limit}`
                : 'Лимит не задан';
        }

        // Сразу подтягиваем ту же правду в шапку и в меню, чтобы цифры не расходились
        if (typeof updateUsageDisplay === 'function' && billing.limit) {
            updateUsageDisplay({ used: Number(billing.used || 0), total: Number(billing.limit) });
        }

        return billing;
    } catch (error) {
        console.warn('[Профиль] Не удалось загрузить статус тарифа:', error.message);
        if (planEl) planEl.textContent = 'Не удалось загрузить';
        if (usageEl) usageEl.textContent = 'Не удалось загрузить';
        if (forceNotify && typeof showToast === 'function') {
            showToast('Не удалось обновить статус тарифа', 'error');
        }
        return null;
    }
}

window.loadPlanStatus = loadPlanStatus;

// Close settings overlay
function closeSettingsOverlay() {
    if (window.OverlayManager) {
        window.OverlayManager.close();
    }
}

// Switch overlay tabs
function switchOverlayTab(tab) {
    const tabs = ['Profile', 'Security', 'Notifications', 'ApiKeys'];
    tabs.forEach(t => {
        const tabBtn = document.getElementById(`tab${t}`);
        const section = document.getElementById(`overlay${t}Section`);
        if (t.toLowerCase() === tab.toLowerCase()) {
            if (tabBtn) tabBtn.classList.add('active');
            if (section) section.style.display = 'flex';
        } else {
            if (tabBtn) tabBtn.classList.remove('active');
            if (section) section.style.display = 'none';
        }
    });

    // Show danger zone only on Profile tab
    const dangerZone = document.getElementById('dangerZoneSection');
    if (dangerZone) {
        dangerZone.style.display = (tab.toLowerCase() === 'profile') ? 'flex' : 'none';
    }
}

// SVG icons for inline edit actions
const ICON_CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_CLOSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

// Edit profile — inline editing
async function editProfile(field) {
    const displayField = field.charAt(0).toUpperCase() + field.slice(1);
    const valueEl = document.getElementById(`overlay${displayField}`);
    if (!valueEl) return;

    // Prevent double-editing
    if (valueEl.dataset.editing === 'true') return;
    valueEl.dataset.editing = 'true';

    const currentValue = valueEl.textContent;
    const row = valueEl.closest('.glass-row');
    const editBtn = row ? row.querySelector('.glass-action-btn') : null;

    // Replace text with inline input
    const input = document.createElement('input');
    input.type = field === 'email' ? 'email' : 'text';
    input.value = currentValue;
    input.className = 'glass-input glass-inline-edit';

    valueEl.style.display = 'none';
    valueEl.parentNode.insertBefore(input, valueEl.nextSibling);
    input.focus();
    input.select();

    // Replace button with icon pair: ✓ and ✕
    let saveBtn, cancelBtn, btnWrap;
    if (editBtn) {
        editBtn.style.display = 'none';
        btnWrap = document.createElement('div');
        btnWrap.className = 'glass-inline-actions';

        saveBtn = document.createElement('button');
        saveBtn.className = 'glass-icon-btn glass-icon-btn--save';
        saveBtn.innerHTML = ICON_CHECK;
        saveBtn.title = 'Сохранить (Enter)';

        cancelBtn = document.createElement('button');
        cancelBtn.className = 'glass-icon-btn glass-icon-btn--cancel';
        cancelBtn.innerHTML = ICON_CLOSE;
        cancelBtn.title = 'Отмена (Esc)';

        btnWrap.appendChild(saveBtn);
        btnWrap.appendChild(cancelBtn);
        editBtn.parentNode.insertBefore(btnWrap, editBtn.nextSibling);
    }

    // Restore original state
    function restore() {
        valueEl.style.display = '';
        valueEl.dataset.editing = '';
        input.remove();
        if (btnWrap) btnWrap.remove();
        if (editBtn) editBtn.style.display = '';
    }

    // Save handler
    async function save() {
        const newValue = input.value.trim();
        if (!newValue || newValue === currentValue) {
            restore();
            return;
        }

        // Show saving state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        }
        input.disabled = true;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                showNotification('Не авторизован', 'error');
                restore();
                return;
            }

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ [field]: newValue })
            });

            const data = await response.json();

            if (response.ok && data.user) {
                const updatedUser = data.user;
                valueEl.textContent = updatedUser[field];

                if (field === 'name') {
                    const avatarEl = document.getElementById('overlayAvatar');
                    if (!localStorage.getItem('userAvatar') && avatarEl) {
                        const initials = updatedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        avatarEl.textContent = initials;
                    }
                }

                Storage.setUser(updatedUser);
                if (typeof updateUserDisplay === 'function') {
                    updateUserDisplay(updatedUser);
                }

                showNotification('Профиль успешно обновлен', 'success');
            } else {
                showNotification(data.error || 'Ошибка обновления', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showNotification('Ошибка обновления', 'error');
        }

        restore();
    }

    // Bind events
    if (saveBtn) saveBtn.addEventListener('click', save);
    if (cancelBtn) cancelBtn.addEventListener('click', restore);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') restore();
    });
}

// Reset password — inline form
async function resetPassword() {
    const user = Storage.getUser();
    if (user && user.authMethod !== 'Email') {
        showNotification('Сброс пароля доступен только для Email аккаунтов', 'info');
        return;
    }

    // Find the password row
    const rows = document.querySelectorAll('#overlayProfileSection .glass-row');
    let passwordRow = null;
    rows.forEach(r => {
        const label = r.querySelector('.glass-label');
        if (label && label.textContent.includes('пароль')) passwordRow = r;
    });
    if (!passwordRow) return;

    // Prevent double-opening
    if (passwordRow.dataset.editing === 'true') return;
    passwordRow.dataset.editing = 'true';

    const editBtn = passwordRow.querySelector('.glass-action-btn');
    if (editBtn) editBtn.style.display = 'none';

    // Create inline form
    const form = document.createElement('div');
    form.className = 'glass-pw-form';
    form.style.cssText = 'padding:12px 20px 16px; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:12px;';

    const fields = [
        { id: 'pwOld', label: 'Текущий пароль', placeholder: 'Введите текущий пароль' },
        { id: 'pwNew', label: 'Новый пароль', placeholder: 'Минимум 6 символов' },
        { id: 'pwConfirm', label: 'Подтвердите пароль', placeholder: 'Повторите новый пароль' },
    ];

    fields.forEach(f => {
        const group = document.createElement('div');
        group.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
        const lbl = document.createElement('label');
        lbl.textContent = f.label;
        lbl.style.cssText = 'font-size:12px; font-weight:600; color:var(--text-2); text-transform:uppercase; letter-spacing:0.5px;';
        const inp = document.createElement('input');
        inp.type = 'password';
        inp.id = f.id;
        inp.placeholder = f.placeholder;
        inp.className = 'glass-input';
        inp.style.cssText = 'padding:10px 14px; font-size:14px;';
        group.appendChild(lbl);
        group.appendChild(inp);
        form.appendChild(group);
    });

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:8px; justify-content:flex-end; margin-top:4px;';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'glass-btn-primary';
    saveBtn.textContent = 'Сохранить';
    saveBtn.style.cssText = 'padding:8px 18px; font-size:13px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'glass-action-btn';
    cancelBtn.textContent = 'Отмена';
    cancelBtn.style.cssText = 'padding:8px 18px; font-size:13px;';

    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    form.appendChild(btnRow);

    passwordRow.after(form);

    // Focus first field
    form.querySelector('#pwOld').focus();

    function restore() {
        form.remove();
        passwordRow.dataset.editing = '';
        if (editBtn) editBtn.style.display = '';
    }

    async function save() {
        const oldPassword = form.querySelector('#pwOld').value;
        const newPassword = form.querySelector('#pwNew').value;
        const confirmPassword = form.querySelector('#pwConfirm').value;

        if (!oldPassword) {
            showNotification('Введите текущий пароль', 'error');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            showNotification('Пароль слишком короткий (минимум 6 символов)', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Сохраняю...';

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Пароль успешно изменен', 'success');
                restore();
            } else {
                showNotification(data.error || 'Ошибка смены пароля', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Сохранить';
            }
        } catch (error) {
            console.error('Password change error:', error);
            showNotification('Ошибка смены пароля', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Сохранить';
        }
    }

    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', restore);
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') restore();
    });
}

// Export user data
function exportUserData() {
    const user = Storage.getUser();
    const data = {
        info: "Creative Jam - User data export",
        timestamp: new Date().toISOString(),
        user: user || {},
        apiKeys: Storage.getApiKey() ? { openrouter: "***hidden***" } : {}
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `creative_jam_data_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showNotification('Данные выгружены', 'success');
}

// Delete account
async function deleteAccount() {
    if (!await showConfirm('ВНИМАНИЕ: Это действие необратимо.\n\nВы действительно хотите удалить свой аккаунт и все данные?', 'Удаление аккаунта', true)) {
        return;
    }

    const password = prompt('Введите ваш пароль для подтверждения:');
    if (!password) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            showNotification('Аккаунт удален', 'success');
            Storage.clear();
            setTimeout(() => location.reload(), 1500);
        } else {
            const data = await response.json();
            showNotification(data.error || 'Не удалось удалить аккаунт', 'error');
        }
    } catch (error) {
        console.error('Delete account error:', error);
        showNotification('Ошибка удаления', 'error');
    }
}

// Save API key
function saveApiKeyOverlay() {
    const key = document.getElementById('overlayOpenRouterKey').value.trim();
    if (key) {
        Storage.setApiKey(key);
        showNotification('API-ключ сохранен', 'success');
        document.getElementById('overlayOpenRouterKey').value = '';
    } else {
        showNotification('Введите API-ключ', 'error');
    }
}

// Load API key placeholder
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('overlayOpenRouterKey');
    if (apiKeyInput) {
        const savedKey = Storage.getApiKey();
        if (savedKey) {
            apiKeyInput.placeholder = '••••••••••••••••';
        }
    }
});
