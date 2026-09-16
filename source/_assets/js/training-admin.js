function app() {
    return window.upasApp || {};
}

function refreshIcons(scope) {
    if (typeof app().refreshIcons === 'function') {
        app().refreshIcons(scope);
        return;
    }
    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: scope || document });
    }
}

function showToast(message, tone = 'default') {
    if (typeof app().showAppToast === 'function') {
        app().showAppToast(message, tone);
        return;
    }
    window.alert(message);
}

function showConfirm(options) {
    if (typeof app().showAppConfirm === 'function') {
        return app().showAppConfirm(options);
    }
    return Promise.resolve(window.confirm(options.message || options.title || '確定？'));
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function readJson(id) {
    const el = document.getElementById(id);
    if (!el) {
        return null;
    }
    try {
        return JSON.parse(el.textContent);
    } catch (error) {
        console.warn('Unable to parse training data', error);
        return null;
    }
}

const STORE_KEY = 'upas-training';
const GROUP_ICONS = ['compass', 'cpu', 'presentation', 'badge-check', 'folder', 'book-open', 'graduation-cap', 'lightbulb'];
let LOCALES = ['TW'];

function setLocales(list) {
    const cleaned = (Array.isArray(list) ? list : []).map(String).filter(Boolean);
    if (cleaned.length) {
        LOCALES = cleaned;
    }
}

function baseLocale() {
    return LOCALES[0];
}

function activeLocale() {
    const current = typeof app().getPreviewLocale === 'function' ? app().getPreviewLocale() : baseLocale();
    return LOCALES.includes(current) ? current : baseLocale();
}

function toLocaleMap(value) {
    const map = {};
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        LOCALES.forEach((locale) => {
            const text = String(value[locale] ?? '').trim();
            if (text) {
                map[locale] = text;
            }
        });
        return map;
    }
    const text = String(value ?? '').trim();
    if (text) {
        map[baseLocale()] = text;
    }
    return map;
}

function pickLocale(map, locale) {
    if (!map) {
        return '';
    }
    return map[locale] || map[baseLocale()] || LOCALES.map((key) => map[key]).find(Boolean) || '';
}

function emptyStore() {
    return {
        groups: [],
        articles: [],
        deletedGroups: [],
        deletedArticles: [],
        groupsManaged: false,
        articlesManaged: false,
    };
}

function readStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        return {
            groups: Array.isArray(parsed.groups) ? parsed.groups : [],
            articles: Array.isArray(parsed.articles) ? parsed.articles : [],
            deletedGroups: Array.isArray(parsed.deletedGroups) ? parsed.deletedGroups.map(String) : [],
            deletedArticles: Array.isArray(parsed.deletedArticles) ? parsed.deletedArticles.map(String) : [],
            groupsManaged: Boolean(parsed.groupsManaged),
            articlesManaged: Boolean(parsed.articlesManaged),
        };
    } catch (error) {
        return emptyStore();
    }
}

function writeStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify({
        groups: store.groups || [],
        articles: store.articles || [],
        deletedGroups: store.deletedGroups || [],
        deletedArticles: store.deletedArticles || [],
        groupsManaged: Boolean(store.groupsManaged),
        articlesManaged: Boolean(store.articlesManaged),
    }));
}

function normalizeGroup(group) {
    const id = String(group?.id || group?.value || '').trim();
    if (!id) {
        return null;
    }
    const label = toLocaleMap(group.label ?? group.labels);
    if (!Object.keys(label).length) {
        label[baseLocale()] = id;
    }
    const icon = String(group.icon || 'folder').trim() || 'folder';
    return { id, label, icon };
}

function normalizeArticle(article, fallbackGroupId = '') {
    const id = String(article?.id || '').trim();
    if (!id) {
        return null;
    }
    return {
        id,
        groupId: String(article.groupId || article.group || fallbackGroupId || '').trim(),
        label: toLocaleMap(article.label ?? article.labels),
        title: toLocaleMap(article.title ?? article.titles),
        body: toLocaleMap(article.body ?? article.bodies),
    };
}

function flattenSeedCourses(courses) {
    const groups = [];
    const articles = [];
    (courses || []).forEach((course) => {
        const group = normalizeGroup({
            id: course.id,
            label: course.labels ?? course.label,
            icon: course.icon,
        });
        if (!group) {
            return;
        }
        groups.push(group);
        (course.articles || []).forEach((article) => {
            const normalized = normalizeArticle(article, group.id);
            if (normalized) {
                articles.push(normalized);
            }
        });
    });
    return { groups, articles };
}

function mergeGroups(seedGroups, stored) {
    const deleted = new Set((stored.deletedGroups || []).map(String));
    const storedGroups = Array.isArray(stored.groups) ? stored.groups : [];

    if (stored.groupsManaged) {
        const map = new Map();
        storedGroups.forEach((group) => {
            const normalized = normalizeGroup(group);
            if (normalized && !deleted.has(normalized.id)) {
                map.set(normalized.id, normalized);
            }
        });
        const ordered = [];
        storedGroups.forEach((group) => {
            const key = String(group?.id || '');
            if (map.has(key) && !ordered.some((entry) => entry.id === key)) {
                ordered.push(map.get(key));
            }
        });
        (seedGroups || []).forEach((group) => {
            const normalized = normalizeGroup(group);
            if (normalized && !deleted.has(normalized.id) && !map.has(normalized.id)) {
                ordered.push(normalized);
            }
        });
        return ordered;
    }

    const map = new Map();
    (seedGroups || []).forEach((group) => {
        const normalized = normalizeGroup(group);
        if (normalized && !deleted.has(normalized.id)) {
            map.set(normalized.id, normalized);
        }
    });
    storedGroups.forEach((group) => {
        const normalized = normalizeGroup(group);
        if (!normalized || deleted.has(normalized.id)) {
            return;
        }
        map.set(normalized.id, { ...(map.get(normalized.id) || {}), ...normalized, label: { ...(map.get(normalized.id)?.label || {}), ...normalized.label } });
    });
    return [...map.values()];
}

