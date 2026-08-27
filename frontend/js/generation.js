// @ts-nocheck
/**
 * GENERATION MODULE
 * Анализ брифа, шаблоны, генерация контента
 */

// Шаблоны брифов
const BRIEF_TEMPLATES = {
    standard: `1) Бренд/продукт:
- Название бренда:
- Сфера:
- Продукт/услуга (что продаём):
- Гео/рынок:
- Сайт/лендинг/страницы:

2) Цель и KPI:
- Главная цель (что хотим изменить):
- KPI:

3) ЦА (аудитория):
- Основные сегменты (2–4):
- Боли/мотивации:
- Барьеры/возражения:
- Триггеры покупки:

4) Позиционирование и UTP:
- Позиционирование (1–2 предложения):
- UTP / ключевое обещание:

5) Конкуренты и отличия:
- 3–5 конкурентов:
- Чем мы лучше/иначе:

6) Оффер и продуктовые детали:
- Цены/планы/маржинальность (если можно):
- Промо/скидки/условия:

7) Каналы и формат:
- Каналы (поиск/соцсети/ретаргет/CRM/партнёры):
- Какие форматы/креативы:
- Посадочная (лендинг/каталог/квиз):

8) Тональность и ограничения:
- Tone of voice:
- Запрещено/комплаенс:
- Юр. ограничения:

9) Аналитика:
- Что считаем (события/конверсии):
- Инструменты (GA4/MMP/CRM):
- Источник истины (что считаем успехом):

10) Доп. вводные:
- Сроки:
- Бюджет:`,

    quick: `- Бренд/продукт:
- Цель кампании:
- KPI (цифра + срок):
- ЦА (кто + 1–2 инсайта):
- UTP (почему мы):
- Позиционирование (как хотим восприниматься):
- Каналы:
- Оффер/цена:
- Ограничения/что нельзя:
- Ссылка на посадочную:`,

    seo: `- Бренд/продукт/гео:
- Цель и KPI (ROAS/CPA/CR + срок):
- ЦА и ключевые потребности:
- UTP + RTB (факты/доказательства):
- Посадочные страницы (ссылки) + что на них важно:
- Интенты (что ищут): 5–10 примеров запросов
- Негативные запросы/что исключать:
- Конкуренты (кого перехватываем):
- Офферы/промо:
- Ограничения (комплаенс/обещания/цены):`,

    creative: `- Бренд/продукт:
- Цель и KPI:
- ЦА (сегменты + инсайт):
- Big idea (1 предложение):
- UTP + RTB:
- Месседжи по сегментам (таблично/списком):
- Тональность/стиль:
- Must-have кадры/элементы:
- Запрещено/комплаенс:
- Примеры референсов (если есть):
- CTA и оффер:`
};

// Вставить шаблон в поле ввода
function insertTemplate(type) {
    if (typeof BriefForm !== 'undefined') {
        BriefForm.open(type);
    }
}

// Запуск генерации
async function startGeneration() {
    const taskInput = document.getElementById('taskInput');

    // Если открыта форма — берём данные из неё
    let brief;
    if (typeof BriefForm !== 'undefined' && BriefForm.isOpen) {
        brief = BriefForm.serialize();
    } else {
        brief = taskInput.value.trim();
    }

    if (!brief || brief.length < 10) {
        showNotification('Пожалуйста, заполните бриф подробнее (минимум 10 символов)', 'warning');
        return;
    }

    if (AppState.isGenerating) return;

    // Подтверждение: хотите добавить ещё информации?
    const confirmed = await showConfirm(
        'Хотите добавить ещё информации в бриф? Чем подробнее — тем лучше результат.',
        'Запуск генерации',
        false
    );

    if (!confirmed) return; // Нажали «Отмена» — дают доработать

    AppState.isGenerating = true;

    // Обновить UI кнопки
    const runBtn = document.querySelector('.run-btn');
    const originalText = runBtn.innerHTML;
    runBtn.disabled = true;
    runBtn.innerHTML = '<div class="loading"></div> Создаю отчёт...';

    try {


        // Собираем дополнительные поля
        const extra = {
            niche_product: document.getElementById('nicheInput')?.value?.trim() || null,
            target_audience: document.getElementById('audienceInput')?.value?.trim() || null,
            competitors: document.getElementById('competitorsInput')?.value?.trim() || null,
            geo: document.getElementById('geoInput')?.value?.trim() || null,
            content_language: document.getElementById('languageInput')?.value || null,
            tone: document.querySelector('.tone-chip.active')?.getAttribute('data-tone') || null
        };

        // Получаем токен авторизации
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');

        const response = await fetch('/api/reports/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                brief,
                mode: AppState.briefMode || 'full',
                extra,
                score: BriefChecker?.lastScore || null
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const reportId = data.reportId;
        const workflowId = data.workflowId;

        // === AUTO-SAVE PROJECT TO SIDEBAR + DATABASE ===
        const briefPreview = brief.substring(0, 60).replace(/\n/g, ' ').trim();
        const projectName = briefPreview || 'Новый отчёт';
        Storage.createProject({
            name: projectName,
            type: 'report',
            reportId: reportId,
            workflowId: workflowId || null,
            content: brief
        }).then(() => loadProjects());

        showNotification('🚀 Отчёт запущен! Открываем отчёт...', 'success');

        // Открываем отчёт внутри app shell (sidebar остаётся)
        setTimeout(() => {
            window.location.hash = 'report-' + reportId;
        }, 800);

        console.log('[Generation] Report created:', reportId, '→ Project saved to DB');

    } catch (error) {
        console.error('Generation Error:', error);
        showNotification('Ошибка: ' + (error.message || 'Неизвестная ошибка'), 'error');
    } finally {
        AppState.isGenerating = false;
        runBtn.disabled = false;
        runBtn.innerHTML = originalText;
    }
}

// Выбрать режим брифа
function selectBriefMode(element) {
    // Сбросить все чипы
    document.querySelectorAll('[data-mode]').forEach(chip => {
        chip.classList.remove('active');
    });

    // Активировать выбранный
    element.classList.add('active');
    AppState.briefMode = element.getAttribute('data-mode');
}
