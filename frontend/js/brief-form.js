/**
 * BriefForm — интерактивная форма брифа
 * Заменяет textarea на визуальные карточки-поля при выборе шаблона
 */
const BriefForm = {
    isOpen: false,
    currentType: null,
    container: null,

    // ========== SVG ИКОНКИ ==========
    _icons: {
        box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        gem: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        sword: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>',
        target: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
        wallet: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
        link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
        star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        chart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        bulb: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
        clipboard: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
        search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        paperclip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>',
        edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        chat: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
        sparkle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5.636 5.636l12.728 12.728M3 12h18M5.636 18.364L18.364 5.636"/></svg>',
        brain: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4c0 1.1-.9 2-2 2h-4a2 2 0 01-2-2 4 4 0 014-4z"/><path d="M8 8v1a4 4 0 004 4h0a4 4 0 004-4V8"/><path d="M6 15a6 6 0 0012 0"/><line x1="12" y1="17" x2="12" y2="22"/></svg>',
        megaphone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>',
        mic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
        film: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
        doc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        help: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        thermo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>',
    },

    _icon(name) {
        return this._icons[name] || '';
    },

    // Поля, которые НЕ получают кнопку микрофона
    _noMicFields: new Set([
        'budget', 'brand_url', 'competitor_url', 'competitors', 'refs',
        'kpi', 'current_numbers', 'file'
    ]),

    // Создать кнопку микрофона для поля
    _makeMicBtn(inputEl) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bf-mic-btn';
        btn.title = 'Голосовой ввод';
        btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>`;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof VoiceDictation !== 'undefined') {
                VoiceDictation.toggleFor(inputEl, btn);
            }
        });
        return btn;
    },

    // ========== КОНФИГУРАЦИИ ШАБЛОНОВ ==========
    templates: {
        newbrand: {
            title: 'Новый бренд',
            subtitle: 'Твой ИИ-сооснователь. Создаёт фундамент бренда с нуля.',

            fields: [
                { id: 'product', label: 'Продукт / Услуга', type: 'textarea', placeholder: 'URL сайта или описание: что продаём на языке пользы?', icon: 'box', group: 0 },
                { id: 'utp', label: 'УТП (Суперсила)', type: 'text', placeholder: 'Почему купят у тебя, а не у соседа? (цена, скорость, сервис)', icon: 'gem', group: 0 },
                { id: 'enemy', label: 'Твой «Враг»', type: 'text', placeholder: 'С чем боремся? (скука, дороговизна, ручной труд, плохой сервис)', icon: 'sword', group: 1 },
                { id: 'ambition', label: 'Амбиция', type: 'text', placeholder: 'Стать лидером рынка / Уютный локальный бренд / Технологический дизраптор', icon: 'target', group: 1 },
                { id: 'geo', label: 'Гео', type: 'text', placeholder: 'Город / Регион / РФ / СНГ / Мир', icon: 'globe', group: 2 },
                { id: 'budget', label: 'Бюджет', type: 'text', placeholder: 'Сумма в рублях / месяц', icon: 'wallet', group: 2 }
            ]
        },
        scale: {
            title: 'Масштабирование',
            subtitle: 'ИИ-директор по развитию. Вписывает новый продукт в существующий бренд.',

            fields: [
                { id: 'brand_url', label: 'URL текущего бренда', type: 'text', placeholder: 'https://... (ИИ сам выкачает ToV, ДНК, цвета и ценности)', required: true, icon: 'link', group: 0 },
                { id: 'new_hero', label: 'Новый герой', type: 'textarea', placeholder: 'Название новой линейки / услуги и её фишки', icon: 'star', group: 0 },
                { id: 'main_goal', label: 'Главная цель', type: 'text', placeholder: 'Продажи / Узнаваемость / Переключить с конкурента', icon: 'target', group: 0 },
                { id: 'insight', label: 'Целевой инсайт', type: 'textarea', placeholder: 'Какую проблему решаем? Напр: «Студенты боятся, что работа в ритейле — это дно»', icon: 'bulb', group: 1 },
                {
                    id: 'kpi', label: 'KPI', type: 'chips', options: ['ROI', 'CPL', 'Лиды', 'Охват', 'CR', 'ROAS'],
                    perChipInput: { placeholder: 'Целевое значение' },
                    icon: 'chart', group: 1
                },
                { id: 'rtb', label: 'RTB (Почему нам поверят?)', type: 'textarea', placeholder: 'Цифры, лицензии, патенты, опыт, фишки', icon: 'shield', group: 1 },
                { id: 'mandatory', label: 'Обязательные элементы', type: 'textarea', placeholder: 'Лого, ссылка на брендбук, «нельзя красный цвет», обязательные фразы', icon: 'clipboard', group: 2 },
                { id: 'competitors', label: 'Конкуренты', type: 'list', placeholder: 'URL конкурента (ИИ сам сделает таблицу сравнения)', icon: 'search', group: 2 },
                { id: 'budget', label: 'Бюджет', type: 'text', placeholder: 'Сумма в рублях / месяц', icon: 'wallet', group: 2 },
                { id: 'file', label: 'Файл (PDF/PPTX)', type: 'file', placeholder: 'Загрузить презентацию продукта (опционально)', icon: 'paperclip', group: 2 }
            ]
        },
        creative: {
            title: 'Креативный завод',
            subtitle: 'ИИ-креативный директор. 20+ карточек, сценарии, сториборды за 3 минуты.',

            fields: [
                { id: 'background', label: 'Background', type: 'textarea', placeholder: 'Коротко: что делаем, суть проекта', icon: 'edit', group: 0 },
                { id: 'message', label: 'Главный месседж', type: 'text', placeholder: 'Одна мысль, которую должен запомнить юзер', icon: 'chat', group: 0 },
                {
                    id: 'effect', label: 'Эффект', type: 'chips', options: ['Шок', 'Уют', 'Экспертность', 'Желание купить', 'Вдохновение', 'FOMO'], extra: [
                        { id: 'effect_custom', placeholder: 'Другой эффект или уточнение', type: 'text' }
                    ], icon: 'sparkle', group: 0
                },
                { id: 'barrier', label: 'Барьер / Инсайт', type: 'textarea', placeholder: 'О чём они думают? Напр: «Работать в магазине — это стыдно»', icon: 'brain', group: 1 },
                {
                    id: 'channels', label: 'Каналы и форматы', type: 'chips', options: ['ТВ', 'Telegram', 'Reels', 'YouTube', 'VK', 'Озон', 'Наружка', 'Stories', 'TikTok'], extra: [
                        { id: 'channels_custom', placeholder: 'Другие каналы или уточнения', type: 'text' }
                    ], icon: 'megaphone', group: 1
                },
                { id: 'tov', label: 'Тональность (ToV)', type: 'text', placeholder: 'Дерзко / Экспертно / Смешно / Тепло / Провокационно / Премиально', icon: 'mic', group: 1 },
                { id: 'refs', label: 'Референсы', type: 'list', placeholder: 'Ссылка: «Сделай так же круто, как тут»', icon: 'link', group: 2 },
                { id: 'budget', label: 'Бюджет', type: 'text', placeholder: 'Сумма в рублях / месяц', icon: 'wallet', group: 2 }
            ]
        },
        audit: {
            title: 'Прожарка стратегии',
            subtitle: 'Конструктивный ИИ-Скептик. Найдёт дыры, оценит риски, пересчитает медиаплан.',

            fields: [
                { id: 'strategy', label: 'Текст / Файл стратегии', type: 'textarea_file', placeholder: 'Вставьте план или загрузите PDF', accept: '.pdf,.doc,.docx,.pptx', icon: 'doc', group: 0 },
                { id: 'current_numbers', label: 'Текущие цифры', type: 'text', placeholder: 'CPL, ROI, охват — что имеем сейчас?', icon: 'chart', group: 0 },
                { id: 'problem', label: 'Текущий затык', type: 'textarea', placeholder: 'Почему жарим? «Не растёт ROI», «Скучный креатив», «Конкуренты давят»', icon: 'alert', group: 0 },
                { id: 'question', label: 'Запрос к ИИ', type: 'textarea', placeholder: '«Найди где я теряю деньги?» или «Почему конкурент X растёт быстрее?»', icon: 'help', group: 1 },
                { id: 'budget', label: 'Бюджет', type: 'text', placeholder: 'Сколько планируете потратить на эту стратегию', icon: 'wallet', group: 1 },
                { id: 'competitor_url', label: 'URL конкурента-лидера', type: 'text', placeholder: 'На кого ориентируемся как на эталон', icon: 'search', group: 1 },
                { id: 'skepticism', label: 'Уровень скепсиса', type: 'slider', min: 1, max: 5, labels: ['Мягко посоветуй', 'Будь честен', 'Не жалей', 'Жёстко', 'Разнеси в щепки'], icon: 'thermo', group: 2 }
            ]
        }
    },

    // ========== ОТКРЫТЬ ФОРМУ ==========
    open(type) {
        const config = this.templates[type];
        if (!config) return;

        this.currentType = type;
        this.isOpen = true;

        // Скрываем textarea и template buttons
        const textarea = document.getElementById('taskInput');
        const inputRow = textarea?.closest('.input-row');
        const tplBtns = document.querySelector('.brief-templates');
        if (inputRow) inputRow.style.display = 'none';
        if (tplBtns) tplBtns.style.display = 'none';

        // Создаём / находим контейнер
        let container = document.getElementById('briefFormContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'briefFormContainer';
            const inputBox = document.querySelector('.input-box');
            if (inputBox) {
                const expandTrigger = inputBox.querySelector('.expand-trigger');
                if (expandTrigger) {
                    inputBox.insertBefore(container, expandTrigger);
                } else {
                    inputBox.appendChild(container);
                }
            }
        }
        this.container = container;

        // Рендерим форму
        container.innerHTML = '';
        container.className = 'brief-form active';

        // Шапка формы
        const header = document.createElement('div');
        header.className = 'bf-header';
        header.innerHTML = `
            <div class="bf-header-left">
                <div class="bf-title">${config.title}</div>
                ${config.subtitle ? `<div class="bf-subtitle">${config.subtitle}</div>` : ''}
            </div>
            <div class="bf-header-right">
                <button class="bf-mode-pill" onclick="BriefForm.close()" title="Переключить на свободный ввод">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Свободный ввод
                </button>
            </div>
        `;
        container.appendChild(header);



        // Поля (с группировкой)
        const fieldsWrap = document.createElement('div');
        fieldsWrap.className = 'bf-fields';
        config.fields.forEach(field => {
            fieldsWrap.appendChild(this._renderField(field));
        });
        container.appendChild(fieldsWrap);

        // Кнопка Старт внизу формы
        const footer = document.createElement('div');
        footer.className = 'bf-footer';
        footer.innerHTML = `
            <div class="bf-fill-indicator">
                <span class="bf-fill-text">Заполнено: <strong id="bfFillCount">0</strong> из <strong id="bfFillTotal">${config.fields.length}</strong></span>
                <div class="bf-fill-bar"><div class="bf-fill-progress" id="bfFillProgress"></div></div>
            </div>
            <button class="run-btn" onclick="startGeneration()">
                Старт
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
                </svg>
            </button>
        `;
        container.appendChild(footer);

        // Обновляем индикатор
        this._updateFillCount();

        // Сообщаем BriefChecker, скрываем его панель
        if (typeof BriefChecker !== 'undefined') {
            BriefChecker.activeTemplate = '__form__';
            clearTimeout(BriefChecker.debounceTimer);
            const bc = document.getElementById('briefCheckerContainer');
            if (bc) bc.style.display = 'none';
        }

        // ИИ-продюсер: инициализация панели подсказок
        if (typeof AiHintPanel !== 'undefined') {
            AiHintPanel.init(type);
        }
    },

    // ========== ЗАКРЫТЬ ФОРМУ ==========
    close() {
        this.isOpen = false;
        this.currentType = null;

        if (this.container) {
            this.container.innerHTML = '';
            this.container.className = 'brief-form';
        }

        // Показываем textarea и buttons
        const textarea = document.getElementById('taskInput');
        const inputRow = textarea?.closest('.input-row');
        const tplBtns = document.querySelector('.brief-templates');
        if (inputRow) inputRow.style.display = '';
        if (tplBtns) tplBtns.style.display = '';

        if (textarea) textarea.focus();

        if (typeof BriefChecker !== 'undefined') {
            BriefChecker.activeTemplate = null;
            const bc = document.getElementById('briefCheckerContainer');
            if (bc) bc.style.display = '';
        }

        // ИИ-продюсер: уничтожаем панель подсказок
        if (typeof AiHintPanel !== 'undefined') {
            AiHintPanel.destroy();
        }
    },

    // ========== РЕНДЕР ПОЛЕЙ ==========
    _renderField(field) {
        const card = document.createElement('div');
        card.className = 'bf-field';
        card.dataset.fieldId = field.id;

        const label = document.createElement('label');
        label.className = 'bf-label';
        label.innerHTML = (field.icon ? `<span class="bf-label-icon">${this._icon(field.icon)}</span> ` : '') + field.label;
        if (field.required) label.innerHTML += ' <span style="color:var(--accent)">*</span>';
        card.appendChild(label);

        const inputArea = document.createElement('div');
        inputArea.className = 'bf-input-area';

        switch (field.type) {
            case 'text':
                inputArea.appendChild(this._makeTextInput(field));
                break;
            case 'textarea':
                inputArea.appendChild(this._makeTextarea(field));
                break;
            case 'textarea_file':
                inputArea.appendChild(this._makeTextareaFile(field));
                break;
            case 'chips':
                inputArea.appendChild(this._makeChips(field));
                if (field.extra && !field.perChipInput) {
                    const extraWrap = document.createElement('div');
                    extraWrap.className = 'bf-chips-extra';
                    field.extra.forEach(ex => {
                        extraWrap.appendChild(this._makeTextInput(ex));
                    });
                    inputArea.appendChild(extraWrap);
                }
                break;
            case 'list':
                inputArea.appendChild(this._makeList(field));
                break;
            case 'select':
                inputArea.appendChild(this._makeSelect(field));
                break;
            case 'slider':
                inputArea.appendChild(this._makeSlider(field));
                break;
            case 'toggle':
                inputArea.appendChild(this._makeToggle(field));
                break;
            case 'file':
                inputArea.appendChild(this._makeFileInput(field));
                break;
        }

        card.appendChild(inputArea);

        // ИИ-продюсер: привязываем все типы полей к панели подсказок
        if (typeof AiHintPanel !== 'undefined') {
            // text inputs и textareas
            const textInputs = inputArea.querySelectorAll('input[type="text"], textarea');
            textInputs.forEach(inp => {
                inp.addEventListener('focus', () => AiHintPanel.onFieldFocus(field.id));
                inp.addEventListener('input', () => AiHintPanel.onFieldInput(field.id, inp.value));
            });

            // slider (input[type="range"])
            const sliders = inputArea.querySelectorAll('input[type="range"]');
            sliders.forEach(sl => {
                sl.addEventListener('focus', () => AiHintPanel.onFieldFocus(field.id));
                sl.addEventListener('input', () => {
                    const labelEl = sl.closest('.bf-slider-wrap')?.querySelector('.bf-slider-current');
                    AiHintPanel.onFieldInput(field.id, labelEl?.textContent || sl.value);
                });
            });

            // select
            const selects = inputArea.querySelectorAll('select');
            selects.forEach(sel => {
                sel.addEventListener('focus', () => AiHintPanel.onFieldFocus(field.id));
                sel.addEventListener('change', () => AiHintPanel.onFieldInput(field.id, sel.value));
            });

            // chips — trigger on click (aggregate selected values)
            const chipsWrap = inputArea.querySelector('.bf-chips-wrap');
            if (chipsWrap) {
                chipsWrap.addEventListener('click', (e) => {
                    if (!e.target.closest('.bf-chip')) return;
                    setTimeout(() => {
                        const selected = Array.from(chipsWrap.querySelectorAll('.bf-chip.selected')).map(c => c.textContent);
                        AiHintPanel.onFieldFocus(field.id);
                        if (selected.length > 0) {
                            AiHintPanel.onFieldInput(field.id, selected.join(', '));
                        }
                    }, 50);
                });
            }

            // toggle
            const toggles = inputArea.querySelectorAll('.bf-toggle');
            toggles.forEach(tog => {
                tog.addEventListener('click', () => {
                    setTimeout(() => {
                        AiHintPanel.onFieldFocus(field.id);
                        AiHintPanel.onFieldInput(field.id, tog.dataset.value === 'yes' ? 'Да' : 'Нет');
                    }, 50);
                });
            });
        }

        return card;
    },

    _makeTextInput(field) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'bf-input';
        input.placeholder = field.placeholder || '';
        input.dataset.fieldId = field.id;
        input.addEventListener('input', () => this._updateFillCount());

        // Добавляем кнопку микрофона для подходящих полей
        if (!this._noMicFields.has(field.id)) {
            const wrap = document.createElement('div');
            wrap.className = 'bf-input-mic-wrap';
            wrap.appendChild(input);
            wrap.appendChild(this._makeMicBtn(input));
            return wrap;
        }

        return input;
    },

    _makeTextarea(field) {
        const ta = document.createElement('textarea');
        ta.className = 'bf-input bf-textarea';
        ta.placeholder = field.placeholder || '';
        ta.rows = 2;
        ta.dataset.fieldId = field.id;
        ta.addEventListener('input', () => {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
            this._updateFillCount();
        });

        // Добавляем кнопку микрофона для подходящих полей
        if (!this._noMicFields.has(field.id)) {
            const wrap = document.createElement('div');
            wrap.className = 'bf-input-mic-wrap bf-input-mic-wrap--textarea';
            wrap.appendChild(ta);
            wrap.appendChild(this._makeMicBtn(ta));
            return wrap;
        }

        return ta;
    },

    _makeTextareaFile(field) {
        const wrap = document.createElement('div');
        wrap.className = 'bf-textarea-file-wrap';
        wrap.dataset.fieldId = field.id;

        const ta = document.createElement('textarea');
        ta.className = 'bf-input bf-textarea';
        ta.placeholder = field.placeholder || '';
        ta.rows = 3;
        ta.dataset.fieldId = field.id;
        ta.addEventListener('input', () => {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
            this._updateFillCount();
        });

        // Кнопка микрофона для textarea_file
        const micBtnEl = this._makeMicBtn(ta);
        micBtnEl.classList.add('bf-mic-btn--in-textarea-file');

        const fileStrip = document.createElement('div');
        fileStrip.className = 'bf-file-strip';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = field.accept || '.pdf,.doc,.docx,.pptx';
        fileInput.hidden = true;
        fileInput.dataset.fieldId = field.id + '_file';

        const uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.className = 'bf-upload-btn';
        uploadBtn.innerHTML = `
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Загрузить PDF
        `;

        const fileInfo = document.createElement('span');
        fileInfo.className = 'bf-file-info';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'bf-file-remove';
        removeBtn.innerHTML = '×';
        removeBtn.style.display = 'none';

        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileInfo.textContent = fileInput.files[0].name;
                removeBtn.style.display = 'inline-flex';
                uploadBtn.classList.add('has-file');
            }
            this._updateFillCount();
        });
        removeBtn.addEventListener('click', () => {
            fileInput.value = '';
            fileInfo.textContent = '';
            removeBtn.style.display = 'none';
            uploadBtn.classList.remove('has-file');
            this._updateFillCount();
        });

        fileStrip.appendChild(uploadBtn);
        fileStrip.appendChild(fileInput);
        fileStrip.appendChild(fileInfo);
        fileStrip.appendChild(removeBtn);

        const taWrap = document.createElement('div');
        taWrap.className = 'bf-input-mic-wrap bf-input-mic-wrap--textarea';
        taWrap.appendChild(ta);
        taWrap.appendChild(micBtnEl);
        wrap.appendChild(taWrap);
        wrap.appendChild(fileStrip);
        return wrap;
    },

    _makeChips(field) {
        const outer = document.createElement('div');
        outer.className = 'bf-chips-outer';

        const wrap = document.createElement('div');
        wrap.className = 'bf-chips-wrap';
        wrap.dataset.fieldId = field.id;

        // Container for per-chip inputs (only if perChipInput is set)
        const inputsContainer = field.perChipInput ? document.createElement('div') : null;
        if (inputsContainer) {
            inputsContainer.className = 'bf-per-chip-inputs';
            inputsContainer.dataset.fieldId = field.id;
        }

        (field.options || []).forEach(opt => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'bf-chip';
            chip.textContent = opt;
            chip.addEventListener('click', () => {
                chip.classList.toggle('selected');
                if (field.perChipInput) {
                    this._syncPerChipInputs(field, wrap, inputsContainer);
                }
                this._updateFillCount();
            });
            wrap.appendChild(chip);
        });

        outer.appendChild(wrap);
        if (inputsContainer) outer.appendChild(inputsContainer);
        return outer;
    },

    _syncPerChipInputs(field, chipsWrap, container) {
        const selected = Array.from(chipsWrap.querySelectorAll('.bf-chip.selected')).map(c => c.textContent);
        // Remember existing values
        const existing = {};
        container.querySelectorAll('.bf-per-chip-row').forEach(row => {
            const label = row.dataset.chipLabel;
            const input = row.querySelector('input');
            if (input) existing[label] = input.value;
        });
        // Rebuild
        container.innerHTML = '';
        selected.forEach(label => {
            const row = document.createElement('div');
            row.className = 'bf-per-chip-row';
            row.dataset.chipLabel = label;

            const tag = document.createElement('span');
            tag.className = 'bf-per-chip-tag';
            tag.textContent = label;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'bf-input bf-per-chip-value';
            input.placeholder = field.perChipInput.placeholder || 'Значение';
            input.dataset.fieldId = field.id + '_val_' + label;
            if (existing[label]) input.value = existing[label];
            input.addEventListener('input', () => this._updateFillCount());

            // ИИ-продюсер: wire dynamically-created per-chip inputs
            if (typeof AiHintPanel !== 'undefined') {
                input.addEventListener('focus', () => AiHintPanel.onFieldFocus(field.id));
                input.addEventListener('input', () => AiHintPanel.onFieldInput(field.id, input.value));
            }

            row.appendChild(tag);
            row.appendChild(input);
            container.appendChild(row);
        });
    },

    _makeSelect(field) {
        const wrap = document.createElement('div');
        wrap.className = 'bf-select-wrap';
        wrap.dataset.fieldId = field.id;

        const select = document.createElement('select');
        select.className = 'bf-select';
        select.dataset.fieldId = field.id;

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Выберите...';
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        select.appendChild(defaultOpt);

        (field.options || []).forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
        });

        select.addEventListener('change', () => this._updateFillCount());
        wrap.appendChild(select);
        return wrap;
    },

    _makeSlider(field) {
        const wrap = document.createElement('div');
        wrap.className = 'bf-slider-wrap';
        wrap.dataset.fieldId = field.id;

        const labelRow = document.createElement('div');
        labelRow.className = 'bf-slider-labels';

        const currentLabel = document.createElement('span');
        currentLabel.className = 'bf-slider-current';
        currentLabel.textContent = field.labels ? field.labels[Math.floor((field.max - field.min) / 2)] : '';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'bf-slider';
        slider.min = field.min || 1;
        slider.max = field.max || 5;
        slider.value = Math.ceil(((field.max || 5) - (field.min || 1)) / 2) + (field.min || 1);
        slider.dataset.fieldId = field.id;
        slider.dataset.touched = 'no';

        slider.addEventListener('input', () => {
            slider.dataset.touched = 'yes';
            if (field.labels) {
                const idx = parseInt(slider.value) - (field.min || 1);
                currentLabel.textContent = field.labels[idx] || '';
            }
            this._updateFillCount();
        });

        // Initial label
        if (field.labels) {
            const idx = parseInt(slider.value) - (field.min || 1);
            currentLabel.textContent = field.labels[idx] || '';
        }

        const minLabel = document.createElement('span');
        minLabel.className = 'bf-slider-min';
        minLabel.textContent = field.labels ? field.labels[0] : field.min;

        const maxLabel = document.createElement('span');
        maxLabel.className = 'bf-slider-max';
        maxLabel.textContent = field.labels ? field.labels[field.labels.length - 1] : field.max;

        wrap.appendChild(currentLabel);
        wrap.appendChild(slider);
        labelRow.appendChild(minLabel);
        labelRow.appendChild(maxLabel);
        wrap.appendChild(labelRow);

        return wrap;
    },

    _makeToggle(field) {
        const wrap = document.createElement('div');
        wrap.className = 'bf-toggle-wrap';
        wrap.dataset.fieldId = field.id;

        const label = document.createElement('span');
        label.className = 'bf-toggle-label';
        label.textContent = field.placeholder || 'Вкл/Выкл';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'bf-toggle';
        toggle.dataset.fieldId = field.id;
        toggle.dataset.value = 'no';
        toggle.innerHTML = '<span class="bf-toggle-thumb"></span>';

        toggle.addEventListener('click', () => {
            const isOn = toggle.dataset.value === 'yes';
            toggle.dataset.value = isOn ? 'no' : 'yes';
            toggle.classList.toggle('active', !isOn);
            this._updateFillCount();
        });

        wrap.appendChild(label);
        wrap.appendChild(toggle);
        return wrap;
    },

    _makeFileInput(field) {
        const wrap = document.createElement('div');
        wrap.className = 'bf-file-wrap';
        wrap.dataset.fieldId = field.id;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bf-file-btn';
        btn.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            ${field.placeholder || 'Выбрать файл'}
        `;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.pptx,.ppt,.doc,.docx';
        fileInput.hidden = true;
        fileInput.dataset.fieldId = field.id;

        const fileName = document.createElement('span');
        fileName.className = 'bf-file-name';

        btn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileName.textContent = fileInput.files[0].name;
                btn.classList.add('has-file');
            } else {
                fileName.textContent = '';
                btn.classList.remove('has-file');
            }
            this._updateFillCount();
        });

        wrap.appendChild(btn);
        wrap.appendChild(fileInput);
        wrap.appendChild(fileName);
        return wrap;
    },

    _makeList(field) {
        const wrap = document.createElement('div');
        wrap.className = 'bf-list-wrap';
        wrap.dataset.fieldId = field.id;

        const items = document.createElement('div');
        items.className = 'bf-list-items';
        items.appendChild(this._makeListItem(field.placeholder, field.id));
        wrap.appendChild(items);

        const actions = document.createElement('div');
        actions.className = 'bf-list-actions';

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'bf-list-add';
        addBtn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6"/></svg> Добавить`;
        addBtn.addEventListener('click', () => {
            items.appendChild(this._makeListItem(field.placeholder, field.id));
            this._updateFillCount();
        });
        actions.appendChild(addBtn);

        if (field.bulkPaste) {
            const bulkBtn = document.createElement('button');
            bulkBtn.type = 'button';
            bulkBtn.className = 'bf-list-bulk';
            bulkBtn.textContent = 'Вставить пачкой';
            bulkBtn.addEventListener('click', () => {
                const text = prompt('Вставьте список (каждый пункт с новой строки):');
                if (text) {
                    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                    lines.forEach(line => {
                        const item = this._makeListItem(field.placeholder, field.id);
                        item.querySelector('input').value = line;
                        items.appendChild(item);
                    });
                    this._updateFillCount();
                }
            });
            actions.appendChild(bulkBtn);
        }

        wrap.appendChild(actions);
        return wrap;
    },

    _makeListItem(placeholder, fieldId) {
        const row = document.createElement('div');
        row.className = 'bf-list-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'bf-input';
        input.placeholder = placeholder || '';
        input.addEventListener('input', () => this._updateFillCount());

        // ИИ-продюсер: wire dynamically-created list inputs
        if (fieldId && typeof AiHintPanel !== 'undefined') {
            input.addEventListener('focus', () => AiHintPanel.onFieldFocus(fieldId));
            input.addEventListener('input', () => AiHintPanel.onFieldInput(fieldId, input.value));
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'bf-list-remove';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', () => {
            const parent = row.closest('.bf-list-items');
            if (parent && parent.children.length > 1) {
                row.remove();
                this._updateFillCount();
            }
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        return row;
    },

    // ========== ЗАПОЛНЕННОСТЬ ==========
    _updateFillCount() {
        const { filled, total } = this.getFilledInfo();
        const countEl = document.getElementById('bfFillCount');
        const totalEl = document.getElementById('bfFillTotal');
        const progressEl = document.getElementById('bfFillProgress');
        if (countEl) countEl.textContent = filled;
        if (totalEl) totalEl.textContent = total;
        if (progressEl) {
            const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
            progressEl.style.width = pct + '%';
            progressEl.className = 'bf-fill-progress' + (pct >= 80 ? ' high' : pct >= 50 ? ' medium' : ' low');
        }

    },

    getFilledInfo() {
        if (!this.container || !this.currentType) return { filled: 0, total: 0 };
        const config = this.templates[this.currentType];
        if (!config) return { filled: 0, total: 0 };

        let filled = 0;
        let total = 0;

        config.fields.forEach(field => {
            // For perChipInput fields: only count the per-chip value rows, not the chip selection itself
            if (field.perChipInput) {
                const perChipContainer = this.container.querySelector(`.bf-per-chip-inputs[data-field-id="${field.id}"]`);
                if (perChipContainer) {
                    const rows = perChipContainer.querySelectorAll('.bf-per-chip-row');
                    total += rows.length;
                    rows.forEach(row => {
                        const input = row.querySelector('input');
                        if (input && input.value.trim().length > 0) filled++;
                    });
                }
            } else {
                total++;
                if (this._isFieldFilled(field)) filled++;
            }
        });

        return { filled, total };
    },

    _isFieldFilled(field) {
        if (!this.container) return false;

        switch (field.type) {
            case 'text': {
                const input = this.container.querySelector(`input[data-field-id="${field.id}"]`);
                return input && input.value.trim().length > 0;
            }
            case 'textarea': {
                const ta = this.container.querySelector(`textarea[data-field-id="${field.id}"]`);
                return ta && ta.value.trim().length > 0;
            }
            case 'textarea_file': {
                const ta2 = this.container.querySelector(`textarea[data-field-id="${field.id}"]`);
                const fi2 = this.container.querySelector(`input[type="file"][data-field-id="${field.id}_file"]`);
                return (ta2 && ta2.value.trim().length > 0) || (fi2 && fi2.files.length > 0);
            }
            case 'chips': {
                const wrap = this.container.querySelector(`.bf-chips-wrap[data-field-id="${field.id}"]`);
                return wrap && wrap.querySelectorAll('.bf-chip.selected').length > 0;
            }
            case 'list': {
                const wrap = this.container.querySelector(`.bf-list-wrap[data-field-id="${field.id}"]`);
                if (!wrap) return false;
                const inputs = wrap.querySelectorAll('.bf-list-item input');
                return Array.from(inputs).some(inp => inp.value.trim().length > 0);
            }
            case 'select': {
                const select = this.container.querySelector(`select[data-field-id="${field.id}"]`);
                return select && select.value !== '';
            }
            case 'slider': {
                const slider = this.container.querySelector(`.bf-slider[data-field-id="${field.id}"]`);
                return slider && slider.dataset.touched === 'yes';
            }
            case 'toggle': {
                // Toggle counts as filled only when turned ON
                const toggle = this.container.querySelector(`.bf-toggle[data-field-id="${field.id}"]`);
                return toggle && toggle.dataset.value === 'yes';
            }
            case 'file': {
                const fileInput = this.container.querySelector(`input[type="file"][data-field-id="${field.id}"]`);
                return fileInput && fileInput.files.length > 0;
            }
        }
        return false;
    },

    // ========== СБОРКА ТЕКСТА ==========
    serialize() {
        if (!this.container || !this.currentType) return '';
        const config = this.templates[this.currentType];
        if (!config) return '';

        const parts = [];

        config.fields.forEach(field => {
            const value = this._getFieldValue(field);
            if (value) {
                parts.push(`- ${field.label}: ${value}`);
            } else {
                parts.push(`- ${field.label}:`);
            }
        });

        return parts.join('\n');
    },

    _getFieldValue(field) {
        if (!this.container) return '';

        switch (field.type) {
            case 'text': {
                const input = this.container.querySelector(`input[data-field-id="${field.id}"]`);
                return input ? input.value.trim() : '';
            }
            case 'textarea': {
                const ta = this.container.querySelector(`textarea[data-field-id="${field.id}"]`);
                return ta ? ta.value.trim() : '';
            }
            case 'textarea_file': {
                const ta2 = this.container.querySelector(`textarea[data-field-id="${field.id}"]`);
                const fi2 = this.container.querySelector(`input[type="file"][data-field-id="${field.id}_file"]`);
                let val = ta2 ? ta2.value.trim() : '';
                if (fi2 && fi2.files.length > 0) {
                    val += (val ? ' | ' : '') + 'Файл: ' + fi2.files[0].name;
                }
                return val;
            }
            case 'chips': {
                const wrap = this.container.querySelector(`.bf-chips-wrap[data-field-id="${field.id}"]`);
                if (!wrap) return '';
                const selected = Array.from(wrap.querySelectorAll('.bf-chip.selected')).map(c => c.textContent);

                // Per-chip inputs: collect as "ROI: 200%, CPL: 500"
                if (field.perChipInput) {
                    const perChipContainer = this.container.querySelector(`.bf-per-chip-inputs[data-field-id="${field.id}"]`);
                    if (perChipContainer) {
                        const parts = [];
                        perChipContainer.querySelectorAll('.bf-per-chip-row').forEach(row => {
                            const label = row.dataset.chipLabel;
                            const val = row.querySelector('input')?.value?.trim() || '';
                            parts.push(val ? `${label}: ${val}` : label);
                        });
                        return parts.join(', ');
                    }
                    return selected.join(', ');
                }

                let result = selected.join(', ');
                if (field.extra) {
                    field.extra.forEach(ex => {
                        const input = this.container.querySelector(`input[data-field-id="${ex.id}"]`);
                        if (input && input.value.trim()) {
                            result += ` | ${ex.placeholder}: ${input.value.trim()}`;
                        }
                    });
                }
                return result;
            }
            case 'list': {
                const wrap = this.container.querySelector(`.bf-list-wrap[data-field-id="${field.id}"]`);
                if (!wrap) return '';
                const values = Array.from(wrap.querySelectorAll('.bf-list-item input'))
                    .map(inp => inp.value.trim())
                    .filter(Boolean);
                return values.join(', ');
            }
            case 'select': {
                const select = this.container.querySelector(`select[data-field-id="${field.id}"]`);
                return select ? select.value : '';
            }
            case 'slider': {
                const slider = this.container.querySelector(`.bf-slider[data-field-id="${field.id}"]`);
                if (!slider) return '';
                const val = parseInt(slider.value);
                if (field.labels) {
                    const idx = val - (field.min || 1);
                    return field.labels[idx] || val;
                }
                return val.toString();
            }
            case 'toggle': {
                const toggle = this.container.querySelector(`.bf-toggle[data-field-id="${field.id}"]`);
                return toggle && toggle.dataset.value === 'yes' ? 'Да' : 'Нет';
            }
            case 'file': {
                const fileInput = this.container.querySelector(`input[type="file"][data-field-id="${field.id}"]`);
                return fileInput && fileInput.files.length > 0 ? fileInput.files[0].name : '';
            }
        }
        return '';
    },

    getFilledRatio() {
        const { filled, total } = this.getFilledInfo();
        return total > 0 ? filled / total : 0;
    }
};