function mergeArticles(seedArticles, stored) {
    const deleted = new Set((stored.deletedArticles || []).map(String));
    const map = new Map();

    (seedArticles || []).forEach((article) => {
        const normalized = normalizeArticle(article);
        if (!normalized || deleted.has(normalized.id)) {
            return;
        }
        map.set(normalized.id, normalized);
    });

    (stored.articles || []).forEach((article) => {
        const normalized = normalizeArticle(article);
        if (!normalized || deleted.has(normalized.id)) {
            return;
        }
        const previous = map.get(normalized.id) || {};
        map.set(normalized.id, {
            ...previous,
            ...normalized,
            label: { ...(previous.label || {}), ...normalized.label },
            title: { ...(previous.title || {}), ...normalized.title },
            body: { ...(previous.body || {}), ...normalized.body },
        });
    });

    if (stored.articlesManaged) {
        const ordered = [];
        const seen = new Set();
        (stored.articles || []).forEach((article) => {
            const id = String(article?.id || '');
            if (!id || seen.has(id) || !map.has(id)) {
                return;
            }
            ordered.push(map.get(id));
            seen.add(id);
        });
        map.forEach((article, id) => {
            if (!seen.has(id)) {
                ordered.push(article);
            }
        });
        return ordered;
    }

    return [...map.values()];
}

function seedFrom(meta) {
    const flattened = flattenSeedCourses(meta.courses);
    return {
        capability: meta.capability || 'training.manage',
        createUrl: meta.createUrl || '',
        listUrl: meta.listUrl || '',
        articleUrl: meta.articleUrl || '',
        groups: flattened.groups,
        articles: flattened.articles,
        locales: meta.locales || LOCALES,
        copy: meta.copy || {},
    };
}

function trainingState(meta) {
    const seed = seedFrom(meta);
    const stored = readStore();
    const groups = mergeGroups(seed.groups, stored);
    const articles = mergeArticles(seed.articles, stored).filter((article) => (
        groups.some((group) => group.id === article.groupId)
    ));
    return {
        ...seed,
        locale: activeLocale(),
        groups,
        articles,
        stored,
    };
}

function articlesForGroup(state, groupId) {
    return state.articles.filter((article) => article.groupId === groupId);
}

function findArticle(meta, id) {
    if (!id) {
        return null;
    }
    return trainingState(meta).articles.find((article) => String(article.id) === String(id)) || null;
}

function slugFromLabel(label) {
    const ascii = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return ascii || `item-${Date.now().toString(36)}`;
}

function uniqueId(label, existing) {
    const used = new Set((existing || []).map(String));
    const base = slugFromLabel(label);
    if (!used.has(base)) {
        return base;
    }
    let index = 2;
    while (used.has(`${base}-${index}`)) {
        index += 1;
    }
    return `${base}-${index}`;
}

function persistGroups(seedGroups, groups) {
    const store = readStore();
    const current = (groups || []).map(normalizeGroup).filter(Boolean);
    const currentIds = new Set(current.map((group) => group.id));
    const seedIds = (seedGroups || []).map((group) => String(group.id));
    store.groups = current;
    store.groupsManaged = true;
    store.deletedGroups = seedIds.filter((id) => !currentIds.has(id));
    writeStore(store);
}

function upsertArticle(article) {
    const normalized = normalizeArticle(article);
    if (!normalized) {
        return;
    }
    const store = readStore();
    store.deletedArticles = store.deletedArticles.filter((id) => id !== normalized.id);

    if (store.articlesManaged) {
        const existingIndex = store.articles.findIndex((row) => String(row.id) === normalized.id);
        if (existingIndex >= 0) {
            const previousGroup = String(store.articles[existingIndex].groupId || '');
            store.articles[existingIndex] = normalized;
            if (previousGroup !== String(normalized.groupId)) {
                store.articles.splice(existingIndex, 1);
                insertArticleInGroupOrder(store.articles, normalized);
            }
        } else {
            insertArticleInGroupOrder(store.articles, normalized);
        }
    } else {
        store.articles = store.articles.filter((row) => String(row.id) !== normalized.id);
        store.articles.push(normalized);
    }
    writeStore(store);
}

function insertArticleInGroupOrder(list, article) {
    let insertAt = list.length;
    for (let index = list.length - 1; index >= 0; index -= 1) {
        if (String(list[index].groupId) === String(article.groupId)) {
            insertAt = index + 1;
            break;
        }
    }
    list.splice(insertAt, 0, article);
}

function persistArticlesOrder(meta, groupId, orderedIds) {
    const state = trainingState(meta);
    const byId = new Map(state.articles.map((article) => [String(article.id), article]));
    const wanted = (orderedIds || []).map(String);
    const seen = new Set();
    const result = [];

    state.groups.forEach((group) => {
        if (String(group.id) === String(groupId)) {
            wanted.forEach((id) => {
                const article = byId.get(id);
                if (!article || String(article.groupId) !== String(groupId) || seen.has(id)) {
                    return;
                }
                result.push(article);
                seen.add(id);
            });
            articlesForGroup(state, group.id).forEach((article) => {
                if (!seen.has(article.id)) {
                    result.push(article);
                    seen.add(article.id);
                }
            });
            return;
        }
        articlesForGroup(state, group.id).forEach((article) => {
            if (!seen.has(article.id)) {
                result.push(article);
                seen.add(article.id);
            }
        });
    });

    const store = readStore();
    store.articles = result;
    store.articlesManaged = true;
    writeStore(store);
}

function deleteArticle(id) {
    const key = String(id || '');
    if (!key) {
        return;
    }
    const store = readStore();
    store.articles = store.articles.filter((row) => String(row.id) !== key);
    if (!store.deletedArticles.includes(key)) {
        store.deletedArticles.push(key);
    }
    writeStore(store);
}

function applyPreviewRole() {
    if (typeof app().applyPreviewRole === 'function' && typeof app().getPreviewRole === 'function') {
        app().applyPreviewRole(app().getPreviewRole());
    }
}

function setFormSelectByValue(select, value) {
    if (!select) {
        return;
    }
    const menu = select._formMenu || select.querySelector('[data-form-select-menu]');
    const option = menu
        ? menu.querySelector(`[data-form-select-option][data-value="${CSS.escape(String(value))}"]`)
        : null;

    if (option && typeof app().setFormSelectValue === 'function') {
        app().setFormSelectValue(select, option);
        return;
    }

    const hidden = select.querySelector('[data-form-select-value]');
    const labelEl = select.querySelector('[data-form-select-label]');
    if (hidden) {
        hidden.value = value || '';
    }
    if (labelEl) {
        labelEl.textContent = option?.dataset.label || value || labelEl.textContent;
        labelEl.classList.toggle('is-placeholder', !value);
    }
}

