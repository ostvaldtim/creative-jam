/* Feedback / Bug Report Logic */

async function submitBugReport() {
    const title = document.getElementById('bugTitle').value;
    const steps = document.getElementById('bugSteps').value;
    const expected = document.getElementById('bugExpected').value;
    const fileInput = document.getElementById('bugScreenshot');
    const allowTechData = true; // Always true now that checkbox is removed

    if (!title || !steps) {
        showNotification('Пожалуйста, заполните "Что случилось" и "Шаги воспроизведения"', 'warning');
        return;
    }

    // Prepare Technical Data
    let techData = {};
    if (allowTechData) {
        techData = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`,
            url: window.location.href,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            buildVersion: '1.0.0-beta' // Example manual version
        };

        // Try to get User ID
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.id) techData.userId = user.id;
        } catch (e) {
            console.warn('Could not retrieve user ID for bug report');
        }
    }

    // Construct Body
    // Using FormData to handle potential file uploads
    const formData = new FormData();
    formData.append('title', title);
    formData.append('steps', steps);
    formData.append('expected', expected);
    formData.append('techData', JSON.stringify(techData));

    if (fileInput.files.length > 0) {
        formData.append('screenshot', fileInput.files[0]);
    }

    try {
        const btn = document.querySelector('.glass-action-btn.primary');
        const originalText = btn.textContent;
        btn.textContent = 'Отправка...';
        btn.disabled = true;

        // Try to send to backend if available
        let success = false;
        try {
            // Check if backend API URL is defined, otherwise fallback
            const baseUrl = (typeof API_URL !== 'undefined') ? API_URL : '';

            // Note: We are mocking the backend response for now as we don't assume the backend route exists yet
            // To actually implement:
            /*
            const response = await fetch(`${baseUrl}/api/feedback/bug`, {
                method: 'POST',
                body: formData // No Content-Type header for FormData
            });
            if (!response.ok) throw new Error('API Error');
            */

            // Simulating network delay and success
            await new Promise(resolve => setTimeout(resolve, 800));
            console.log('[Feedback] Mock Sending:', {
                title, steps, expected, techData, file: fileInput.files[0]
            });
            success = true;

        } catch (apiError) {
            console.error('Feedback API error:', apiError);
            throw apiError;
        }

        if (success) {
            showNotification('Отчет успешно отправлен', 'success');

            // Reset form
            document.getElementById('bugTitle').value = '';
            document.getElementById('bugSteps').value = '';
            document.getElementById('bugExpected').value = '';
            document.getElementById('bugScreenshot').value = '';
            document.getElementById('fileName').textContent = '';

            OverlayManager.close();
        }

    } catch (error) {
        console.error('Failed to submit report:', error);
        showNotification('Не удалось отправить отчет. Попробуйте позже.', 'error');
    } finally {
        const btn = document.querySelector('.glass-action-btn.primary');
        if (btn) {
            btn.textContent = 'Отправить отчет';
            btn.disabled = false;
        }
    }
}
