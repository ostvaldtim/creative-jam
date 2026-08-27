/**
 * ClientValidation — instant client-side validators for brief fields
 * Runs BEFORE AI hint requests to catch format errors immediately
 */
const ClientValidation = {

    /**
     * Validate a field value against its registered validators
     * @param {string} value - current field value
     * @param {string[]} validators - array like ['url'], ['minLen:10'], ['budget']
     * @returns {{ isEmpty: boolean, hasFormatError: boolean, formatErrorCode: string|null, notes: string, hasWarning: boolean, warningCode: string|null }}
     */
    validate(value, validators = []) {
        const trimmed = (value || '').trim();
        const result = {
            isEmpty: trimmed.length === 0,
            hasFormatError: false,
            formatErrorCode: null,
            notes: '',
            hasWarning: false,
            warningCode: null
        };

        if (result.isEmpty) return result;

        for (const v of validators) {
            if (v === 'url') {
                const urlResult = this._validateUrl(trimmed);
                if (urlResult) {
                    result.hasFormatError = true;
                    result.formatErrorCode = urlResult;
                    break;
                }
            } else if (v === 'urlList') {
                const urlListResult = this._validateUrlList(trimmed);
                if (urlListResult) {
                    result.hasFormatError = true;
                    result.formatErrorCode = urlListResult;
                    break;
                }
            } else if (v === 'email') {
                if (!this._validateEmail(trimmed)) {
                    result.hasFormatError = true;
                    result.formatErrorCode = 'EMAIL_INVALID';
                    break;
                }
            } else if (v === 'budget') {
                const budgetResult = this._validateBudget(trimmed);
                if (budgetResult.error) {
                    result.hasFormatError = true;
                    result.formatErrorCode = budgetResult.error;
                    break;
                }
                if (budgetResult.warning) {
                    result.hasWarning = true;
                    result.warningCode = budgetResult.warning;
                    result.notes = budgetResult.notes || '';
                    // Don't break — warnings don't block
                }
            } else if (v.startsWith('minLen:')) {
                const min = parseInt(v.split(':')[1], 10);
                if (trimmed.length < min) {
                    result.hasFormatError = true;
                    result.formatErrorCode = 'TOO_SHORT';
                    result.notes = `Минимум ${min} символов, сейчас ${trimmed.length}`;
                    break;
                }
            }
        }

        return result;
    },

    /**
     * Validate a single URL
     * @returns {string|null} error code or null if valid
     */
    _validateUrl(value) {
        // Quick check: if it looks nothing like a URL (no dot, no protocol)
        const hasDot = value.includes('.');
        const hasProtocol = /^https?:\/\//i.test(value);

        // Pure garbage with no dot and no protocol → not a URL
        if (!hasDot && !hasProtocol) {
            return 'URL_NOT_URL';
        }

        // Has spaces in what looks like a URL attempt → invalid
        if (value.includes(' ') && (hasDot || hasProtocol)) {
            return 'URL_INVALID';
        }

        // Has a dot but no protocol → suggest adding https://
        if (hasDot && !hasProtocol) {
            // Check if it looks like a domain (e.g. site.com, vk.com/brand)
            const domainPattern = /^[a-zA-Z0-9а-яА-ЯёЁ][a-zA-Z0-9а-яА-ЯёЁ.-]*\.[a-zA-Zа-яА-ЯёЁ]{2,}/;
            if (domainPattern.test(value)) {
                return 'URL_SUGGEST_SCHEME'; // Soft: suggest https://
            }
            return null; // Partially typed, don't flag yet
        }

        // Has protocol → validate strictly
        if (hasProtocol) {
            try {
                new URL(value);
                return null; // Valid URL
            } catch {
                return 'URL_INVALID';
            }
        }

        return null;
    },

    /**
     * Validate a list of URLs (comma, newline, or space-separated)
     * Used for "Конкуренты" field
     * @returns {string|null} error code or null
     */
    _validateUrlList(value) {
        // Split by commas, newlines, or multiple spaces
        const items = value.split(/[,\n]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (items.length === 0) return null;

        for (const item of items) {
            const hasDot = item.includes('.');
            const hasProtocol = /^https?:\/\//i.test(item);

            // If it doesn't look like a URL at all
            if (!hasDot && !hasProtocol) {
                return 'URL_LIST_INVALID';
            }

            // If has protocol, validate
            if (hasProtocol) {
                try {
                    new URL(item);
                } catch {
                    return 'URL_LIST_INVALID';
                }
            }
        }

        return null;
    },

    _validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },

    /**
     * Validate budget field — checks number format, currency, and period
     * @returns {{ error: string|null, warning: string|null, notes: string }}
     */
    _validateBudget(value) {
        const result = { error: null, warning: null, notes: '' };

        // Check if there are any digits at all
        const hasDigits = /\d/.test(value);
        if (!hasDigits) {
            result.error = 'BUDGET_NOT_NUMBER';
            return result;
        }

        // Check for currency indicators (broadened list)
        const hasCurrency = /[₽$€£¥₺]|руб|rub|usd|eur|usdt|btc|eth|долл|евро|euro|тенге|uah|byn|lari|gel|som|сум/i.test(value);

        // Check for period/horizon indicators
        const hasPeriod = /\/(мес|квартал|год|нед)|в\s*мес|в\s*квартал|в\s*год|разово|на\s*\d+\s*(мес|квартал)|ежемес|month|quarter|year/i.test(value);

        // Generate appropriate warnings
        if (!hasCurrency && !hasPeriod) {
            result.warning = 'BUDGET_INCOMPLETE';
            result.notes = 'Не указаны валюта и период';
        } else if (!hasCurrency) {
            result.warning = 'BUDGET_NO_CURRENCY';
            result.notes = 'Не указана валюта';
        } else if (!hasPeriod) {
            result.warning = 'BUDGET_NO_PERIOD';
            result.notes = 'Не указан период';
        }

        return result;
    },

    /**
     * Get human-readable error message for a format error code
     * @param {string} code
     * @returns {string}
     */
    getErrorMessage(code) {
        const messages = {
            'URL_MISSING_SCHEME': 'Добавьте https:// в начало ссылки',
            'URL_INVALID': 'Некорректный URL — проверьте формат ссылки',
            'URL_NOT_URL': 'Введите корректную ссылку, например: https://site.com',
            'URL_SUGGEST_SCHEME': 'Добавьте https:// — например: https://site.com',
            'URL_LIST_INVALID': 'Введите ссылки через запятую, например: https://site1.com, https://site2.com',
            'EMAIL_INVALID': 'Некорректный email — проверьте формат',
            'BUDGET_NOT_NUMBER': 'Укажите бюджет числом (например: 500 000)',
            'BUDGET_NO_CURRENCY': 'Укажите валюту (например: рублей, долларов, USDT)',
            'BUDGET_NO_PERIOD': 'Укажите период: /мес, /квартал, разово',
            'BUDGET_INCOMPLETE': 'Укажите валюту и период (например: 150 000 / мес)',
            'TOO_SHORT': 'Слишком коротко — добавьте подробностей'
        };
        return messages[code] || 'Проверьте формат ввода';
    },

    /**
     * Get severity for a warning code (used by AI hint panel)
     * @param {string} code
     * @returns {'warn'|'error'}
     */
    getWarningSeverity(code) {
        // Budget warnings are soft — they don't block, but should prompt AI follow-up
        if (code && code.startsWith('BUDGET_')) return 'warn';
        return 'error';
    }
};