function addSelectOption(select, value, label) {
    if (!select) {
        return null;
    }
    const menu = select._formMenu || select.querySelector('[data-form-select-menu]');
    if (!menu) {
        return null;
    }
    const existing = menu.querySelector(`[data-form-select-option][data-value="${CSS.escape(String(value))}"]`);
    if (existing) {
        existing.dataset.label = label;
        existing.textContent = label;
        return existing;
    }

    const wrap = menu.querySelector('[data-form-select-options]') || menu;
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'form-select-option';
    option.setAttribute('role', 'option');
    option.setAttribute('data-form-select-option', '');
    option.dataset.value = value;
    option.dataset.label = label;
    option.textContent = label;
    wrap.appendChild(option);
    option.addEventListener('click', () => {
        if (typeof app().setFormSelectValue === 'function') {
            app().setFormSelectValue(select, option);
        }
        if (typeof app().closeFormSelects === 'function') {
            app().closeFormSelects();
        }
    });
    return option;
}

function replaceSelectOptions(select, groups, selectedValue, locale) {
    if (!select) {
        return;
    }
    const menu = select._formMenu || select.querySelector('[data-form-select-menu]');
    const wrap = menu?.querySelector('[data-form-select-options]') || menu;
    if (!wrap) {
        return;
    }
    wrap.querySelectorAll('[data-form-select-option]').forEach((option) => option.remove());
    (groups || []).forEach((group) => {
        addSelectOption(select, group.id, pickLocale(group.label, locale));
    });
    const nextValue = (groups || []).some((group) => String(group.id) === String(selectedValue))
        ? selectedValue
        : (groups[0]?.id || '');
    setFormSelectByValue(select, nextValue);
}

function cloneGroups(list) {
    return (list || []).map((group) => {
        const normalized = normalizeGroup(group);
        return normalized
            ? { id: normalized.id, icon: normalized.icon, label: { ...normalized.label } }
            : null;
    }).filter(Boolean);
}

