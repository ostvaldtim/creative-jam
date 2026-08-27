/**
 * PROJECTS MODULE
 * CRUD операции с проектами в сайдбаре
 */

/**
 * PATCH (правка 40): проекты адресуются СТАБИЛЬНЫМ id, а не номером в массиве.
 * Раньше ссылка #project-2 после удаления соседнего проекта открывала чужой проект.
 * Все действия меню теперь принимают id; числовой индекс поддержан как legacy-fallback
 * (старые сохранённые ссылки и проекты без id).
 */
function projectRef(project, fallbackIndex) {
    if (project && project.id !== undefined && project.id !== null && String(project.id) !== '') {
        return String(project.id);
    }
    return String(fallbackIndex);
}

function resolveProjectIndex(ref) {
    const projects = Storage.getProjects();
    const key = String(ref);
    const byId = projects.findIndex(p => p && p.id !== undefined && String(p.id) === key);
    if (byId !== -1) return byId;
    // legacy: числовой индекс из старой ссылки
    if (/^\d+$/.test(key)) {
        const idx = parseInt(key, 10);
        if (projects[idx]) return idx;
    }
    return -1;
}

function getProjectByRef(ref) {
    const idx = resolveProjectIndex(ref);
    return idx === -1 ? null : Storage.getProjects()[idx];
}

window.projectRef = projectRef;
window.resolveProjectIndex = resolveProjectIndex;
window.getProjectByRef = getProjectByRef;

// Загрузить проекты
function loadProjects() {
    const projectsList = document.getElementById('projectsList');

    // Show skeleton loading state
    projectsList.innerHTML = `
        <div class="skeleton-project"><div class="skeleton skeleton-project__icon"></div><div class="skeleton-project__lines"><div class="skeleton skeleton-project__title"></div><div class="skeleton skeleton-project__date"></div></div></div>
        <div class="skeleton-project"><div class="skeleton skeleton-project__icon"></div><div class="skeleton-project__lines"><div class="skeleton skeleton-project__title" style="width:60%"></div><div class="skeleton skeleton-project__date" style="width:35%"></div></div></div>
        <div class="skeleton-project"><div class="skeleton skeleton-project__icon"></div><div class="skeleton-project__lines"><div class="skeleton skeleton-project__title" style="width:85%"></div><div class="skeleton skeleton-project__date"></div></div></div>
    `;

    // 1. Мгновенно рендерим из кеша/localStorage
    setTimeout(() => _renderProjects(), 100);

    // 2. Асинхронно загружаем из БД и обновляем UI
    Storage.loadProjectsFromDB().then(() => {
        _renderProjects();
    }).catch(() => { });
}

// Actual rendering logic (separated from loadProjects)
function _renderProjects() {
    const projects = Storage.getProjects();
    const projectsList = document.getElementById('projectsList');

    projectsList.innerHTML = '';

    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state-block empty-state-block--compact">
                <svg class="empty-state-block__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
                <div class="empty-state-block__title" style="color: var(--text);">Создайте первый проект</div>
                <div class="empty-state-block__subtitle" style="color: var(--text-2);">Начните работу с ИИ-продюсером</div>
            </div>
        `;
        return;
    }

    // Sort: pinned first, then by date
    const sortedProjects = projects.map((p, i) => ({ ...p, _origIndex: i }));
    sortedProjects.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });

    sortedProjects.forEach((project) => {
        const index = project._origIndex;
        const ref = projectRef(project, index);
        const isActive = window.location.hash === `#project-${ref}`;
        const item = document.createElement('div');
        item.className = 'project-item' + (isActive ? ' active' : '');
        item.setAttribute('data-index', index);
        item.setAttribute('data-ref', ref);
        item.innerHTML = `
            <div class="project-item-content" onclick="window.location.hash='project-${ref}'">
                <span class="project-name">${project.name}</span>
                ${project.pinned ? '<svg class="pin-indicator" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>' : ''}
            </div>
            <button class="project-menu-btn" onclick="event.stopPropagation(); toggleProjectMenu('${ref}', this)" title="Действия">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                </svg>
            </button>
        `;
        projectsList.appendChild(item);
    });
}

