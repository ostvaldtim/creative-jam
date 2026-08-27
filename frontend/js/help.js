const helpData = [
    {
        question: "Как войти через VK ID или Google?",
        answer: "На экране входа выберите соответствующую кнопку социальной сети. Если у вас уже есть аккаунт с этим email, они автоматически объединятся."
    },
    {
        question: "Как работают тарифы?",
        answer: "У нас есть бесплатный Trial для тестов и платные тарифы Pro/Start для регулярной работы. Подробнее в разделе «Тарифы и оплата»."
    },
    {
        question: "Безопасны ли мои данные?",
        answer: "Мы используем сквозное шифрование. Ваши проекты и загруженные файлы доступны только вам и вашей команде."
    },
    {
        question: "Как создать новый проект?",
        answer: "Нажмите оранжевую кнопку «Новый проект» в левом меню, введите название бренда и следуйте инструкциям AI-ассистента."
    },
    {
        question: "Куда сохраняется результат?",
        answer: "Все сгенерированные стратегии и креативы сохраняются в разделе «Проекты». Вы можете вернуться к ним в любое время."
    }
];

function initHelpSystem() {
    const container = document.getElementById('faqContainer');
    const searchInput = document.getElementById('helpSearchInput');

    if (!container || !searchInput) return;

    // Render initial list
    renderFAQ(helpData);

    // Search listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = helpData.filter(item =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        );
        renderFAQ(filtered);
    });
}

function renderFAQ(items) {
    const container = document.getElementById('faqContainer');
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state-block" style="padding: 32px 20px;">
                <svg class="empty-state-block__icon" style="width:48px;height:48px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
                <div class="empty-state-block__title">Ничего не найдено</div>
                <div class="empty-state-block__subtitle">Попробуйте другой запрос</div>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'faq-item';
        el.innerHTML = `
            <div class="faq-question">
                ${item.question}
                <svg class="faq-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="faq-answer">${item.answer}</div>
        `;

        // Toggle logic
        el.addEventListener('click', () => {
            el.classList.toggle('active');
        });

        container.appendChild(el);
    });
}

// Initialize when overlay opens or DOM ready (since it's a separate file, we can hook into window load or just run)
// Better to export or just run if deferred
document.addEventListener('DOMContentLoaded', initHelpSystem);

// Also expose for manual init if needed
window.initHelpSystem = initHelpSystem;