function openGroupManager({ meta, selectedValue = '', onChange }) {
    document.querySelector('[data-category-manager-host]')?.remove();

    const host = document.createElement('div');
    host.className = 'app-modal-host';
    host.setAttribute('data-category-manager-host', '');
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'category-manager-title');
    const base = baseLocale();

    host.innerHTML = `
        <div class="app-modal-backdrop" data-category-manager-dismiss></div>
        <div class="app-modal-panel category-manager-panel">
            <div class="self-stretch inline-flex items-start justify-between gap-3">
                <div class="min-w-0 flex flex-col gap-1">
                    <h3 id="category-manager-title" class="text-cb1 text-gray5">管理分類</h3>
                    <p class="text-cb3 text-gray3">可新增、重新命名、調整分類順序或刪除。名稱需逐語系填寫，未填的語系會顯示 ${escapeHtml(base)} 名稱。</p>
                </div>
                <button type="button" class="icon-action -mt-1 -mr-1" data-category-manager-dismiss aria-label="關閉">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="locale-tabs" role="tablist" aria-label="編輯語系" data-category-locale-tabs>
                ${LOCALES.map((locale) => `
                    <button type="button" class="locale-tab" role="tab" data-category-locale="${escapeHtml(locale)}" aria-selected="false">
                        <span>${escapeHtml(locale)}</span>
                        <span class="locale-tab-dot" data-locale-incomplete hidden aria-hidden="true"></span>
                    </button>
                `).join('')}
            </div>
            <div class="category-manager-list" data-category-manager-list></div>
            <div class="self-stretch flex flex-col gap-2">
                <button type="button" class="btn-dashed w-full" data-category-add-open>
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>新增分類</span>
                </button>
                <div class="self-stretch flex flex-col gap-2" data-category-add-panel hidden>
                    <div class="self-stretch flex flex-col md:flex-row md:items-center gap-2">
                        <input type="text" class="form-input" data-category-add-label placeholder="輸入 ${escapeHtml(base)} 分類名稱" maxlength="20">
                        <div class="inline-flex items-center gap-2 shrink-0">
                            <button type="button" class="btn-primary px-4" data-category-add-confirm>加入</button>
                            <button type="button" class="btn-secondary px-4" data-category-add-cancel>取消</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="self-stretch inline-flex items-center justify-end gap-2 pt-1">
                <button type="button" class="btn-secondary" data-category-manager-dismiss>取消</button>
                <button type="button" class="btn-primary" data-category-manager-save>完成</button>
            </div>
        </div>
    `;

    const seed = seedFrom(meta);
    const draft = cloneGroups(trainingState(meta).groups);
    const listEl = host.querySelector('[data-category-manager-list]');
    const addPanel = host.querySelector('[data-category-add-panel]');
    const addInput = host.querySelector('[data-category-add-label]');
    let editLocale = LOCALES.includes(activeLocale()) ? activeLocale() : base;
    let dragIndex = -1;

    const close = () => {
        host.classList.remove('is-open');
        document.removeEventListener('keydown', onKeyDown);
        window.setTimeout(() => host.remove(), 200);
    };

    const onKeyDown = (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        event.preventDefault();
        if (addPanel && !addPanel.hidden) {
            closeAddPanel();
            return;
        }
        close();
    };

    const closeAddPanel = () => {
        if (addPanel) addPanel.hidden = true;
        if (addInput) addInput.value = '';
        addInput?.classList.remove('form-error');
    };

    const articleCount = (groupId) => trainingState(meta).articles.filter((article) => article.groupId === groupId).length;
    const baseName = (group) => group.label[base] || group.id;
    const duplicateName = (label, exceptId = '') => draft.some((group) => (
        String(group.label[editLocale] || '').trim() === label && String(group.id) !== String(exceptId)
    ));

    const syncLocaleTabs = () => {
        host.querySelectorAll('[data-category-locale]').forEach((tab) => {
            const locale = tab.dataset.categoryLocale;
            const active = locale === editLocale;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            const incomplete = locale !== base && draft.some((group) => !String(group.label[locale] || '').trim());
            const dot = tab.querySelector('[data-locale-incomplete]');
            if (dot) {
                dot.hidden = !incomplete;
            }
        });
    };

    const render = () => {
        listEl.replaceChildren();
        syncLocaleTabs();

        if (!draft.length) {
            const empty = document.createElement('div');
            empty.className = 'list-empty';
            empty.textContent = '尚未建立分類';
            listEl.appendChild(empty);
            refreshIcons(host);
            return;
        }

        draft.forEach((group, index) => {
            const name = baseName(group);
            const localeName = String(group.label[editLocale] || '');
            const untranslated = editLocale !== base && !localeName.trim();
            const row = document.createElement('div');
            row.className = `category-manager-row${untranslated ? ' is-untranslated' : ''}`;
            row.setAttribute('data-category-row', '');
            row.dataset.index = String(index);
            row.innerHTML = `
                <button type="button" class="category-manager-handle" data-category-handle aria-label="拖曳排序 ${escapeHtml(name)}">
                    <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                </button>
                <input
                    type="text"
                    class="form-input"
                    data-category-name
                    maxlength="20"
                    value="${escapeHtml(localeName)}"
                    placeholder="${escapeHtml(untranslated ? name : '')}"
                    aria-label="${escapeHtml(`${name} 的 ${editLocale} 名稱`)}"
                >
                <div class="inline-flex items-center shrink-0">
                    <button type="button" class="icon-action" data-category-move="-1" aria-label="上移" ${index === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-up" class="w-4 h-4"></i>
                    </button>
                    <button type="button" class="icon-action" data-category-move="1" aria-label="下移" ${index === draft.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </button>
                    <button type="button" class="icon-action" data-category-delete aria-label="刪除 ${escapeHtml(name)}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            listEl.appendChild(row);
        });
        refreshIcons(host);
        bindRowEvents();
    };

    const moveGroup = (from, to) => {
        if (from === to || from < 0 || to < 0 || from >= draft.length || to >= draft.length) {
            return;
        }
        const [moved] = draft.splice(from, 1);
        draft.splice(to, 0, moved);
        render();
    };

    const bindRowEvents = () => {
        listEl.querySelectorAll('[data-category-row]').forEach((row) => {
            const index = Number(row.dataset.index);
            const input = row.querySelector('[data-category-name]');
            const handle = row.querySelector('[data-category-handle]');

            input?.addEventListener('pointerdown', () => {
                row.draggable = false;
            });
            input?.addEventListener('input', () => {
                const label = input.value.trim();
                if (label) {
                    draft[index].label[editLocale] = label;
                } else if (editLocale !== base) {
                    delete draft[index].label[editLocale];
                }
            });
            input?.addEventListener('blur', () => {
                const label = input.value.trim();
                if (!label) {
                    input.classList.remove('form-error');
                    if (editLocale === base) {
                        draft[index].label[base] = input.defaultValue;
                        input.value = input.defaultValue;
                        return;
                    }
                    delete draft[index].label[editLocale];
                    render();
                    return;
                }
                if (duplicateName(label, draft[index].id)) {
                    input.classList.add('form-error');
                    showToast('此分類已存在', 'error');
                    input.value = draft[index].label[editLocale] || '';
                    return;
                }
                input.classList.remove('form-error');
                draft[index].label[editLocale] = label;
                syncLocaleTabs();
            });

            row.querySelector('[data-category-move="-1"]')?.addEventListener('click', () => moveGroup(index, index - 1));
            row.querySelector('[data-category-move="1"]')?.addEventListener('click', () => moveGroup(index, index + 1));
            row.querySelector('[data-category-delete]')?.addEventListener('click', async () => {
                if (draft.length <= 1) {
                    showToast('至少需保留一個分類', 'error');
                    return;
                }
                const group = draft[index];
                const name = baseName(group);
                const count = articleCount(group.id);
                const ok = await showConfirm({
                    title: '刪除分類',
                    message: count
                        ? `「${escapeHtml(name)}」尚有 ${count} 篇文章。刪除分類後這些文章也會一併刪除，且無法復原。`
                        : `確定刪除「${escapeHtml(name)}」？各語系名稱會一起移除。`,
                    confirmLabel: '刪除',
                    cancelLabel: '取消',
                    danger: true,
                });
                if (!ok) {
                    return;
                }
                draft.splice(index, 1);
                render();
            });

            handle?.addEventListener('pointerdown', () => {
                row.draggable = true;
            });
            row.addEventListener('dragstart', (event) => {
                if (!row.draggable) {
                    event.preventDefault();
                    return;
                }
                dragIndex = index;
                row.classList.add('is-dragging');
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(index));
            });
            row.addEventListener('dragend', () => {
                dragIndex = -1;
                row.draggable = false;
                listEl.querySelectorAll('[data-category-row]').forEach((item) => {
                    item.classList.remove('is-dragging', 'is-drop-target');
                });
            });
            row.addEventListener('dragover', (event) => {
                event.preventDefault();
                if (dragIndex < 0 || dragIndex === index) {
                    return;
                }
                row.classList.add('is-drop-target');
            });
            row.addEventListener('dragleave', () => {
                row.classList.remove('is-drop-target');
            });
            row.addEventListener('drop', (event) => {
                event.preventDefault();
                row.classList.remove('is-drop-target');
                if (dragIndex < 0 || dragIndex === index) {
                    return;
                }
                moveGroup(dragIndex, index);
            });
        });
    };

    host.querySelectorAll('[data-category-locale]').forEach((tab) => {
        tab.addEventListener('click', () => {
            editLocale = tab.dataset.categoryLocale;
            closeAddPanel();
            render();
        });
    });

    host.querySelector('[data-category-add-open]')?.addEventListener('click', () => {
        if (addPanel) addPanel.hidden = false;
        addInput?.focus();
    });
    host.querySelector('[data-category-add-cancel]')?.addEventListener('click', closeAddPanel);
    addInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            host.querySelector('[data-category-add-confirm]')?.click();
        }
    });
    host.querySelector('[data-category-add-confirm]')?.addEventListener('click', () => {
        const label = addInput?.value.trim() || '';
        if (!label) {
            addInput?.classList.add('form-error');
            showToast('請輸入分類名稱', 'error');
            return;
        }
        if (draft.some((group) => String(group.label[base] || '').trim() === label)) {
            addInput?.classList.add('form-error');
            showToast('此分類已存在', 'error');
            return;
        }
        draft.push({
            id: uniqueId(label, draft.map((group) => group.id)),
            icon: GROUP_ICONS[draft.length % GROUP_ICONS.length] || 'folder',
            label: { [base]: label },
        });
        closeAddPanel();
        render();
    });

    host.addEventListener('click', (event) => {
        if (event.target.closest('[data-category-manager-dismiss]')) {
            close();
        }
    });

    host.querySelector('[data-category-manager-save]')?.addEventListener('click', () => {
        const cleaned = [];
        for (const group of draft) {
            const label = {};
            LOCALES.forEach((locale) => {
                const text = String(group.label[locale] || '').trim();
                if (text) {
                    label[locale] = text;
                }
            });
            if (!label[base]) {
                editLocale = base;
                render();
                showToast(`請先填寫 ${base} 分類名稱`, 'error');
                return;
            }
            if (cleaned.some((entry) => entry.label[base] === label[base])) {
                showToast('分類名稱不可重複', 'error');
                return;
            }
            cleaned.push({
                id: group.id,
                icon: group.icon || 'folder',
                label,
            });
        }
        if (!cleaned.length) {
            showToast('至少需保留一個分類', 'error');
            return;
        }

        const removed = trainingState(meta).groups.filter((group) => (
            !cleaned.some((entry) => entry.id === group.id)
        ));
        removed.forEach((group) => {
            trainingState(meta).articles
                .filter((article) => article.groupId === group.id)
                .forEach((article) => deleteArticle(article.id));
        });

        persistGroups(seed.groups, cleaned);
        const nextSelected = cleaned.some((group) => group.id === selectedValue)
            ? selectedValue
            : cleaned[0]?.id || '';
        onChange?.(cleaned, nextSelected);
        close();
        showToast('已更新分類', 'success');
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(host);
    render();
    requestAnimationFrame(() => host.classList.add('is-open'));
}

function bindGroupManager(openBtn, meta, { select, getLocale, onChange } = {}) {
    openBtn?.addEventListener('click', () => {
        if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
            showToast('目前身分權限無法管理分類', 'error');
            return;
        }
        openGroupManager({
            meta,
            selectedValue: select?.querySelector('[data-form-select-value]')?.value || '',
            onChange: (groups, selectedValue) => {
                if (select) {
                    replaceSelectOptions(select, groups, selectedValue, getLocale ? getLocale() : activeLocale());
                }
                onChange?.(groups, selectedValue);
            },
        });
    });
}

function canManageTraining(meta) {
    return typeof app().roleCan !== 'function' || app().roleCan(meta.capability);
}

function bindArticleReorder(listEl, meta, groupId, onChange) {
    if (!listEl || listEl.dataset.reorderBound === 'true') {
        return;
    }
    listEl.dataset.reorderBound = 'true';
    let dragRow = null;

    const rows = () => [...listEl.querySelectorAll('[data-training-article-row]')];

    const clearDragState = () => {
        rows().forEach((row) => {
            row.classList.remove('is-dragging', 'is-drop-target');
            row.draggable = false;
        });
        dragRow = null;
    };

    const persistFromDom = () => {
        const orderedIds = rows().map((row) => row.dataset.articleId).filter(Boolean);
        persistArticlesOrder(meta, groupId, orderedIds);
        onChange?.();
        showToast('已更新文章順序', 'success');
    };

    listEl.addEventListener('pointerdown', (event) => {
        const handle = event.target.closest('[data-training-article-handle]');
        if (!handle || !listEl.contains(handle)) {
            return;
        }
        if (!canManageTraining(meta)) {
            return;
        }
        const row = handle.closest('[data-training-article-row]');
        if (row) {
            row.draggable = true;
        }
    });

    listEl.addEventListener('click', (event) => {
        if (event.target.closest('[data-training-article-handle]')) {
            event.preventDefault();
            event.stopPropagation();
        }
    });

    listEl.addEventListener('dragstart', (event) => {
        const row = event.target.closest('[data-training-article-row]');
        if (!row || !listEl.contains(row) || !row.draggable) {
            event.preventDefault();
            return;
        }
        dragRow = row;
        row.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', row.dataset.articleId || '');
    });

    listEl.addEventListener('dragend', () => {
        clearDragState();
    });

    listEl.addEventListener('dragover', (event) => {
        const row = event.target.closest('[data-training-article-row]');
        if (!dragRow || !row || !listEl.contains(row) || row === dragRow) {
            return;
        }
        event.preventDefault();
        rows().forEach((item) => item.classList.toggle('is-drop-target', item === row));
    });

    listEl.addEventListener('dragleave', (event) => {
        const row = event.target.closest('[data-training-article-row]');
        if (row && !row.contains(event.relatedTarget)) {
            row.classList.remove('is-drop-target');
        }
    });

    listEl.addEventListener('drop', (event) => {
        const row = event.target.closest('[data-training-article-row]');
        if (!dragRow || !row || !listEl.contains(row) || row === dragRow) {
            clearDragState();
            return;
        }
        event.preventDefault();
        const all = rows();
        const from = all.indexOf(dragRow);
        const to = all.indexOf(row);
        if (from < 0 || to < 0 || from === to) {
            clearDragState();
            return;
        }
        if (from < to) {
            row.after(dragRow);
        } else {
            row.before(dragRow);
        }
        clearDragState();
        persistFromDom();
    });
}

function syncTrainingList(root, meta) {
    const state = trainingState(meta);
    const host = root.querySelector('[data-training-cards]');
    if (!host) {
        return;
    }

    host.replaceChildren();
    state.groups.forEach((group) => {
        const articles = articlesForGroup(state, group.id);
        const first = articles[0];
        const groupLabel = pickLocale(group.label, state.locale);
        const section = document.createElement('section');
        section.className = 'h-full p-6 bg-white rounded-[24px] shadow-card flex flex-col gap-5 min-w-0 text-left';
        section.dataset.trainingGroupCard = group.id;
        const sortable = articles.length > 1;

        const articleItems = articles.length
            ? articles.map((article) => {
                const label = pickLocale(article.label, state.locale) || pickLocale(article.title, state.locale) || article.id;
                const translated = state.locale === baseLocale() || Boolean(article.title?.[state.locale] || article.label?.[state.locale]);
                return `
                    <li
                        class="training-article-row border-b border-gray1 last:border-b-0"
                        data-training-article-row
                        data-article-id="${escapeHtml(article.id)}"
                    >
                        ${sortable ? `
                            <button
                                type="button"
                                class="training-article-handle"
                                data-training-article-handle
                                data-requires="training.manage"
                                aria-label="拖曳排序 ${escapeHtml(label)}"
                            >
                                <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                        <a
                            href="${escapeHtml(meta.articleUrl)}#${escapeHtml(article.id)}"
                            class="group training-article-link flex items-center justify-between gap-3 py-2 text-cb3 text-gray5 hover:text-brand2 transition-colors duration-300"
                        >
                            <span class="min-w-0 truncate">
                                ${escapeHtml(label)}
                                ${!translated ? '<span class="badge-untranslated" data-requires="training.manage">未翻譯</span>' : ''}
                            </span>
                            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 shrink-0 text-gray3 group-hover:text-brand2 transition-colors duration-300"></i>
                        </a>
                    </li>
                `;
            }).join('')
            : '<li class="py-2 text-cb3 text-gray3">尚無文章</li>';

        section.innerHTML = `
            <div class="inline-flex items-center gap-3 min-w-0">
                <div class="size-12 rounded-full bg-brand2/85 border border-brand2 text-white inline-flex items-center justify-center shrink-0" aria-hidden="true">
                    <i data-lucide="${escapeHtml(group.icon || 'folder')}" class="w-5 h-5"></i>
                </div>
                <h2 class="min-w-0 text-ch5 text-gray5">${escapeHtml(groupLabel)}</h2>
            </div>
            <ul class="training-article-list flex flex-col list-none m-0 p-0" data-training-article-list>${articleItems}</ul>
            <div class="mt-auto pt-5 border-t border-gray1 flex items-center justify-between gap-3">
                <p class="text-cb3 text-gray3">${articles.length} 篇文章</p>
                ${first ? `<a class="btn-primary text-cb3" href="${escapeHtml(meta.articleUrl)}#${escapeHtml(first.id)}">開始閱讀</a>` : ''}
            </div>
        `;
        host.appendChild(section);
        if (sortable) {
            bindArticleReorder(section.querySelector('[data-training-article-list]'), meta, group.id, () => {
                const firstRow = section.querySelector('[data-training-article-row]');
                const startLink = section.querySelector('a.btn-primary');
                if (firstRow?.dataset.articleId && startLink && meta.articleUrl) {
                    startLink.href = `${meta.articleUrl}#${firstRow.dataset.articleId}`;
                }
            });
        }
    });

    applyPreviewRole();
    refreshIcons(host);
}

