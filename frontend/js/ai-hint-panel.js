/**
 * AiHintPanel — ИИ-продюсер panel below the brief form
 * Shows contextual hints, validation errors, and AI suggestions
 */
const AiHintPanel = {

    // ── State ──
    isActive: false,
    currentTemplate: null,   // 'newbrand' | 'scale' | 'creative' | 'audit'
    currentFieldId: null,
    panelEl: null,
    state: 'idle',           // 'idle' | 'loading' | 'ok' | 'error'
    _storageKey: 'ai-producer-enabled',

    isEnabled() {
        return true; // ИИ-продюсер всегда включён
    },

    _toggleEnabled() {
        const next = !this.isEnabled();
        localStorage.setItem(this._storageKey, next ? 'true' : 'false');
        if (next) {
            this._renderIdle();
        } else {
            this._renderOff();
            // Abort any pending request
            if (this._abortController) {
                this._abortController.abort();
                this._abortController = null;
            }
            clearTimeout(this._debounceTimer);
        }
        // Sync BriefChecker panel if it exists
        if (typeof BriefChecker !== 'undefined') {
            const scorePanel = document.getElementById('briefScorePanel');
            const btn = scorePanel?.querySelector('.ai-toggle-btn');
            if (next) {
                if (btn) { btn.classList.add('active'); btn.title = 'Отключить ИИ-продюсер'; }
            } else {
                if (btn) { btn.classList.remove('active'); btn.title = 'Включить ИИ-продюсер'; }
                if (scorePanel) { scorePanel.style.opacity = '0'; setTimeout(() => { scorePanel.style.display = 'none'; }, 400); }
            }
        }
    },

    // ── Debounce & Abort ──
    _debounceTimer: null,
    _debounceMs: 500,
    _abortController: null,

    // ── Metrics ──
    metrics: {
        requestCount: 0,
        errorCount: 0,
        applyCount: 0,
        latencies: []
    },

    // ═════════════════════════════════════════════
    //  INIT / DESTROY
    // ═════════════════════════════════════════════

    /**
     * Initialize the ИИ-продюсер panel for a specific template
     * @param {string} templateType - e.g. 'newbrand'
     */
    init(templateType) {
        this.currentTemplate = templateType;
        this.isActive = true;
        this.currentFieldId = null;
        this.state = 'idle';

        // Create panel element if not exists
        this._ensurePanel();

        if (this.isEnabled()) {
            this._renderIdle();
        } else {
            this._renderOff();
        }

        // Fade in with a tiny delay for CSS transition
        requestAnimationFrame(() => {
            if (this.panelEl) this.panelEl.classList.add('visible');
        });
    },

    /**
     * Tear down the panel
     */
    destroy() {
        this.isActive = false;
        this.currentTemplate = null;
        this.currentFieldId = null;

        // Abort any pending request
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        clearTimeout(this._debounceTimer);

        // Remove immediately
        if (this.panelEl) {
            this.panelEl.remove();
            this.panelEl = null;
        }
    },

    // ═════════════════════════════════════════════
    //  EVENT HANDLERS (called from brief-form.js)
    // ═════════════════════════════════════════════

    /**
     * Called when user focuses a field
     */
    onFieldFocus(fieldId) {
        if (!this.isActive || !this.currentTemplate) return;
        if (!this.isEnabled()) return;

        // Remove highlight from previous field
        if (this.currentFieldId) {
            const prev = document.querySelector(`.bf-field[data-field-id="${this.currentFieldId}"]`);
            if (prev) prev.classList.remove('ai-focus');
        }

        this.currentFieldId = fieldId;

        // Add highlight to current field
        const current = document.querySelector(`.bf-field[data-field-id="${fieldId}"]`);
        if (current) current.classList.add('ai-focus');

        // Get field meta from registry
        const meta = typeof FieldRegistry !== 'undefined'
            ? FieldRegistry.get(this.currentTemplate, fieldId)
            : null;

        // Fallback: even without registry entry, show a basic hint
        if (!meta) {
            const fieldEl = document.querySelector(`.bf-field[data-field-id="${fieldId}"]`);
            const label = fieldEl?.querySelector('.bf-label')?.textContent || fieldId;
            this._renderHint({
                severity: 'tip',
                title: label,
                message: 'Заполните это поле для лучшего результата.',
                examples: [], autofix: null, question: null
            });
            return;
        }

        if (!meta.hintOnFocus) {
            this._renderIdle();
            return;
        }

        // Get current value — handle different element types
        const inputEl = current?.querySelector('input, textarea, select');
        let value = '';
        if (inputEl) {
            if (inputEl.tagName === 'SELECT') {
                value = inputEl.value || '';
            } else {
                value = inputEl.value || '';
            }
        }
        // For chips: aggregate selected
        const chipsWrap = current?.querySelector('.bf-chips-wrap');
        if (chipsWrap) {
            value = Array.from(chipsWrap.querySelectorAll('.bf-chip.selected')).map(c => c.textContent).join(', ');
        }
        // For slider: get label
        const sliderLabel = current?.querySelector('.bf-slider-current');
        if (sliderLabel) {
            value = sliderLabel.textContent || '';
        }
        // For toggle: get state
        const toggle = current?.querySelector('.bf-toggle');
        if (toggle) {
            value = toggle.dataset.value === 'yes' ? 'Да' : 'Нет';
        }

        // If empty, show soft prompt immediately (no AI call)
        if (!value.trim()) {
            this._renderHint({
                severity: 'tip',
                title: meta.label,
                message: meta.placeholder || 'Заполните это поле для лучшего результата.',
                examples: [], autofix: null, question: null
            });
            return;
        }

        // Field has value — request hint only if llmHint is enabled
        if (meta.llmHint) {
            this._requestHint(fieldId, value);
        } else {
            // Rule-based only: run client validation, show ok
            this._showRuleBasedHint(meta, value);
        }
    },

    /**
     * Called when user types in a field (from input event)
     */
    onFieldInput(fieldId, value) {
        if (!this.isActive || !this.currentTemplate) return;
        if (fieldId !== this.currentFieldId) return; // Ignore stale events

        const meta = typeof FieldRegistry !== 'undefined'
            ? FieldRegistry.get(this.currentTemplate, fieldId)
            : null;

        if (!meta) return;

        // 1. Instant client validation (always, for all field types)
        if (typeof ClientValidation !== 'undefined' && meta.validators?.length) {
            const validation = ClientValidation.validate(value, meta.validators);
            if (validation.hasFormatError) {
                this._renderHint({
                    severity: 'error',
                    title: ClientValidation.getErrorMessage(validation.formatErrorCode),
                    message: validation.notes || 'Исправьте формат, чтобы AI мог дать подсказку.',
                    examples: [], autofix: null, question: null,
                    _isClientError: true
                });
                // Only request AI for friendly message if llmHint is on
                if (meta.llmHint) {
                    this._requestHint(fieldId, value, validation);
                }
                return;
            }

            // 1b. Handle warnings (e.g. budget missing currency/period)
            if (validation.hasWarning) {
                if (meta.llmHint) {
                    // Pass warning context to AI for follow-up questions
                    this._requestHint(fieldId, value, validation);
                } else {
                    // Show warning directly (no AI)
                    this._renderHint({
                        severity: 'warn',
                        title: ClientValidation.getErrorMessage(validation.warningCode),
                        message: validation.notes || 'Уточните данные для лучшего результата.',
                        examples: [], autofix: null, question: null
                    });
                }
                return;
            }
        }

        // 2. Two-level hint
        if (value.trim().length > 0) {
            if (meta.llmHint) {
                // Semantic field — debounced LLM call
                this._requestHint(fieldId, value);
            } else {
                // Structured field — rule-based hint only (instant)
                this._showRuleBasedHint(meta, value);
            }
        } else {
            // Field emptied — show placeholder hint
            this._renderHint({
                severity: 'tip',
                title: meta.label,
                message: meta.placeholder || 'Заполните это поле для лучшего результата.',
                examples: [], autofix: null, question: null
            });
        }
    },

    /**
     * Rule-based hint for non-LLM fields (chips, slider, toggle, URL, budget)
     * Runs clientValidation and shows green ok, warning, or format error
     */
    /**
     * PATCH (правка 47): degradedReason — причина, по которой ИИ-подсказка не сработала.
     * Раньше сбой бэкенда молча подменялся подсказкой по правилам и выглядел как «✓ Принято» —
     * пользователь думал, что его проверил ИИ. Теперь режим всегда виден.
     */
    _showRuleBasedHint(meta, value, degradedReason) {
        const degraded = !!degradedReason;
        const degradedNote = degraded
            ? `ИИ-подсказка недоступна (${degradedReason}). Показана проверка по правилам.`
            : '';
        // Run client validation
        if (typeof ClientValidation !== 'undefined' && meta.validators?.length) {
            const validation = ClientValidation.validate(value, meta.validators);
            if (validation.hasFormatError) {
                this._renderHint({
                    severity: 'error',
                    title: ClientValidation.getErrorMessage(validation.formatErrorCode),
                    message: [validation.notes || 'Проверьте формат.', degradedNote].filter(Boolean).join(' '),
                    examples: [], autofix: null, question: null,
                    _degraded: degraded
                });
                return;
            }
            // Show warning instead of ok if there are issues
            if (validation.hasWarning) {
                this._renderHint({
                    severity: 'warn',
                    title: ClientValidation.getErrorMessage(validation.warningCode),
                    message: [validation.notes || 'Уточните данные для лучшего результата.', degradedNote].filter(Boolean).join(' '),
                    examples: [], autofix: null, question: null,
                    _degraded: degraded
                });
                return;
            }
        }
        // Без ИИ нельзя писать «Принято» зелёным — это вводит в заблуждение (правка 47)
        if (degraded) {
            this._renderHint({
                severity: 'warn',
                title: `${meta.label} — проверка по правилам`,
                message: `Формат похож на корректный, но смысл не проверен. ${degradedNote}`,
                examples: [], autofix: null, question: null,
                _degraded: true
            });
            return;
        }
        // All good — show green ok
        this._renderHint({
            severity: 'ok',
            title: meta.label,
            message: '✓ Принято',
            examples: [], autofix: null, question: null
        });
    },

    // ═════════════════════════════════════════════
    //  AI REQUEST LOGIC
    // ═════════════════════════════════════════════

    _requestHint(fieldId, value, clientValidation) {
        // Abort previous request
        if (this._abortController) {
            this._abortController.abort();
        }
        clearTimeout(this._debounceTimer);

        this._debounceTimer = setTimeout(() => {
            this._fetchHint(fieldId, value, clientValidation);
        }, this._debounceMs);
    },

    async _fetchHint(fieldId, value, clientValidation) {
        // Double-check we're still on the same field
        if (fieldId !== this.currentFieldId || !this.isActive) return;

        const meta = typeof FieldRegistry !== 'undefined'
            ? FieldRegistry.get(this.currentTemplate, fieldId)
            : null;

        this._abortController = new AbortController();
        this.state = 'loading';
        this._renderLoading();
        this.metrics.requestCount++;

        // Build allFieldsSnapshot from current form
        const snapshot = this._buildSnapshot();

        const payload = {
            briefModule: this.currentTemplate,
            fieldKey: fieldId,
            fieldLabel: meta?.label || fieldId,
            fieldPlaceholder: meta?.placeholder || '',
            value: value || '',
            uiLang: 'ru',
            clientValidation: clientValidation || {
                isEmpty: !(value || '').trim(),
                hasFormatError: false,
                formatErrorCode: null,
                notes: ''
            },
            allFieldsSnapshot: snapshot
        };

        // Timeout: abort after 8 seconds to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (this._abortController) this._abortController.abort();
        }, 8000);

        try {
            const startTime = Date.now();
            // PATCH (правка 39): /api/ai/* теперь требует авторизацию — прокидываем токен
            const _token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/ai/brief-hint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(_token ? { 'Authorization': `Bearer ${_token}` } : {})
                },
                body: JSON.stringify(payload),
                signal: this._abortController.signal
            });

            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;
            this.metrics.latencies.push(latency);

            if (!response.ok) {
                // Backend unavailable — degrade to rule-based hint, но СКАЗАТЬ об этом (правка 47)
                this.metrics.errorCount++;
                this.state = 'error';
                console.warn('[ИИ-продюсер] brief-hint HTTP', response.status);
                if (fieldId === this.currentFieldId && meta) {
                    this._showRuleBasedHint(meta, value || '', `ответ сервера ${response.status}`);
                }
                return;
            }

            const data = await response.json();

            // Check we're still on the same field (user may have moved)
            if (fieldId !== this.currentFieldId) return;

            this.state = 'ok';
            this._renderHint(data);

        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError' && fieldId !== this.currentFieldId) return;

            this.metrics.errorCount++;
            this.state = 'error';
            console.warn('[ИИ-продюсер] Fallback to rule-based hint:', err.message);

            // Degradation с честной пометкой вместо молчаливой подмены (правка 47)
            if (fieldId === this.currentFieldId && meta) {
                const reason = err.name === 'AbortError' ? 'таймаут запроса' : (err.message || 'сетевая ошибка');
                this._showRuleBasedHint(meta, value || '', reason);
            }
        }
    },

    /**
     * Build a snapshot of all currently filled fields
     */
    _buildSnapshot() {
        const snapshot = {};
        const fields = document.querySelectorAll('.bf-field');
        fields.forEach(field => {
            const id = field.dataset.fieldId;
            if (!id) return;
            const input = field.querySelector('input, textarea');
            if (input) {
                snapshot[id] = input.value || '';
            }
        });
        return snapshot;
    },

    // ═════════════════════════════════════════════
    //  RENDERING
    // ═════════════════════════════════════════════

    _ensurePanel() {
        if (this.panelEl) return;

        this.panelEl = document.createElement('div');
        this.panelEl.id = 'aiHintPanel';
        this.panelEl.className = 'ai-hint-panel';

        // Insert after the brief form container (inline, not fixed)
        const briefContainer = document.getElementById('briefFormContainer');
        if (briefContainer && briefContainer.parentNode) {
            briefContainer.parentNode.insertBefore(this.panelEl, briefContainer.nextSibling);
        } else {
            // Fallback: insert after input-box
            const inputBox = document.querySelector('.input-box');
            if (inputBox) {
                inputBox.insertAdjacentElement('afterend', this.panelEl);
            } else {
                document.body.appendChild(this.panelEl);
            }
        }
    },

    // ── SVG icons (Lucide) ──
    _svgIcons: {
        producer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
        tip: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
        ok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        question: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75"/><circle cx="12" cy="12" r="9"/><path d="M12 17.25h.008v.008H12v-.008z"/></svg>',
        apply: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>',
        toggle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>'
    },

    _getToggleHtml() {
        // Кнопка выключения убрана — продюсер всегда активен
        return '';
    },

    _renderOff() {
        if (!this.panelEl) return;
        this.panelEl.innerHTML = `
            <div class="ai-hint-card ai-hint-idle" style="opacity: 0.5">
                <div class="ai-hint-header">
                    <span class="ai-hint-icon">${this._svgIcons.producer}</span>
                    <span class="ai-hint-title-text">ИИ-продюсер отключён</span>
                    ${this._getToggleHtml()}
                </div>
            </div>
        `;
    },

    _renderIdle() {
        if (!this.panelEl) return;
        this.panelEl.innerHTML = `
            <div class="ai-hint-card ai-hint-idle">
                <div class="ai-hint-header">
                    <span class="ai-hint-icon">${this._svgIcons.producer}</span>
                    <span class="ai-hint-title-text">ИИ-продюсер</span>
                    ${this._getToggleHtml()}
                </div>
                <p class="ai-hint-message">Выберите поле, чтобы получить подсказку.</p>
            </div>
        `;
    },

    _renderLoading() {
        if (!this.panelEl) return;
        this.panelEl.innerHTML = `
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

    _renderHint(data) {
        if (!this.panelEl) return;

        const severity = data.severity || 'tip';
        const icon = this._svgIcons[severity] || this._svgIcons.tip;

        let html = `
            <div class="ai-hint-card ai-hint-severity-${severity}">
                <div class="ai-hint-header">
                    <span class="ai-hint-icon">${icon}</span>
                    <span class="ai-hint-title-text">${data.title || 'ИИ-продюсер'}</span>
                    ${this._getToggleHtml()}

                </div>
                <p class="ai-hint-message">${this._escapeHtml(data.message || '')}</p>
        `;

        // Examples
        if (data.examples && data.examples.length > 0 && data.examples[0]) {
            html += `<div class="ai-hint-example">
                <span class="ai-hint-example-label">Пример:</span>
                <code>${this._escapeHtml(data.examples[0])}</code>
            </div>`;
        }

        // Question from AI
        if (data.question) {
            html += `<div class="ai-hint-question">
                <span class="ai-hint-question-icon">${this._svgIcons.question}</span>
                <span>${this._escapeHtml(data.question)}</span>
            </div>`;
        }

        // Autofix button
        if (data.autofix && data.autofix.suggestedValue) {
            html += `<button class="ai-hint-apply-btn" onclick="AiHintPanel.applySuggestion('${this._escapeAttr(data.autofix.suggestedValue)}')">
                ${this._svgIcons.apply} Применить: ${this._escapeHtml(data.autofix.explain || data.autofix.suggestedValue)}
            </button>`;
        }

        html += `</div>`;
        this.panelEl.innerHTML = html;
    },

    // ═════════════════════════════════════════════
    //  ACTIONS
    // ═════════════════════════════════════════════

    /**
     * Apply AI suggestion to the current field
     */
    applySuggestion(value) {
        if (!this.currentFieldId) return;

        const input = document.querySelector(`[data-field-id="${this.currentFieldId}"]`);
        if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA')) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            this.metrics.applyCount++;
        }

        // Show success state
        this._renderHint({
            severity: 'ok',
            title: 'Применено',
            message: 'Значение подставлено. Можете доработать по вкусу.',
            examples: [],
            autofix: null,
            question: null
        });
    },

    /**
     * Get metrics summary for logging
     */
    getMetrics() {
        const latencies = this.metrics.latencies;
        return {
            ...this.metrics,
            avgLatency: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
        };
    },

    // ── Helpers ──

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    _escapeAttr(text) {
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }
};