// Контекстное меню проекта
function toggleProjectMenu(refOrIndex, btn) {
    const isOpen = document.getElementById('activeProjectMenu');

    // Закрыть предыдущее
    closeAllProjectMenus();

    if (isOpen && isOpen.dataset.index === String(refOrIndex)) return;

    const index = resolveProjectIndex(refOrIndex);
    const projects = Storage.getProjects();
    const project = projects[index];
    if (!project) return;
    const ref = projectRef(project, index);

    // Создаём меню и добавляем в body (не внутрь sidebar)
    const menu = document.createElement('div');
    menu.id = 'activeProjectMenu';
    menu.dataset.index = ref;
    menu.className = 'project-context-menu show';
    menu.innerHTML = `
        <button class="context-menu-item" onclick="shareProject('${ref}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Поделиться
        </button>
        <button class="context-menu-item" onclick="renameProject('${ref}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
            </svg>
            Переименовать
        </button>
        <button class="context-menu-item" onclick="pinProject('${ref}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
            </svg>
            ${project.pinned ? 'Открепить' : 'Закрепить'}
        </button>
        <button class="context-menu-item" onclick="archiveProject('${ref}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            Архивировать
        </button>
        <div class="context-menu-divider"></div>
        <button class="context-menu-item context-menu-danger" onclick="deleteProject('${ref}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
            </svg>
            Удалить
        </button>
    `;
    document.body.appendChild(menu);

    // Позиционируем справа от кнопки (как ChatGPT)
    const rect = btn.getBoundingClientRect();
    const menuWidth = 200;

    let left = rect.right + 8;
    let top = rect.top;

    // Если не помещается справа — показываем слева
    if (left + menuWidth > window.innerWidth - 16) {
        left = rect.left - menuWidth - 8;
    }

    // Если не помещается снизу — выравниваем по нижний край
    const menuHeight = menu.offsetHeight;
    if (top + menuHeight > window.innerHeight - 8) {
        top = window.innerHeight - menuHeight - 8;
    }

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
}

function closeAllProjectMenus() {
    const existing = document.getElementById('activeProjectMenu');
    if (existing) existing.remove();
    // Также убираем старые inline-меню если есть
    document.querySelectorAll('.project-context-menu.show').forEach(m => m.classList.remove('show'));
}

// Закрываем при клике вне меню
document.addEventListener('click', function (e) {
    if (!e.target.closest('.project-menu-btn') && !e.target.closest('.project-context-menu')) {
        closeAllProjectMenus();
    }
});

// Переименовать проект (inline)
function renameProject(refOrIndex) {
    closeAllProjectMenus();
    const index = resolveProjectIndex(refOrIndex);
    const projects = Storage.getProjects();
    const project = projects[index];
    if (!project) return;

    const item = document.querySelector(`.project-item[data-index="${index}"]`);
    if (!item) return;

    const nameSpan = item.querySelector('.project-name');
    if (!nameSpan) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'project-rename-input';
    input.value = project.name;

    nameSpan.style.display = 'none';
    nameSpan.parentNode.insertBefore(input, nameSpan.nextSibling);
    input.focus();
    input.select();

    const menuBtn = item.querySelector('.project-menu-btn');
    if (menuBtn) menuBtn.style.display = 'none';

    function saveRename() {
        const newName = input.value.trim();
        if (newName && newName !== project.name) {
            project.name = newName;
            Storage.setProjects(projects);
            Storage.updateProject(project.id, { name: newName }); // DB persist
            if (typeof showNotification === 'function') {
                showNotification('Проект переименован', 'success');
            }
        }
        input.remove();
        nameSpan.style.display = '';
        nameSpan.textContent = project.name;
        if (menuBtn) menuBtn.style.display = '';
    }

    function cancelRename() {
        input.remove();
        nameSpan.style.display = '';
        if (menuBtn) menuBtn.style.display = '';
    }

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); saveRename(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
    });

    input.addEventListener('blur', saveRename);
}