async function handleArticleDelete(event, root, meta) {
    const deleteBtn = event.target.closest('[data-training-delete]');
    if (!deleteBtn || !root.contains(deleteBtn)) {
        return;
    }
    event.preventDefault();
    if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
        showToast('目前身分權限無法刪除資料', 'error');
        return;
    }

    const id = deleteBtn.dataset.trainingDelete;
    const article = findArticle(meta, id);
    const title = (article ? pickLocale(article.title, baseLocale()) || pickLocale(article.label, baseLocale()) : '') || id;
    const ok = await showConfirm({
        title: '刪除文章',
        message: `確定刪除「${escapeHtml(title)}」？三個語系的內容都會一併刪除，且無法復原。`,
        confirmLabel: '刪除',
        cancelLabel: '取消',
        danger: true,
    });
    if (!ok) {
        return;
    }
    deleteArticle(id);
    showToast('已刪除文章', 'success');
    window.location.href = meta.listUrl || '../';
}

function bindTrainingList(root) {
    const meta = readJson('training-catalog-data');
    if (!meta) {
        return;
    }
    meta.capability = root.dataset.manage || meta.capability || 'training.manage';
    meta.createUrl = root.dataset.createUrl || meta.createUrl || '';
    meta.articleUrl = root.dataset.articleUrl || meta.articleUrl || '';
    meta.listUrl = root.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    syncTrainingList(root, meta);
    bindGroupManager(root.querySelector('[data-manage-categories]'), meta, {
        onChange: () => syncTrainingList(root, meta),
    });
    document.addEventListener('upas:localechange', () => syncTrainingList(root, meta));
}

