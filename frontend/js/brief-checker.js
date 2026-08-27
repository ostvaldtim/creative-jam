/**
 * BRIEF CHECKER MODULE (TABS VERSION)
 * Автоматическая проверка полноты брифа через ИИ с выбором вкладок
 */

const BriefChecker = {
    isChecking: false,
    lastScore: null,
    debounceTimer: null,
    minCharsForAnalysis: 20,
    currentMode: 'full', // 'full' или 'lite'
    activeTemplate: null, // текст активного шаблона (если вставлен)
    _storageKey: 'ai-producer-enabled',

    isEnabled() {
        return true; // ИИ-продюсер всегда включён
    },

    _toggleEnabled() {
        const next = !this.isEnabled();
        localStorage.setItem(this._storageKey, next ? 'true' : 'false');
        const scorePanel = document.getElementById('briefScorePanel');
        const btn = scorePanel?.querySelector('.ai-toggle-btn');
        if (next) {
            if (btn) { btn.classList.add('active'); btn.title = 'Отключить ИИ-продюсер'; }
            // Re-run analysis if there's text
            const taskInput = document.getElementById('taskInput');
            if (taskInput) this.handleInput(taskInput.value);
        } else {
            if (btn) { btn.classList.remove('active'); btn.title = 'Включить ИИ-продюсер'; }
            if (scorePanel) { scorePanel.style.opacity = '0'; setTimeout(() => { scorePanel.style.display = 'none'; }, 400); }
            clearTimeout(this.debounceTimer);
        }
        // Sync AiHintPanel if it exists
        if (typeof AiHintPanel !== 'undefined' && AiHintPanel.isActive) {
            if (next) AiHintPanel._renderIdle(); else AiHintPanel._renderOff();
        }
    },

    // Инициализация
    init() {
        this.setupUI();
        this.attachListeners();
    },

    // SVG icons (same as AiHintPanel)
    _svgIcons: {
        producer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
        tip: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
        ok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        toggle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>'
    },

    _getToggleHtml() {
        // Кнопка выключения убрана — продюсер всегда активен
        return '';
    },

    // Настройка UI элементов
    setupUI() {
        const taskInput = document.getElementById('taskInput');
        if (!taskInput) return;

        const inputBox = taskInput.closest('.input-box');
        if (!inputBox) return;

        let container = document.getElementById('briefCheckerContainer');
        if (!container) {
            const checkerHTML = `
                <div id="briefCheckerContainer" class="brief-checker-rt">
                    <div id="briefScorePanel" class="ai-hint-panel" style="display: none; opacity: 0;"></div>
                </div>
            `;
            inputBox.insertAdjacentHTML('afterend', checkerHTML);
        }
    },

    _renderPanelIdle() {
        const panel = document.getElementById('briefScorePanel');
        if (!panel) return;
        panel.innerHTML = `
            <div class="ai-hint-card ai-hint-idle">
                <div class="ai-hint-header">
                    <span class="ai-hint-icon">${this._svgIcons.producer}</span>
                    <span class="ai-hint-title-text">ИИ-продюсер</span>
                    ${this._getToggleHtml()}
                </div>
                <p class="ai-hint-message">Начните вводить описание, чтобы ИИ оценил его полноту.</p>
            </div>
        `;
    },

    _renderPanelLoading() {
        const panel = document.getElementById('briefScorePanel');
        if (!panel) return;
        panel.innerHTML = `
            <div class="ai-hint-card ai-hint-loading">
                <div class="ai-hint-header">
                    <span class="ai-hint-icon">${this._svgIcons.producer}</span>
                    <span class="ai-hint-title-text">ИИ-продюсер</span>
                    ${this._getToggleHtml()}
                </div>
                <div class="ai-hint-spinner-wrap">
                    <div class="ai-hint-spinner"></div>
                    <span>Анализирую…</span>
                </div>
            </div>
        `;
    },

    // Подключение слушателей
    attachListeners() {
        const taskInput = document.getElementById('taskInput');
        if (taskInput) {
            taskInput.addEventListener('input', (e) => this.handleInput(e.target.value));
        }

        // Глобальная функция для выбора режима (вкладки)
        window.selectMode = (el) => {
            const mode = el.getAttribute('data-mode');
            this.currentMode = mode;

            // Обновляем UI вкладок
            document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
            el.classList.add('active');

            // Обновляем динамическое описание
            const desc = document.getElementById('knowledgeDesc');
            if (desc) {
                if (mode === 'full') {
                    desc.textContent = 'Проанализируем все детали вашего проекта';
                } else {
                    desc.textContent = 'Минимум инфы, просто затестить идею';
                }
            }

            // Если текст уже есть, запускаем перепроверку сразу
            const text = taskInput ? taskInput.value.trim() : '';
            if (text.length >= this.minCharsForAnalysis) {
                this.checkBrief(text);
            }
        };
    },

    // Обработка ввода с Debounce
    handleInput(value) {
        const text = value.trim();
        const scorePanel = document.getElementById('briefScorePanel');

        if (!this.isEnabled() || text.length < this.minCharsForAnalysis) {
            if (scorePanel && scorePanel.style.display !== 'none') {
                scorePanel.style.opacity = '0';
                setTimeout(() => {
                    if (!this.isEnabled() || text.length < this.minCharsForAnalysis) scorePanel.style.display = 'none';
                }, 400);
            }
            return;
        }

        if (scorePanel && scorePanel.style.display === 'none') {
            scorePanel.style.display = 'block';
            this._renderPanelIdle();
            setTimeout(() => scorePanel.style.opacity = '1', 10);
        }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            // Если текст = чистый шаблон без изменений — не анализируем
            if (this.activeTemplate && text === this.activeTemplate.trim()) {
                this._renderPanelIdle();
                return;
            }
            this.checkBrief(text);
        }, 800);
    },

    // Проверка брифа через API
    async checkBrief(brief) {
        if (this.isChecking) return;

        this.isChecking = true;
        this._renderPanelLoading();

        // Abort after 15 seconds to avoid infinite waits
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            // PATCH (правка 39): /api/ai/* теперь требует авторизацию — прокидываем токен
            const _token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/ai/analyze-brief', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(_token ? { 'Authorization': `Bearer ${_token}` } : {})
                },
                // PATCH (правка 44): текст загруженных файлов участвует в оценке брифа
                body: JSON.stringify({
                    brief: brief + (typeof getUploadedFilesContext === 'function' ? getUploadedFilesContext() : ''),
                    mode: this.currentMode,
                    isTemplate: !!this.activeTemplate
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            this.displayScore(data);

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name !== 'AbortError') {
                console.error('Real-time check error:', error);
            }
        } finally {
            this.isChecking = false;
        }
    },

    // Отображение результатов в ai-hint-card формате
    displayScore(data) {
        const panel = document.getElementById('briefScorePanel');
        if (!panel) return;

        const score = data.score || 0;
        const status = data.status || 'low';
        const feedback = data.feedback || 'Анализ завершён';

        // Map status to severity for card styling
        const severityMap = { low: 'warn', medium: 'tip', high: 'ok' };
        const severity = severityMap[status] || 'tip';
        const icon = this._svgIcons[severity] || this._svgIcons.tip;

        const statusMsg = this.getStatusText(status);

        panel.innerHTML = `
            <div class="ai-hint-card ai-hint-severity-${severity}">
                <div class="ai-hint-header">
                    <span class="ai-hint-icon">${icon}</span>
                    <span class="ai-hint-title-text">ИИ-продюсер · ${score}/100</span>
                    ${this._getToggleHtml()}
                </div>
                <p class="ai-hint-message">${this._escapeHtml(feedback)}</p>
                <p class="ai-hint-message" style="opacity: 0.6; font-size: 12px; margin: 0;">${this._escapeHtml(statusMsg)}</p>
            </div>
        `;

        this.lastScore = score;
    },

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    getStatusText(status) {
        const pool = {
            low: [
                'Здравствуйте! Давайте заполним бриф вместе',
                'Начало положено — продолжаем!',
                'Отлично, вижу старт. Что за продукт?',
                'Расскажите подробнее — пока мало данных',
                'Пока немного информации. Добавьте деталей',
                'Бриф пока пустоват — наполняем!',
                'Давайте разберёмся с задачей',
                'С чего начнём? Нужны цель и KPI',
                'Пока вижу набросок — раскройте тему',
                'Старт есть! Теперь — подробности',
                'Не хватает ключевых деталей',
                'Зафиксировал. Что по аудитории?',
                'Фундамент есть — строим дальше',
                'Бриф набирает форму. Пожалуйста, добавьте больше деталей',
                'Принято! Добавьте цели и сроки',
            ],
            medium: [
                'Хорошо идём! Добавьте каналы и бюджет',
                'Неплохо! Осталось уточнить KPI',
                'Каркас готов — дорабатываем детали',
                'Целевую вижу. Что по форматам?',
                'Цели понятны. А что с географией?',
                'Прогресс! Уточните аналитику и метрики',
                'С тональностью определились?',
                'Хорошо, с географией понятно!',
                'Бюджет и сроки — и будет огонь',
                'Неплохой бриф. Осталось чуть-чуть',
                'Стилистику бы ещё прописать',
                'Каркас крепкий — шлифуем!',
                'А конкуренты указаны?',
                'Посадочные и форматы — не забудьте',
                'Серьёзный подход! Ещё немного',
            ],
            high: [
                'Почти идеально! Проверьте мелочи',
                'Отличный бриф! Готов к запуску',
                'Всё на месте — можно стартовать',
                'Огонь! Бриф практически полный',
                'Детальный бриф — приятно работать',
                'Профессионально! Мелкие правки?',
                'Топ-уровень! Всё чётко',
                'Бриф укомплектован — запускаем?',
                'Цели, KPI, каналы — всё есть!',
                'Бриф готов на все сто',
                'Впечатляет! Осталось нажать «Старт»',
                'Бриф закрыт — команде будет легко',
                'Полный комплект — рисков минимум',
                'Финишная прямая! Всё учтено',
                'Спасибо за детали — бриф шикарен',
            ]
        };
        const arr = pool[status];
        if (!arr) return 'Анализ...';
        return arr[Math.floor(Math.random() * arr.length)];
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => BriefChecker.init(), 500);
});