// Закрепить / открепить проект
function pinProject(refOrIndex) {
    closeAllProjectMenus();
    const index = resolveProjectIndex(refOrIndex);
    const projects = Storage.getProjects();
    const project = projects[index];
    if (!project) return;

    project.pinned = !project.pinned;
    Storage.setProjects(projects);
    Storage.updateProject(project.id, { pinned: project.pinned }); // DB persist
    loadProjects();
    if (typeof showNotification === 'function') {
        showNotification(project.pinned ? 'Проект закреплён' : 'Проект откреплён', 'success');
    }
}

// Удалить проект
async function deleteProject(refOrIndex) {
    closeAllProjectMenus();
    const index = resolveProjectIndex(refOrIndex);
    const projects = Storage.getProjects();
    if (!projects[index]) return;
    const ref = projectRef(projects[index], index);

    if (await showConfirm(`Удалить проект «${projects[index].name}»?`, 'Удаление проекта', true)) {
        const projectId = projects[index].id;
        projects.splice(index, 1);
        Storage.setProjects(projects);
        Storage.removeProject(projectId); // DB delete
        loadProjects();

        if (window.location.hash === `#project-${ref}` || window.location.hash === `#project-${index}`) {
            window.location.hash = '';
        }
        if (typeof showNotification === 'function') {
            showNotification('Проект удалён', 'success');
        }
    }
}

// Поделиться проектом
function shareProject(refOrIndex) {
    closeAllProjectMenus();
    const index = resolveProjectIndex(refOrIndex);
    const projects = Storage.getProjects();
    const project = projects[index];
    if (!project) return;

    // Копируем ссылку в буфер (по стабильному id — не сломается после удаления соседнего)
    const url = `${window.location.origin}${window.location.pathname}#project-${projectRef(project, index)}`;
    navigator.clipboard.writeText(url).then(() => {
        if (typeof showNotification === 'function') {
            showNotification('Ссылка скопирована в буфер', 'success');
        }
    }).catch(() => {
        if (typeof showNotification === 'function') {
            showNotification('Не удалось скопировать ссылку', 'error');
        }
    });
}

// Архивировать проект
function archiveProject(refOrIndex) {
    closeAllProjectMenus();
    const index = resolveProjectIndex(refOrIndex);
    const projects = Storage.getProjects();
    const project = projects[index];
    if (!project) return;

    project.archived = true;
    Storage.setProjects(projects);
    Storage.updateProject(project.id, { archived: true }); // DB persist
    loadProjects();
    if (typeof showNotification === 'function') {
        showNotification('Проект архивирован', 'success');
    }
}

// Выбрать проект
function selectProject(project) {
    AppState.currentProject = project;

    // Обновить активный элемент
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Показать содержимое проекта
    showProjectContent(project);
}

// Показать содержимое проекта
function showProjectContent(project, index) {
    AppState.currentProject = project; // Ensure AppState is updated

    // Закрыть оверлеи если открыты
    if (window.OverlayManager && window.OverlayManager.activeModule) {
        window.OverlayManager.close();
    }

    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <div class="main-content-centerer">
        <div style="max-width: 800px; width: 100%;">
            <button onclick="backToDashboard()" style="margin-bottom: 20px; padding: 10px 20px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; color: var(--text-2); cursor: pointer;">
                ← Назад
            </button>
            
            <h2 style="font-size: 32px; margin-bottom: 12px;">${project.name}</h2>
            <p style="color: var(--text-3); margin-bottom: 24px;">
                Тип: ${project.type} • Создано: ${new Date(project.createdAt).toLocaleDateString('ru-RU')}
            </p>
            
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
                <h3 style="font-size: 18px; margin-bottom: 16px;">Результат генерации</h3>
                <div style="color: var(--text-2); line-height: 1.8; white-space: pre-wrap;">${project.content}</div>

                ${project.attachments && project.attachments.length > 0 ? `
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border);">
                        <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text-2);">Прикрепленные файлы:</h4>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            ${project.attachments.map(file => `
                                <div style="width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                                    <img src="${file.data}" alt="${file.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
        </div>
    `;

    // Обновить активный элемент в сайдбаре
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const projectItems = document.getElementById('projectsList').children;
    if (projectItems[index]) {
        projectItems[index].classList.add('active');
    }
}