function syncTrainingReader(root, meta) {
    const state = trainingState(meta);
    const tree = root.querySelector('[data-training-tree]');
    const panelHost = root.querySelector('[data-training-panels]');
    if (!tree || !panelHost) {
        return;
    }

    const currentHash = (location.hash || '').replace('#', '');
    const preferredId = currentHash
        || root.querySelector('[data-training-link].is-active')?.dataset.trainingLink
        || state.articles[0]?.id
        || '';

    tree.replaceChildren();
    panelHost.replaceChildren();

    state.groups.forEach((group, groupIndex) => {
        const articles = articlesForGroup(state, group.id);
        const groupLabel = pickLocale(group.label, state.locale);
        const li = document.createElement('li');
        const open = articles.some((article) => article.id === preferredId) || (!preferredId && groupIndex === 0);
        const sortable = articles.length > 1;
        li.className = `training-tree-group${open ? ' is-open' : ''}`;
        li.dataset.trainingGroup = group.id;
        li.innerHTML = `
            <button type="button" class="training-tree-toggle" data-training-group-toggle aria-expanded="${open ? 'true' : 'false'}">
                <span class="flex-1 min-w-0" data-training-group-label>${escapeHtml(groupLabel)}</span>
                <i data-lucide="chevron-down" class="training-tree-caret"></i>
            </button>
            <div class="training-tree-children">
                <div class="training-tree-children-clip">
                    <ul class="training-tree-children-inner" data-training-article-list></ul>
                </div>
            </div>
        `;
        const childList = li.querySelector('[data-training-article-list]');
        articles.forEach((article) => {
            const label = pickLocale(article.label, state.locale) || pickLocale(article.title, state.locale) || article.id;
            const child = document.createElement('li');
            child.className = 'training-tree-child training-article-row';
            child.setAttribute('data-training-article-row', '');
            child.dataset.articleId = article.id;
            child.innerHTML = `
                ${sortable ? `
                    <button
                        type="button"
                        class="training-article-handle"
                        data-training-article-handle
                        data-requires="training.manage"
                        aria-label="拖曳排序 ${escapeHtml(label)}"
                    >
                        <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                    </button>
                ` : ''}
                <a href="#${escapeHtml(article.id)}" class="training-tree-link training-article-link" data-training-link="${escapeHtml(article.id)}">
                    ${escapeHtml(label)}
                </a>
            `;
            childList.appendChild(child);

            const panel = document.createElement('article');
            panel.className = 'flex flex-col';
            panel.dataset.trainingPanel = article.id;
            panel.hidden = true;
            panel.innerHTML = `
                <div class="px-5 py-6 md:px-10 md:py-9">
                    <div class="self-stretch w-full flex items-start justify-between gap-3 mb-5">
                        <h1 class="text-ch4 text-gray5 min-w-0 flex-1">${escapeHtml(pickLocale(article.title, state.locale) || label)}</h1>
                        <div class="inline-flex items-center shrink-0 ml-auto" data-requires="training.manage">
                            <a
                                href="${escapeHtml(meta.createUrl)}?id=${encodeURIComponent(article.id)}"
                                class="icon-action"
                                aria-label="編輯 ${escapeHtml(label)}"
                            >
                                <i data-lucide="square-pen" class="w-4 h-4"></i>
                            </a>
                            <button
                                type="button"
                                class="icon-action"
                                data-training-delete="${escapeHtml(article.id)}"
                                aria-label="刪除 ${escapeHtml(label)}"
                            >
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <div class="richtext">${pickLocale(article.body, state.locale) || '<p class="text-gray3">尚無內容</p>'}</div>
                </div>
            `;
            panelHost.appendChild(panel);
        });
        tree.appendChild(li);
        if (sortable) {
            bindArticleReorder(childList, meta, group.id, () => {
                // keep current panel; only list order changed
            });
        }
    });

    applyPreviewRole();
    refreshIcons(root);

    if (typeof root._trainingShowArticle === 'function') {
        root._trainingShowArticle(preferredId || state.articles[0]?.id, { updateHash: Boolean(currentHash) });
    } else if (typeof app().bindTrainingCenter === 'function') {
        delete root.dataset.trainingBound;
        app().bindTrainingCenter(root);
    }
}

