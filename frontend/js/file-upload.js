/**
 * FILE UPLOAD MODULE
 * Обработка загрузки и превью файлов
 */

// PATCH (правка 44): раньше содержимое читалось в data URL и оставалось в браузере:
// на сервер уходило только имя файла. Теперь каждый файл отправляется на разбор
// (/api/ai/parse-file), а извлечённый текст подмешивается в бриф.

// Обработка загрузки файлов
function handleFileUpload(input) {
    if (input.files && input.files.length > 0) {
        if (!AppState.uploadedFiles) AppState.uploadedFiles = [];

        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const entry = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result, // Base64
                    isImage: (file.type || '').startsWith('image/'),
                    parseStatus: 'pending',
                    text: '',
                    parseNote: null
                };
                AppState.uploadedFiles.push(entry);
                renderFilePreviews();
                parseUploadedFile(entry);
            };
            reader.readAsDataURL(file);
        });
    }
    // clear input so same file can be selected again
    input.value = '';
}

/** Отправить файл на серверный разбор и сохранить извлечённый текст */
async function parseUploadedFile(entry) {
    if (entry.isImage) {
        entry.parseStatus = 'skipped';
        entry.parseNote = 'Изображение — текст не извлекается';
        renderFilePreviews();
        return;
    }

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch('/api/ai/parse-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ name: entry.name, type: entry.type, data: entry.data })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            throw new Error(data.message || data.error || `HTTP ${response.status}`);
        }

        const result = (data.files || [])[0] || {};
        entry.text = result.text || '';
        entry.parseNote = result.reason || null;
        entry.parseStatus = entry.text ? 'ready' : 'empty';
        if (result.truncated) {
            entry.parseNote = 'Текст обрезан по длине — в бриф уйдёт начало документа';
        }
    } catch (err) {
        console.warn('[Файлы] Разбор не удался:', err.message);
        entry.parseStatus = 'error';
        entry.parseNote = `Не удалось прочитать файл: ${err.message}`;
    }

    renderFilePreviews();
    if (typeof showNotification === 'function') {
        if (entry.parseStatus === 'ready') {
            showNotification(`Файл «${entry.name}» прочитан и учтён в брифе`, 'success');
        } else if (entry.parseStatus === 'error' || entry.parseStatus === 'empty') {
            showNotification(entry.parseNote || `Файл «${entry.name}» прочитать не удалось`, 'error');
        }
    }
}

/** Текстовый контекст из всех разобранных файлов — подмешивается к брифу */
function getUploadedFilesContext() {
    const files = (AppState.uploadedFiles || []).filter(f => f.text && f.text.trim());
    if (files.length === 0) return '';
    return files
        .map(f => `

--- Содержимое файла: ${f.name} ---
${f.text.trim()}`)
        .join('');
}

if (typeof window !== 'undefined') {
    window.parseUploadedFile = parseUploadedFile;
    window.getUploadedFilesContext = getUploadedFilesContext;
}

// PATCH (правка 44): имя файла приходит от пользователя и попадает в innerHTML — экранируем
function escapeFileText(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderFilePreviews() {
    const area = document.getElementById('filePreviewArea');
    if (!area) return;

    area.innerHTML = '';

    if (!AppState.uploadedFiles || AppState.uploadedFiles.length === 0) return;

    AppState.uploadedFiles.forEach((file, index) => {
        const div = document.createElement('div');

        // PATCH (правка 44): у документа и картинки разная раскладка:
        // картинка остаётся квадратом 60×60, документ — строка с именем и статусом разбора.
        div.className = file.isImage
            ? 'file-preview-item'
            : 'file-preview-item file-preview-item--doc';

        const statusText = {
            pending: 'Читаем…',
            ready: 'Текст извлечён',
            empty: 'Текст не найден',
            error: 'Ошибка разбора',
            skipped: 'Изображение'
        }[file.parseStatus] || '';

        const safeName = escapeFileText(file.name);
        const hint = escapeFileText(file.parseNote || statusText);

        if (file.isImage) {
            div.title = `${safeName} — ${statusText}`;
            div.innerHTML = `
            <img src="${file.data}" alt="${safeName}">
            <div class="file-preview-remove" onclick="removeUploadedFile(${index})">×</div>
        `;
        } else {
            div.innerHTML = `
            <div class="file-preview-doc">📄</div>
            <div class="file-preview-meta" title="${hint}">
                <span class="file-preview-name">${safeName}</span>
                <span class="file-preview-status file-preview-status--${file.parseStatus || 'pending'}">${escapeFileText(statusText)}</span>
            </div>
            <div class="file-preview-remove" onclick="removeUploadedFile(${index})">×</div>
        `;
        }

        area.appendChild(div);
    });
}

function removeUploadedFile(index) {
    if (AppState.uploadedFiles) {
        AppState.uploadedFiles.splice(index, 1);
        renderFilePreviews();
    }
}
