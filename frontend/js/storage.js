/**
 * STORAGE MODULE
 * Гибридное хранение: API (PostgreSQL) + localStorage (кеш/fallback)
 */

const Storage = {
    KEYS: {
        USER: 'user',
        PROJECTS: 'cj_projects',
        THEME: 'cj_theme',
        API_KEYS: 'cj_api_keys',
        USAGE: 'cj_usage'
    },

    // ═══════════════════════════════════════════
    // USER
    // ═══════════════════════════════════════════
    getUser() {
        const data = localStorage.getItem(this.KEYS.USER);
        return data ? JSON.parse(data) : null;
    },
    setUser(user) {
        localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
    },

    // ═══════════════════════════════════════════
    // API KEYS
    // ═══════════════════════════════════════════
    // PATCH (правка 42): ключи лежали в localStorage открытым текстом и переживали
    // закрытие браузера — любой сторонний скрипт или чужой человек за тем же
    // компьютером мог их забрать. Теперь ключи живут только в текущей вкладке
    // (sessionStorage) и стираются вместе с ней; старое хранилище одноразово переносится и чистится.
    getApiKeys() {
        try {
            const legacy = localStorage.getItem(this.KEYS.API_KEYS);
            if (legacy) {
                if (!sessionStorage.getItem(this.KEYS.API_KEYS)) {
                    sessionStorage.setItem(this.KEYS.API_KEYS, legacy);
                }
                localStorage.removeItem(this.KEYS.API_KEYS);
                console.warn('[Безопасность] API-ключи перенесены из постоянного хранилища в память вкладки.');
            }
            const data = sessionStorage.getItem(this.KEYS.API_KEYS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },
    setApiKeys(keys) {
        try {
            sessionStorage.setItem(this.KEYS.API_KEYS, JSON.stringify(keys));
            localStorage.removeItem(this.KEYS.API_KEYS);
        } catch (e) {
            console.warn('[Безопасность] Не удалось сохранить ключи:', e.message);
        }
    },

    // ══════════════════════════════════════════
    // PATCH (правки 3, 41): все запросы к /api/projects шли
    // БЕЗ Authorization, и проекты были общими для всех.
    // Теперь каждый запрос несёт Bearer-токен пользователя.
    // ══════════════════════════════════════════
    getToken() {
        const user = this.getUser();
        return (user && (user.token || user.accessToken)) || localStorage.getItem('token') || null;
    },

    authHeaders(extra = {}) {
        const token = this.getToken();
        return token ? { ...extra, 'Authorization': `Bearer ${token}` } : { ...extra };
    },

    // ═══════════════════════════════════════════
    // PROJECTS — Database-first, localStorage cache
    // ═══════════════════════════════════════════
    _projectsCache: null,
    _projectsLoaded: false,

    /**
     * Получить проекты (синхронно из кеша, асинхронно из БД)
     * Вызывающий код (projects.js) получает кеш мгновенно,
     * а loadProjectsFromDB() обновляет UI когда данные придут.
     */
    getProjects() {
        // Возвращаем кеш (localStorage) мгновенно
        if (this._projectsCache) return this._projectsCache;
        const data = localStorage.getItem(this.KEYS.PROJECTS);
        this._projectsCache = data ? JSON.parse(data) : [];
        return this._projectsCache;
    },

    setProjects(projects) {
        this._projectsCache = projects;
        localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(projects));
    },

    /**
     * Загрузить проекты из БД (async) и обновить кеш + UI
     */
    async loadProjectsFromDB() {
        try {
            const res = await fetch('/api/projects', { headers: this.authHeaders() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const dbProjects = await res.json();
            // Мержим: БД — source of truth
            this._projectsCache = dbProjects;
            localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(dbProjects));
            this._projectsLoaded = true;
            console.log(`[Storage] ✅ Loaded ${dbProjects.length} projects from DB`);
            return dbProjects;
        } catch (err) {
            console.warn('[Storage] ⚠️ DB unavailable, using localStorage:', err.message);
            return this.getProjects();
        }
    },

    /**
     * Создать проект (в БД + кеш)
     */
    async createProject(project) {
        // 1. Сразу в localStorage (мгновенный UI)
        const localProject = {
            id: Date.now(),
            name: project.name,
            type: project.type || 'report',
            reportId: project.reportId || null,
            workflowId: project.workflowId || null,
            content: project.content || '',
            createdAt: new Date().toISOString(),
            pinned: false,
            archived: false,
            ...project
        };
        const projects = this.getProjects();
        projects.unshift(localProject);
        this.setProjects(projects);

        // 2. Асинхронно в БД
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: this.authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    name: project.name,
                    type: project.type || 'report',
                    reportId: project.reportId || null,
                    workflowId: project.workflowId || null,
                    content: project.content || ''
                })
            });
            if (res.ok) {
                const dbProject = await res.json();
                // Заменяем временный ID на реальный из БД
                const idx = projects.findIndex(p => p.id === localProject.id);
                if (idx !== -1) {
                    projects[idx] = { ...projects[idx], id: dbProject.id };
                    this.setProjects(projects);
                }
                console.log(`[Storage] ✅ Project saved to DB: ${dbProject.id}`);
                return dbProject;
            }
        } catch (err) {
            console.warn('[Storage] ⚠️ DB save failed, project is in localStorage:', err.message);
        }

        return localProject;
    },

    /**
     * Обновить проект (rename, pin, archive)
     */
    async updateProject(id, updates) {
        // 1. Обновить в кеше
        const projects = this.getProjects();
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) {
            Object.assign(projects[idx], updates);
            this.setProjects(projects);
        }

        // 2. Асинхронно в БД
        try {
            await fetch(`/api/projects/${id}`, {
                method: 'PATCH',
                headers: this.authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.warn('[Storage] ⚠️ DB update failed:', err.message);
        }
    },

    /**
     * Удалить проект
     */
    async removeProject(id) {
        // 1. Из кеша
        const projects = this.getProjects().filter(p => p.id !== id);
        this.setProjects(projects);

        // 2. Из БД
        try {
            await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: this.authHeaders() });
        } catch (err) {
            console.warn('[Storage] ⚠️ DB delete failed:', err.message);
        }
    },

    // Legacy sync methods (kept for backward compat)
    addProject(project) {
        this.createProject(project); // fire-and-forget async
        return project;
    },
    deleteProject(id) {
        this.removeProject(id); // fire-and-forget async
    },

    // ═══════════════════════════════════════════
    // THEME
    // ═══════════════════════════════════════════
    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'dark';
    },
    setTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    // ═══════════════════════════════════════════
    // USAGE
    // ═══════════════════════════════════════════
    // PATCH (правка 42): расход запросов считался только в браузере (cj_usage) и обнулялся
    // очисткой хранилища — то есть лимит обходился в два клика, а по умолчанию ещё
    // и показывался выдуманный лимит 100. Теперь истина — на сервере (/api/user/usage),
    // а localStorage остаётся только кэшем для мгновенной отрисовки.
    getUsage() {
        const data = localStorage.getItem(this.KEYS.USAGE);
        return data ? JSON.parse(data) : { used: 0, total: 0, _stale: true };
    },
    updateUsage(used, total) {
        localStorage.setItem(this.KEYS.USAGE, JSON.stringify({ used, total }));
    },

    _authHeaders() {
        const token = localStorage.getItem('authToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    /** Забрать актуальный счёт с сервера и обновить кэш */
    async syncUsage() {
        try {
            const response = await fetch('/api/user/usage', { headers: this._authHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const used = Number(data.billing?.used ?? data.usage?.used ?? 0);
            const total = Number(data.billing?.limit ?? data.usage?.total ?? 0);
            this.updateUsage(used, total);
            return { used, total, billing: data.billing || null };
        } catch (e) {
            console.warn('[Учёт] Не удалось получить расход с сервера:', e.message);
            return null;
        }
    },

    /**
     * Списать один запуск. Решение принимает сервер: если лимит исчерпан,
     * возвращается { ok: false, limitReached: true } и запуск надо остановить.
     */
    async incrementUsage() {
        try {
            const response = await fetch('/api/user/usage/increment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this._authHeaders() }
            });
            const data = await response.json().catch(() => ({}));

            if (response.status === 403) {
                return { ok: false, limitReached: true, message: data.message || 'Лимит запусков исчерпан.' };
            }
            if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);

            const used = Number(data.usage?.used ?? 0);
            const total = Number(data.usage?.total ?? 0);
            this.updateUsage(used, total);
            return { ok: true, used, total, usage: { used, total } };
        } catch (e) {
            console.warn('[Учёт] Серверный учёт недоступен:', e.message);
            return { ok: false, offline: true, message: e.message };
        }
    },

    // ═══════════════════════════════════════════
    // CLEAR
    // ═══════════════════════════════════════════
    clear() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this._projectsCache = null;
        this._projectsLoaded = false;
    }
};