function bindTrainingReader(root) {
    const meta = readJson('training-catalog-data');
    if (!meta) {
        return;
    }
    meta.capability = root.dataset.manage || meta.capability || 'training.manage';
    meta.createUrl = root.dataset.createUrl || meta.createUrl || '';
    meta.articleUrl = root.dataset.articleUrl || meta.articleUrl || '';
    meta.listUrl = root.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    syncTrainingReader(root, meta);
    bindGroupManager(root.querySelector('[data-manage-categories]'), meta, {
        onChange: () => syncTrainingReader(root, meta),
    });
    root.addEventListener('click', (event) => handleArticleDelete(event, root, meta));
    document.addEventListener('upas:localechange', () => syncTrainingReader(root, meta));
}

function emptySlice() {
    return { label: '', title: '', body: '' };
}

function readLocaleSlice(form) {
    return {
        label: form.querySelector('[name="label"]')?.value.trim() || '',
        title: form.querySelector('[name="title"]')?.value.trim() || '',
        body: form.querySelector('[name="body"]')?.value || '',
    };
}

function applyLocaleSlice(form, slice) {
    const labelInput = form.querySelector('[name="label"]');
    const titleInput = form.querySelector('[name="title"]');
    const bodyInput = form.querySelector('[name="body"]');
    if (labelInput) labelInput.value = slice.label || '';
    if (titleInput) titleInput.value = slice.title || '';
    if (bodyInput) bodyInput.value = slice.body || '';
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
}

function sliceHasContent(slice) {
    return Boolean(slice.label || slice.title || String(slice.body || '').trim());
}

function collectArticle(form, currentId, draft) {
    const label = {};
    const title = {};
    const body = {};
    LOCALES.forEach((locale) => {
        const slice = draft[locale] || emptySlice();
        if (slice.label) label[locale] = slice.label;
        if (slice.title) title[locale] = slice.title;
        if (String(slice.body || '').trim()) body[locale] = slice.body;
    });
    return {
        id: currentId || uniqueId(label[baseLocale()] || title[baseLocale()] || 'article', trainingState({ courses: [] }).articles.map((item) => item.id)),
        groupId: form.querySelector('[name="group"]')?.value.trim() || '',
        label,
        title,
        body,
    };
}

function validateShared(form) {
    let valid = true;
    const groupValue = form.querySelector('[name="group"]')?.value || '';
    const trigger = form.querySelector('[name="group"]')?.closest('[data-form-select]')?.querySelector('[data-form-select-trigger]');
    if (trigger) {
        trigger.classList.toggle('form-error', !groupValue);
    }
    if (!groupValue) valid = false;
    return valid;
}

function validateLocaleSlice(slice, { required }) {
    const errors = [];
    if (required && !slice.label) errors.push('label');
    if (required && !slice.title) errors.push('title');
    if (required && !String(slice.body || '').trim()) errors.push('body');
    return errors;
}

function markLocaleErrors(form, errors) {
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
    if (errors.includes('label')) form.querySelector('[name="label"]')?.classList.add('form-error');
    if (errors.includes('title')) form.querySelector('[name="title"]')?.classList.add('form-error');
    if (errors.includes('body')) form.querySelector('[name="body"]')?.classList.add('form-error');
}

function setView(form, toolbar, missing, forbidden, mode) {
    if (form) form.hidden = mode !== 'form';
    if (toolbar) toolbar.hidden = mode !== 'form';
    if (missing) missing.hidden = mode !== 'missing';
    if (forbidden) forbidden.hidden = mode !== 'forbidden';
}

