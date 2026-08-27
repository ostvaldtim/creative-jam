/**
 * API MODULE
 * Р Р°Р±РѕС‚Р° СЃ РІРЅРµС€РЅРёРјРё API (OpenRouter Рё РґСЂСѓРіРёРµ)
 */

const API = {
    // Р‘Р°Р·РѕРІС‹Рµ URL
    OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',

    // РџРѕР»СѓС‡РёС‚СЊ API РєР»СЋС‡
    getApiKey() {
        const keys = Storage.getApiKeys();
        return keys.openrouter || null;
    },

    // РџСЂРѕРІРµСЂРёС‚СЊ РЅР°Р»РёС‡РёРµ API РєР»СЋС‡Р°
    hasApiKey() {
        return !!this.getApiKey();
    },

    // Р“РµРЅРµСЂР°С†РёСЏ РєРѕРЅС‚РµРЅС‚Р° С‡РµСЂРµР· OpenRouter
    async generateContent(prompt, type = 'strategy') {
        const apiKey = this.getApiKey();
        
        if (!apiKey) {
            throw new Error('API РєР»СЋС‡ РЅРµ РЅР°Р№РґРµРЅ. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РЅР°СЃС‚СЂРѕР№С‚Рµ РєР»СЋС‡ РІ РЅР°СЃС‚СЂРѕР№РєР°С….');
        }

        // Р’С‹Р±РѕСЂ РјРѕРґРµР»Рё РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ С‚РёРїР° Р·Р°РґР°С‡Рё
        const models = {
            strategy: 'anthropic/claude-3.5-sonnet',
            video: 'openai/gpt-4-turbo',
            content: 'anthropic/claude-3.5-sonnet'
        };

        const model = models[type] || models.strategy;

        // РЎРёСЃС‚РµРјРЅС‹Р№ РїСЂРѕРјРїС‚ РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ С‚РёРїР°
        const systemPrompts = {
            strategy: 'РўС‹ РѕРїС‹С‚РЅС‹Р№ РјР°СЂРєРµС‚РёРЅРіРѕРІС‹Р№ СЃС‚СЂР°С‚РµРі. РЎРѕР·РґР°Р№ РїРѕРґСЂРѕР±РЅСѓСЋ РјР°СЂРєРµС‚РёРЅРіРѕРІСѓСЋ СЃС‚СЂР°С‚РµРіРёСЋ РЅР° РѕСЃРЅРѕРІРµ РѕРїРёСЃР°РЅРёСЏ Р±СЂРµРЅРґР° РёР»Рё РїСЂРѕРґСѓРєС‚Р°.',
            video: 'РўС‹ РєСЂРµР°С‚РёРІРЅС‹Р№ РІРёРґРµРѕРїСЂРѕРґСЋСЃРµСЂ. РЎРѕР·РґР°Р№ РєРѕРЅС†РµРїС†РёСЋ РІРёРґРµРѕРєРѕРЅС‚РµРЅС‚Р° СЃ РѕРїРёСЃР°РЅРёРµРј СЃС†РµРЅ, С‚РµРєСЃС‚Р° Рё РІРёР·СѓР°Р»СЊРЅС‹С… СЌР»РµРјРµРЅС‚РѕРІ.',
            content: 'РўС‹ РїСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅС‹Р№ РєРѕРїРёСЂР°Р№С‚РµСЂ. РЎРѕР·РґР°Р№ РєР°С‡РµСЃС‚РІРµРЅРЅС‹Р№ С‚РµРєСЃС‚РѕРІС‹Р№ РєРѕРЅС‚РµРЅС‚ РґР»СЏ СЃРѕС†РёР°Р»СЊРЅС‹С… СЃРµС‚РµР№ Рё РјР°СЂРєРµС‚РёРЅРіРѕРІС‹С… РјР°С‚РµСЂРёР°Р»РѕРІ.'
        };

        try {
            const response = await fetch(this.OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'РљСЂРµР°С‚РёРІРЅС‹Р№ Р”Р¶РµРј'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompts[type]
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'РћС€РёР±РєР° РїСЂРё РіРµРЅРµСЂР°С†РёРё РєРѕРЅС‚РµРЅС‚Р°');
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // РџСЂРѕРІРµСЂРєР° Р±Р°Р»Р°РЅСЃР° OpenRouter (РµСЃР»Рё РґРѕСЃС‚СѓРїРЅРѕ)
    async checkBalance() {
        const apiKey = this.getApiKey();
        
        if (!apiKey) {
            return null;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Balance check error:', error);
        }

        return null;
    }
};
