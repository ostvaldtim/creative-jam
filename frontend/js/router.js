/**
 * ROUTER MODULE
 * Навигация на основе hash и отображение страниц
 */

// Роутинг на основе hash
function handleRouting() {
    const hash = window.location.hash.replace('#', '');

    // Start progress bar on navigation
    if (typeof TopProgress !== 'undefined') TopProgress.start();

    // Если хеш относится к OverlayManager
    const overlayModules = ['settings', 'billing', 'help', 'feedback', 'orders', 'invites'];
    if (overlayModules.includes(hash)) {
        if (window.OverlayManager) {
            window.OverlayManager.open(hash, false);
        }
        if (typeof TopProgress !== 'undefined') TopProgress.done();
        return;
    }

    // PATCH (правка 40): раньше ссылка вида #project-2 указывала на номер в массиве:
    // удалили один проект — и все сохранённые ссылки поехали на соседние проекты.
    // Теперь ищем по устойчивому id, а старые числовые ссылки продолжают работать.
    if (hash.startsWith('project-')) {
        const ref = hash.substring('project-'.length);
        const projects = Storage.getProjects();

        const index = typeof window.resolveProjectIndex === 'function'
            ? window.resolveProjectIndex(ref)
            : parseInt(ref, 10);

        const project = index >= 0 ? projects[index] : null;

        if (project) {
            // Если проект — это отчёт, открываем report viewer
            if (project.type === 'report' && project.reportId) {
                showReportViewer(project.reportId);
                if (typeof TopProgress !== 'undefined') TopProgress.done();
                return;
            }
            showProjectContent(project, index);
            if (typeof TopProgress !== 'undefined') TopProgress.done();
            return;
        }
    }

    // Если хеш - это отчёт (report-{id})
    if (hash.startsWith('report-')) {
        const reportId = hash.substring(7); // strip 'report-' prefix
        showReportViewer(reportId);
        if (typeof TopProgress !== 'undefined') TopProgress.done();
        return;
    }

    // По умолчанию - Dashboard
    showDashboard();
    if (typeof TopProgress !== 'undefined') TopProgress.done();
}