function bindTrainingForm(form) {
    const meta = readJson('training-catalog-data');
    if (!meta) {
        return;
    }
    meta.capability = form.dataset.manage || meta.capability || 'training.manage';
    meta.createUrl = form.dataset.createUrl || meta.createUrl || '';
    meta.articleUrl = form.dataset.articleUrl || meta.articleUrl || '';
    meta.listUrl = form.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    const base = baseLocale();
    const toolbar = document.querySelector('[data-training-form-toolbar]');
    const missing = document.querySelector('[data-training-missing]');
    const forbidden = document.querySelector('[data-training-forbidden]');
    const crumb = document.querySelector('[data-training-form-crumb]');
    const heading = document.querySelector('[data-page-heading]');
    const copy = meta.copy || {};
    const editingId = new URLSearchParams(window.location.search).get('id') || '';

    const applyAccess = () => {
        const allowed = typeof app().roleCan !== 'function' || app().roleCan(meta.capability);
        if (!allowed) {
            setView(form, toolbar, missing, forbidden, 'forbidden');
            if (crumb) crumb.textContent = copy.headingNew || '新增文章';
            return false;
        }
        return true;
    };

    if (!applyAccess()) {
        document.addEventListener('upas:rolechange', () => {
            if (applyAccess()) {
                window.location.reload();
            }
        });
        return;
    }

    let current = null;
    if (editingId) {
        current = findArticle(meta, editingId);
        if (!current) {
            setView(form, toolbar, missing, forbidden, 'missing');
            if (crumb) crumb.textContent = copy.headingEdit || '編輯文章';
            return;
        }
    }

    setView(form, toolbar, missing, forbidden, 'form');

    const state = trainingState(meta);
    const groupSelect = form.querySelector('[name="group"]')?.closest('[data-form-select]');
    const draft = {};
    LOCALES.forEach((locale) => {
        draft[locale] = {
            label: current?.label?.[locale] || '',
            title: current?.title?.[locale] || '',
            body: current?.body?.[locale] || '',
        };
    });

    let editLocale = LOCALES.includes(activeLocale()) ? activeLocale() : base;

    const renderGroupOptions = () => {
        const selected = form.querySelector('[name="group"]')?.value || '';
        replaceSelectOptions(groupSelect, trainingState(meta).groups, selected, editLocale);
    };

    const syncLocaleTabs = () => {
        form.querySelectorAll('[data-form-locale]').forEach((tab) => {
            const locale = tab.dataset.formLocale;
            const active = locale === editLocale;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            const dot = tab.querySelector('[data-locale-incomplete]');
            if (dot) {
                const slice = locale === editLocale ? readLocaleSlice(form) : (draft[locale] || emptySlice());
                dot.hidden = locale === base || Boolean(slice.title || slice.label);
            }
        });
        form.querySelectorAll('[data-locale-name]').forEach((el) => {
            el.textContent = editLocale;
        });
        form.querySelectorAll('[data-locale-fallback-hint]').forEach((el) => {
            el.hidden = editLocale === base;
        });
    };

    const switchLocale = (locale) => {
        if (!LOCALES.includes(locale) || locale === editLocale) {
            return;
        }
        draft[editLocale] = readLocaleSlice(form);
        editLocale = locale;
        applyLocaleSlice(form, draft[editLocale]);
        renderGroupOptions();
        syncLocaleTabs();
    };

    form.querySelectorAll('[data-form-locale]').forEach((tab) => {
        tab.addEventListener('click', () => switchLocale(tab.dataset.formLocale));
    });
    form.querySelector('[name="title"]')?.addEventListener('input', syncLocaleTabs);
    form.querySelector('[name="label"]')?.addEventListener('input', syncLocaleTabs);

    bindGroupManager(form.querySelector('[data-manage-categories]'), meta, {
        select: groupSelect,
        getLocale: () => editLocale,
    });

    renderGroupOptions();

    if (current) {
        form.querySelector('[name="id"]').value = current.id;
        setFormSelectByValue(groupSelect, current.groupId || '');
        if (heading) heading.textContent = copy.headingEdit || '編輯文章';
        if (crumb) crumb.textContent = copy.headingEdit || '編輯文章';
        const submitLabel = form.querySelector('[data-training-submit-label]');
        if (submitLabel) submitLabel.textContent = copy.submitEdit || '儲存變更';
        const asideTitle = form.querySelector('[data-training-aside-title]');
        if (asideTitle) asideTitle.textContent = copy.asideEdit || '儲存變更';
    } else {
        setFormSelectByValue(groupSelect, state.groups[0]?.id || '');
        if (heading) heading.textContent = copy.headingNew || '新增文章';
        if (crumb) crumb.textContent = copy.headingNew || '新增文章';
    }

    applyLocaleSlice(form, draft[editLocale]);
    syncLocaleTabs();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
            showToast('目前身分權限無法管理此資料', 'error');
            return;
        }

        draft[editLocale] = readLocaleSlice(form);

        if (!validateShared(form)) {
            form.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('請先完成必填欄位', 'error');
            return;
        }

        for (const locale of LOCALES) {
            const slice = draft[locale];
            const required = locale === base;
            if (!required && !sliceHasContent(slice)) {
                continue;
            }
            const errors = validateLocaleSlice(slice, { required });
            if (!errors.length) {
                continue;
            }
            switchLocale(locale);
            markLocaleErrors(form, errors);
            form.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast(required ? `請先完成 ${base} 的必填欄位` : `${locale} 尚有未填欄位`, 'error');
            return;
        }

        const existingIds = trainingState(meta).articles.map((item) => item.id);
        const article = collectArticle(form, current?.id || '', draft);
        if (!current) {
            article.id = uniqueId(article.label[base] || article.title[base] || 'article', existingIds);
        }
        upsertArticle(article);
        showToast(current ? (copy.savedEdit || '已儲存變更') : (copy.savedNew || '已發布文章'), 'success');
        const articleUrl = form.dataset.articleUrl || meta.articleUrl || '../article/';
        window.location.href = `${articleUrl}#${encodeURIComponent(article.id)}`;
    });

    document.addEventListener('upas:rolechange', () => applyAccess());
    document.addEventListener('upas:localechange', (event) => {
        switchLocale(event.detail?.locale);
    });
}

document.querySelectorAll('[data-training-overview]').forEach(bindTrainingList);
document.querySelectorAll('[data-training-center]').forEach(bindTrainingReader);
document.querySelectorAll('[data-training-form]').forEach(bindTrainingForm);
