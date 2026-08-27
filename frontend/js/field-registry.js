/**
 * FieldRegistry — unified field metadata for all 4 brief templates
 * Used by ИИ-продюсер for validation and hint context
 *
 * Two-level hint system:
 *   hintOnFocus: true  → show rule-based hint immediately on focus
 *   llmHint: true      → also call LLM for deeper analysis (semantic fields)
 *   llmHint: false     → only clientValidation + rule-based hints (chips/slider/toggle/select)
 */
const FieldRegistry = {

    // ── Validators available ──
    // 'url'         → validateUrl
    // 'email'       → validateEmail
    // 'budget'      → validateBudget
    // 'minLen:N'    → minimum N characters

    // ═══════════════════════════════════════
    //  NEWBRAND
    // ═══════════════════════════════════════
    newbrand: {
        product: { label: 'Продукт / Услуга', placeholder: 'URL сайта или описание: что продаём на языке пользы?', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        utp: { label: 'УТП (Суперсила)', placeholder: 'Почему купят у тебя, а не у соседа?', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        enemy: { label: 'Твой «Враг»', placeholder: 'С чем боремся? (скука, дороговизна, ручной труд)', validators: ['minLen:5'], hintOnFocus: true, llmHint: true },
        ambition: { label: 'Амбиция', placeholder: 'Стать лидером рынка / Уютный локальный бренд', validators: ['minLen:5'], hintOnFocus: true, llmHint: true },
        geo: { label: 'Гео', placeholder: 'Город / Регион / РФ / СНГ / Мир', validators: [], hintOnFocus: true, llmHint: true },
        budget: { label: 'Бюджет', placeholder: 'Сумма в рублях / месяц', validators: ['budget'], hintOnFocus: true, llmHint: true }
    },

    // ═══════════════════════════════════════
    //  SCALE
    // ═══════════════════════════════════════
    scale: {
        brand_url: { label: 'URL текущего бренда', placeholder: 'https://...', validators: ['url'], hintOnFocus: true, llmHint: false },
        new_hero: { label: 'Новый герой', placeholder: 'Название новой линейки / услуги и её фишки', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        main_goal: { label: 'Главная цель', placeholder: 'Продажи / Узнаваемость / Переключить с конкурента', validators: ['minLen:5'], hintOnFocus: true, llmHint: true },
        insight: { label: 'Целевой инсайт', placeholder: 'Какую проблему решаем?', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        kpi: { label: 'KPI', placeholder: '', validators: [], hintOnFocus: false, llmHint: false },
        rtb: { label: 'RTB (Почему поверят?)', placeholder: 'Цифры, лицензии, патенты, опыт', validators: [], hintOnFocus: true, llmHint: true },
        mandatory: { label: 'Обязательные элементы', placeholder: 'Лого, брендбук, обязательные фразы', validators: [], hintOnFocus: true, llmHint: true },
        competitors: { label: 'Конкуренты', placeholder: 'URL конкурента', validators: ['urlList'], hintOnFocus: true, llmHint: false },
        budget: { label: 'Бюджет', placeholder: 'Сумма в рублях / месяц', validators: ['budget'], hintOnFocus: true, llmHint: true },
        file: { label: 'Файл', placeholder: '', validators: [], hintOnFocus: false, llmHint: false }
    },

    // ═══════════════════════════════════════
    //  CREATIVE
    // ═══════════════════════════════════════
    creative: {
        background: { label: 'Background', placeholder: 'Коротко: что делаем, суть проекта', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        message: { label: 'Главный месседж', placeholder: 'Одна мысль, которую должен запомнить юзер', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        effect: { label: 'Эффект', placeholder: '', validators: [], hintOnFocus: false, llmHint: false },
        barrier: { label: 'Барьер / Инсайт', placeholder: 'О чём они думают?', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        channels: { label: 'Каналы и форматы', placeholder: '', validators: [], hintOnFocus: false, llmHint: false },
        tov: { label: 'Тональность (ToV)', placeholder: 'Дерзко / Экспертно / Смешно / Тепло', validators: ['minLen:3'], hintOnFocus: true, llmHint: true },
        refs: { label: 'Референсы', placeholder: 'Ссылка: «Сделай так же круто, как тут»', validators: [], hintOnFocus: true, llmHint: false },
        video_script: { label: 'Сценарий видео', placeholder: '', validators: [], hintOnFocus: false, llmHint: false },
        budget: { label: 'Бюджет', placeholder: 'Сумма в рублях / месяц', validators: ['budget'], hintOnFocus: true, llmHint: true }
    },

    // ═══════════════════════════════════════
    //  AUDIT
    // ═══════════════════════════════════════
    audit: {
        strategy: { label: 'Текст / Файл стратегии', placeholder: 'Вставьте план или загрузите PDF', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        current_numbers: { label: 'Текущие цифры', placeholder: 'CPL, ROI, охват — что имеем сейчас?', validators: ['minLen:5'], hintOnFocus: true, llmHint: true },
        problem: { label: 'Текущий затык', placeholder: 'Почему жарим? «Не растёт ROI»', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        question: { label: 'Запрос к ИИ', placeholder: '«Найди где я теряю деньги?»', validators: ['minLen:10'], hintOnFocus: true, llmHint: true },
        budget: { label: 'Бюджет', placeholder: 'Сколько планируете потратить', validators: ['budget'], hintOnFocus: true, llmHint: true },
        competitor_url: { label: 'URL конкурента-лидера', placeholder: 'На кого ориентируемся', validators: ['url'], hintOnFocus: true, llmHint: false },
        skepticism: { label: 'Уровень скепсиса', placeholder: '', validators: [], hintOnFocus: false, llmHint: false }
    },

    /**
     * Get field config for a specific template and field
     * @param {string} templateType - e.g. 'newbrand', 'scale'
     * @param {string} fieldId - e.g. 'product', 'utp'
     * @returns {object|null}
     */
    get(templateType, fieldId) {
        return this[templateType]?.[fieldId] || null;
    },

    /**
     * Get all fields for a template
     * @param {string} templateType
     * @returns {object}
     */
    getAll(templateType) {
        return this[templateType] || {};
    }
};