// Показать Dashboard (главная секция с вводом)
function showDashboard() {
    // Закрыть оверлеи если открыты
    if (window.OverlayManager && window.OverlayManager.activeModule) {
        window.OverlayManager.close();
    }

    const mainContent = document.getElementById('mainContent');
    // Восстанавливаем обычный padding (если был report-active)
    mainContent.classList.remove('report-active');
    mainContent.innerHTML = `
        <div class="main-content-centerer">

            <h1 class="welcome-title">Создавай<span>.</span></h1>
            <p class="welcome-slogan">Стратегия, контент, видео — всё за минуты</p>

            <div class="input-wrapper">
                <div class="input-box">
                    <div class="input-row">
                        <textarea class="input-field" id="taskInput"
                            placeholder="Опишите ваш проект или бренд максимально подробно..." rows="1"></textarea>
                        <button class="upload-icon-btn" onclick="document.getElementById('fileInput')?.click()"
                            title="Загрузить файлы" aria-label="Загрузить файлы">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </button>
                        <button class="upload-icon-btn mic-btn" id="micBtn" onclick="VoiceDictation.toggle()"
                            title="Голосовой ввод" aria-label="Голосовой ввод">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M19 10v2a7 7 0 01-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        </button>
                        <input type="file" id="fileInput" hidden multiple accept="image/*"
                            onchange="handleFileUpload(this)">
                        <button class="run-btn" onclick="startGeneration()">
                            Старт
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="m5 12 7-7 7 7" />
                                <path d="M12 19V5" />
                            </svg>
                        </button>
                    </div>

                    <!-- Brief Checker Container (injected by brief-checker.js) -->

                    <div class="quick-templates brief-templates">
                        <div class="template-item brief-tpl-btn" onclick="insertTemplate('newbrand')"
                            title="Создать бренд с нуля — ДНК, стратегия, позиционирование">
                            <svg class="template-icon" fill="none" stroke="currentColor" stroke-width="2"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>Новый бренд</span>
                        </div>
                        <div class="template-item brief-tpl-btn" onclick="insertTemplate('scale')"
                            title="Масштабировать существующий бренд — медиаплан, захват рынка">
                            <svg class="template-icon" fill="none" stroke="currentColor" stroke-width="2"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Масштабирование</span>
                        </div>
                        <div class="template-item brief-tpl-btn" onclick="insertTemplate('creative')"
                            title="Креативный завод — карточки, сценарии, сториборды за 3 минуты">
                            <svg class="template-icon" fill="none" stroke="currentColor" stroke-width="2"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Креативный завод</span>
                        </div>
                        <div class="template-item brief-tpl-btn" onclick="insertTemplate('audit')"
                            title="Прожарка стратегии — найти дыры, оценить риски, пересчитать">
                            <svg class="template-icon" fill="none" stroke="currentColor" stroke-width="2"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                            <span>Прожарка стратегии</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Сбрасываем активные пункты в сайдбаре
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Инициализируем анализ брифа после рендера
    if (typeof BriefChecker !== 'undefined') {
        setTimeout(() => BriefChecker.init(), 100);
    }

    // Авторасширение textarea после пересоздания
    setupAutoResizeTextarea();
}

// Показать страницу
function showPage(page) {
    // Если это страница тарифов, открыть в модальном окне
    if (page === 'billing') {
        document.getElementById('userMenu').classList.remove('show');
        showPricingModal();
        return;
    }

    const mainContent = document.getElementById('mainContent');

    const pages = {
        platform: `
            <div style="max-width: 800px; width: 100%;">
                <h2 style="font-size: 32px; margin-bottom: 24px;">Платформа</h2>
                <p style="color: var(--text-2); line-height: 1.8;">
                    Креативный Джем — это ИИ-платформа для создания маркетингового контента.
                    Мы используем передовые языковые модели для генерации стратегий, видео-концепций и текстового контента.
                </p>
            </div>
        `,
        settings: `
            <div style="max-width: 600px; width: 100%;">
                <h2 style="font-size: 32px; margin-bottom: 24px;">Настройки</h2>
                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
                    <button onclick="showSetup()" style="width: 100%; padding: 14px; background: var(--orange); border: none; border-radius: 10px; color: #000; font-weight: 700; cursor: pointer;">
                        Изменить API ключи
                    </button>
                </div>
            </div>
        `,

        help: `
            <div style="max-width: 800px; width: 100%;">
                <h2 style="font-size: 32px; margin-bottom: 24px;">Помощь</h2>
                <p style="color: var(--text-2); line-height: 1.8; margin-bottom: 16px;">
                    Для работы с платформой вам понадобится API ключ от OpenRouter.
                    Получить его можно на <a href="https://openrouter.ai/keys" target="_blank" style="color: var(--orange);">openrouter.ai/keys</a>
                </p>
                <p style="color: var(--text-2); line-height: 1.8;">
                    По всем вопросам обращайтесь на support@creativejam.ru
                </p>
            </div>
        `
    };

    mainContent.innerHTML = `<div class="main-content-centerer">${pages[page] || pages.help}</div>`;

    // Закрыть меню
    document.getElementById('userMenu').classList.remove('show');
}

// Вернуться на главную
function backToDashboard() {
    window.location.hash = '';
}

// Создать новый джем
function createNewJam() {
    // Сначала вернуться на главную (это пересоздаст DOM с taskInput)
    backToDashboard();
    // Очистить поле ввода после того как dashboard отрендерился
    const taskInput = document.getElementById('taskInput');
    if (taskInput) taskInput.value = '';
}

// Показать отчёт внутри app shell
function showReportViewer(reportId) {
    // Закрыть оверлеи если открыты
    if (window.OverlayManager && window.OverlayManager.activeModule) {
        window.OverlayManager.close();
    }

    // Закрыть контекстные меню проектов
    if (typeof closeAllProjectMenus === 'function') closeAllProjectMenus();

    const mainContent = document.getElementById('mainContent');
    const currentTheme = (typeof Theme !== 'undefined' && Theme.getCurrent) ? Theme.getCurrent() : 'dark';
    const reportUrl = '/platform-assets/report.html?id=' + reportId + '&v=' + Date.now() + '&theme=' + currentTheme;

    // Убираем padding у main, чтобы iframe занял весь экран
    mainContent.classList.add('report-active');

    mainContent.innerHTML = `
        <iframe 
            class="report-viewer__frame" 
            id="reportFrame"
            src="${reportUrl}" 
            frameborder="0" 
            allowfullscreen
        ></iframe>
    `;

    // Сбрасываем активные пункты в сайдбаре
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Закрывать меню при клике на iframe (фокус переходит на iframe)
    const frame = document.getElementById('reportFrame');
    if (frame) {
        window.addEventListener('blur', function _onBlur() {
            setTimeout(() => {
                if (document.activeElement === frame || document.activeElement?.tagName === 'IFRAME') {
                    // Закрыть user-меню
                    const menu = document.getElementById('userMenu');
                    if (menu) menu.classList.remove('show');
                    // Закрыть контекстное меню проектов
                    if (typeof closeAllProjectMenus === 'function') closeAllProjectMenus();
                }
            }, 0);
        });
    }
}

