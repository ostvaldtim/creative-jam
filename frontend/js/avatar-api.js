async function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('Пожалуйста, выберите изображение', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Размер файла не должен превышать 5МБ', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const imageData = e.target.result;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                showNotification('Пожалуйста, войдите в аккаунт', 'error');
                return;
            }

            // Используем API_URL если он определен (из auth.js)
            const baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';

            const response = await fetch(`${baseUrl}/api/user/avatar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatar: imageData })
            });

            const data = await response.json();

            if (response.ok) {
                updateAvatarDisplay(imageData);

                // Обновляем данные пользователя в локальном хранилище
                if (window.Storage) {
                    const user = Storage.getUser();
                    if (user) {
                        user.avatar = imageData;
                        Storage.setUser(user);
                    }
                }

                showNotification('Аватар успешно обновлен', 'success');
            } else {
                throw new Error(data.error || 'Ошибка загрузки');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            showNotification(error.message, 'error');
        }
    };

    reader.readAsDataURL(file);
}

function updateAvatarDisplay(imageData) {
    console.log('[Avatar] updateAvatarDisplay called, data length:', imageData?.length);

    // 1. Overlay Avatar
    const overlayAvatar = document.getElementById('overlayAvatar');
    if (overlayAvatar) {
        overlayAvatar.style.backgroundImage = `url(${imageData})`;
        overlayAvatar.textContent = '';
    }

    // 2. Sidebar Avatar
    const menuAvatar = document.getElementById('userAvatar');
    if (menuAvatar) {
        menuAvatar.style.backgroundImage = `url(${imageData})`;
        menuAvatar.style.backgroundSize = 'cover';
        menuAvatar.style.backgroundPosition = 'center';
        menuAvatar.textContent = '';
    }

    // 3. Fixed Menu Button Avatar (in Glass Overlay)
    const fixedMenuAvatar = document.getElementById('overlayMenuAvatar');
    if (fixedMenuAvatar) {
        fixedMenuAvatar.style.backgroundImage = `url(${imageData})`;
        fixedMenuAvatar.textContent = '';
    }

    console.log('[Avatar] All avatars updated');
}

async function loadUserAvatar() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';

        const response = await fetch(`${baseUrl}/api/user/avatar`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success && data.avatar) {
            updateAvatarDisplay(data.avatar);
        }
    } catch (error) {
        console.error('Load avatar error:', error);
    }
}
