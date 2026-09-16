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
        console.warn('Unable to parse catalog data', error);
        return null;
    }
}

function storeKey(kind) {
    return `upas-catalog-${kind}`;
}

function emptyStore() {
    return { items: [], categories: [], deleted: [], deletedCategories: [], categoriesManaged: false };
}

function readStore(kind) {
    try {
        const parsed = JSON.parse(localStorage.getItem(storeKey(kind)) || '{}');
        return {
            items: Array.isArray(parsed.items) ? parsed.items : [],
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            deleted: Array.isArray(parsed.deleted) ? parsed.deleted.map(String) : [],
            deletedCategories: Array.isArray(parsed.deletedCategories) ? parsed.deletedCategories.map(String) : [],
            categoriesManaged: Boolean(parsed.categoriesManaged),
        };
    } catch (error) {
        return emptyStore();
    }
}

function writeStore(kind, store) {
    localStorage.setItem(storeKey(kind), JSON.stringify({
        items: store.items || [],
        categories: store.categories || [],
        deleted: store.deleted || [],
        deletedCategories: store.deletedCategories || [],
        categoriesManaged: Boolean(store.categoriesManaged),
    }));
}

function seedFrom(meta) {
    return {
        kind: meta.kind || 'product',
        capability: meta.capability || 'product.manage',
        categories: Array.isArray(meta.categories) ? meta.categories : [],
        items: Array.isArray(meta.items) ? meta.items : [],
        formats: Array.isArray(meta.formats) ? meta.formats : [],
        createUrl: meta.createUrl || '',
        listUrl: meta.listUrl || '',
        copy: meta.copy || {},
    };
}

/* ---------- 語系：TW 為基準語系，其他語系未填時回退顯示 TW ---------- */
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

function normalizeCategory(cat) {
    const value = String(cat?.value || '').trim();
    if (!value) {
        return null;
    }

    const label = toLocaleMap(cat.label ?? cat.tabLabel ?? cat.labels);
    if (!Object.keys(label).length) {
        label[baseLocale()] = value;
    }

    return { value, label };
}

function mergeCategories(seed, stored) {
    const deleted = new Set((stored.deletedCategories || []).map(String));
    const storedCats = Array.isArray(stored.categories) ? stored.categories : [];

    if (stored.categoriesManaged) {
        const map = new Map();
        storedCats.forEach((cat) => {
            const normalized = normalizeCategory(cat);
            if (normalized && !deleted.has(normalized.value)) {
                map.set(normalized.value, normalized);
            }
        });
        const ordered = [];
        storedCats.forEach((cat) => {
            const key = String(cat?.value || '');
            if (map.has(key) && !ordered.some((entry) => entry.value === key)) {
                ordered.push(map.get(key));
            }
        });
        (seed || []).forEach((cat) => {
            const normalized = normalizeCategory(cat);
            if (normalized && !deleted.has(normalized.value) && !map.has(normalized.value)) {
                ordered.push(normalized);
            }
        });
        return ordered;
    }

    const map = new Map();
    (seed || []).forEach((cat) => {
        const normalized = normalizeCategory(cat);
        if (normalized && !deleted.has(normalized.value)) {
            map.set(normalized.value, normalized);
        }
    });
    storedCats.forEach((cat) => {
        const normalized = normalizeCategory(cat);
        if (!normalized || deleted.has(normalized.value)) {
            return;
        }
        map.set(normalized.value, { ...(map.get(normalized.value) || {}), ...normalized });
    });
    return [...map.values()];
}

function normalizeAsset(src) {
    if (!src) {
        return null;
    }

    const declared = Boolean(src.attachment || src.attachmentName || src.attachmentUrl);
    if (!declared) {
        return null;
    }

    return {
        attachment: src.attachment === 'link' ? 'link' : 'download',
        attachmentName: String(src.attachmentName || '').trim(),
        attachmentSize: String(src.attachmentSize || '').trim(),
        attachmentType: String(src.attachmentType || '').trim(),
        attachmentUrl: String(src.attachmentUrl || '').trim(),
        format: String(src.format || '').trim(),
    };
}

/* 附件實際有內容（檔名或網址），用於判斷翻譯完成度與表單驗證 */
function hasAsset(asset) {
    if (!asset) {
        return false;
    }
    return Boolean(asset.attachment === 'link' ? asset.attachmentUrl : asset.attachmentName);
}

function normalizeItem(raw) {
    const assets = {};

    if (raw.assets && typeof raw.assets === 'object') {
        LOCALES.forEach((locale) => {
            const asset = normalizeAsset(raw.assets[locale]);
            if (asset) {
                assets[locale] = asset;
            }
        });
    } else {
        const legacy = normalizeAsset(raw);
        if (legacy) {
            assets[baseLocale()] = legacy;
        }
    }

    return {
        id: String(raw.id || ''),
        date: String(raw.date || '').trim(),
        category: String(raw.category || '').trim(),
        title: toLocaleMap(raw.title ?? raw.titles),
        assets,
    };
}

function pickAsset(assets, locale) {
    if (!assets) {
        return null;
    }
    return assets[locale]
        || assets[baseLocale()]
        || LOCALES.map((key) => assets[key]).find(Boolean)
        || null;
}

/* 攤平成單一語系的顯示資料，供列表與搜尋使用 */
function localizedItem(item, locale) {
    const asset = pickAsset(item.assets, locale) || {};
    return {
        id: item.id,
        date: item.date,
        category: item.category,
        title: pickLocale(item.title, locale),
        attachment: asset.attachment || 'download',
        attachmentName: asset.attachmentName || '',
        attachmentSize: asset.attachmentSize || '',
        attachmentType: asset.attachmentType || '',
        attachmentUrl: asset.attachmentUrl || '',
        format: asset.format || '',
        translated: isTranslated(item, locale),
    };
}

/* 基準語系永遠視為完整；其他語系以標題是否填寫為準（附件可刻意共用基準語系） */
function isTranslated(item, locale) {
    return locale === baseLocale() || Boolean(item.title?.[locale]);
}

function mergeItems(seed, stored, deleted) {
    const deletedSet = new Set((deleted || []).map(String));
    const map = new Map();

    seed.forEach((item) => {
        if (!item?.id || deletedSet.has(String(item.id))) {
            return;
        }
        map.set(String(item.id), normalizeItem(item));
    });

    stored.forEach((item) => {
        if (!item?.id || deletedSet.has(String(item.id))) {
            return;
        }
        map.set(String(item.id), normalizeItem(item));
    });

    return [...map.values()].sort((a, b) => {
        const dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
        return dateCmp !== 0 ? dateCmp : String(b.id).localeCompare(String(a.id));
    });
}

function catalogState(meta) {
    const seed = seedFrom(meta);
    const stored = readStore(seed.kind);
    const categories = mergeCategories(seed.categories, stored);
    const items = mergeItems(seed.items, stored.items, stored.deleted);
    return {
        ...seed,
        locale: activeLocale(),
        categories,
        tabCategories: categories,
        items,
        stored,
    };
}

function findItem(meta, id) {
    if (!id) {
        return null;
    }
    return catalogState(meta).items.find((item) => String(item.id) === String(id)) || null;
}

function categoryLabel(categories, value, locale) {
    const match = categories.find((cat) => String(cat.value) === String(value));
    return pickLocale(match?.label, locale) || value || '—';
}

function categoryValueFromLabel(label) {
    const ascii = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return ascii || `cat-${Date.now().toString(36)}`;
}

function uniqueCategoryValue(label, existing) {
    const used = new Set((existing || []).map((cat) => String(cat.value)));
    const base = categoryValueFromLabel(label);
    if (!used.has(base)) {
        return base;
    }
    let index = 2;
    while (used.has(`${base}-${index}`)) {
        index += 1;
    }
    return `${base}-${index}`;
}

function replaceSelectOptions(select, categories, selectedValue, locale) {
    if (!select) {
        return;
    }

    const menu = select._formMenu || select.querySelector('[data-form-select-menu]');
    const wrap = menu?.querySelector('[data-form-select-options]') || menu;
    if (!wrap) {
        return;
    }

    wrap.querySelectorAll('[data-form-select-option]').forEach((option) => option.remove());
    (categories || []).forEach((category) => {
        addSelectOption(select, category.value, pickLocale(category.label, locale));
    });

    const nextValue = (categories || []).some((cat) => String(cat.value) === String(selectedValue))
        ? selectedValue
        : (categories[0]?.value || '');
    setFormSelectByValue(select, nextValue);
}

function cloneCategories(list) {
    return (list || []).map((cat) => {
        const normalized = normalizeCategory(cat);
        return normalized ? { value: normalized.value, label: { ...normalized.label } } : null;
    }).filter(Boolean);
}

function openCategoryManager({ meta, selectedValue = '', onChange }) {
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
                    <p class="text-cb3 text-gray3">可新增、重新命名、調整分頁順序或刪除分類。名稱需逐語系填寫，未填的語系會顯示 ${escapeHtml(base)} 名稱。</p>
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
    const draft = cloneCategories(catalogState(meta).categories);
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

    const itemCount = (value) => catalogState(meta).items.filter((item) => String(item.category) === String(value)).length;

    const baseName = (category) => category.label[base] || category.value;

    const duplicateName = (label, exceptValue = '') => draft.some((cat) => (
        String(cat.label[editLocale] || '').trim() === label && String(cat.value) !== String(exceptValue)
    ));

    const syncLocaleTabs = () => {
        host.querySelectorAll('[data-category-locale]').forEach((tab) => {
            const locale = tab.dataset.categoryLocale;
            const active = locale === editLocale;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');

            const incomplete = locale !== base && draft.some((cat) => !String(cat.label[locale] || '').trim());
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

        draft.forEach((category, index) => {
            const name = baseName(category);
            const localeName = String(category.label[editLocale] || '');
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

    host.querySelectorAll('[data-category-locale]').forEach((tab) => {
        tab.addEventListener('click', () => {
            editLocale = tab.dataset.categoryLocale;
            closeAddPanel();
            render();
        });
    });

    const moveCategory = (from, to) => {
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
                        // 基準語系不可空白，還原這次渲染時的原值
                        draft[index].label[base] = input.defaultValue;
                        input.value = input.defaultValue;
                        return;
                    }
                    delete draft[index].label[editLocale];
                    render();
                    return;
                }

                if (duplicateName(label, draft[index].value)) {
                    input.classList.add('form-error');
                    showToast('此分類已存在', 'error');
                    input.value = draft[index].label[editLocale] || '';
                    return;
                }

                input.classList.remove('form-error');
                draft[index].label[editLocale] = label;
                syncLocaleTabs();
            });

            row.querySelector('[data-category-move="-1"]')?.addEventListener('click', () => moveCategory(index, index - 1));
            row.querySelector('[data-category-move="1"]')?.addEventListener('click', () => moveCategory(index, index + 1));
            row.querySelector('[data-category-delete]')?.addEventListener('click', async () => {
                if (draft.length <= 1) {
                    showToast('至少需保留一個分類', 'error');
                    return;
                }
                const category = draft[index];
                const name = baseName(category);
                const count = itemCount(category.value);
                const ok = await showConfirm({
                    title: '刪除分類',
                    message: count
                        ? `「${escapeHtml(name)}」尚有 ${count} 筆資料。刪除分類後這些資料連同各語系內容也會一併刪除，且無法復原。`
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
                moveCategory(dragIndex, index);
            });
        });
    };

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
        if (draft.some((cat) => String(cat.label[base] || '').trim() === label)) {
            addInput?.classList.add('form-error');
            showToast('此分類已存在', 'error');
            return;
        }
        draft.push({
            value: uniqueCategoryValue(label, draft),
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
        for (const category of draft) {
            const label = {};
            LOCALES.forEach((locale) => {
                const text = String(category.label[locale] || '').trim();
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

            cleaned.push({ value: category.value, label });
        }
        if (!cleaned.length) {
            showToast('至少需保留一個分類', 'error');
            return;
        }

        const removed = catalogState(meta).categories.filter((cat) => (
            !cleaned.some((entry) => entry.value === cat.value)
        ));
        removed.forEach((category) => {
            catalogState(meta).items
                .filter((item) => String(item.category) === String(category.value))
                .forEach((item) => deleteItem(meta.kind, item.id));
        });

        persistCategories(meta.kind, seed.categories, cleaned);
        const nextSelected = cleaned.some((cat) => cat.value === selectedValue)
            ? selectedValue
            : cleaned[0]?.value || '';
        onChange?.(cleaned, nextSelected);
        close();
        showToast('已更新分類', 'success');
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(host);
    render();
    requestAnimationFrame(() => host.classList.add('is-open'));
}

function bindCategoryManager(openBtn, meta, { select, getLocale, onChange } = {}) {
    openBtn?.addEventListener('click', () => {
        if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
            showToast('目前身分權限無法管理分類', 'error');
            return;
        }
        openCategoryManager({
            meta,
            selectedValue: select?.querySelector('[data-form-select-value]')?.value || '',
            onChange: (categories, selectedValue) => {
                if (select) {
                    replaceSelectOptions(select, categories, selectedValue, getLocale ? getLocale() : activeLocale());
                }
                onChange?.(categories, selectedValue);
            },
        });
    });
}

function upsertItem(kind, item) {
    const store = readStore(kind);
    store.items = store.items.filter((row) => String(row.id) !== String(item.id));
    store.items.push(item);
    store.deleted = store.deleted.filter((id) => String(id) !== String(item.id));
    writeStore(kind, store);
}

function persistCategories(kind, seed, categories) {
    const store = readStore(kind);
    const current = (categories || []).map(normalizeCategory).filter(Boolean);
    const currentValues = new Set(current.map((cat) => cat.value));
    const seedValues = (seed || []).map((cat) => String(cat.value));
    store.categories = current;
    store.categoriesManaged = true;
    store.deletedCategories = seedValues.filter((value) => !currentValues.has(value));
    writeStore(kind, store);
}

function deleteItem(kind, id) {
    const key = String(id || '');
    if (!key) {
        return;
    }
    const store = readStore(kind);
    store.items = store.items.filter((row) => String(row.id) !== key);
    if (!store.deleted.includes(key)) {
        store.deleted.push(key);
    }
    writeStore(kind, store);
}

function todayIso() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

function createItemId(kind) {
    const prefix = kind === 'marketing' ? 'MR' : 'PA';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function isValidUrl(value) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function extensionFromName(value) {
    const name = String(value || '').split('?')[0].split('#')[0];
    const last = name.split('/').pop() || '';
    const dot = last.lastIndexOf('.');
    if (dot < 0 || dot === last.length - 1) {
        return '';
    }
    const ext = last.slice(dot + 1).trim().toUpperCase();
    return ext === 'JPEG' ? 'JPG' : ext;
}

function detectResourceFormat(item) {
    if ((item.attachment || 'download') === 'link') {
        return extensionFromName(item.attachmentUrl) || 'Link';
    }
    return extensionFromName(item.attachmentName) || '';
}

function formatFileSize(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) {
        return `${size} B`;
    }
    if (size < 1024 * 1024) {
        return `${Math.round(size / 1024)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function bindFileUpload(root) {
    if (!root || root.dataset.bound === 'true') {
        return;
    }

    const fileInput = root.querySelector('[data-file-input]');
    const trigger = root.querySelector('[data-file-trigger]');
    const item = root.querySelector('[data-file-item]');
    const removeBtn = root.querySelector('[data-file-remove]');
    const nameInput = root.querySelector('[data-file-name]');
    const sizeInput = root.querySelector('[data-file-size]');
    const typeInput = root.querySelector('[data-file-type]');
    const nameEl = root.querySelector('[data-file-item-name]');
    const metaEl = root.querySelector('[data-file-item-meta]');

    if (!fileInput || !trigger) {
        return;
    }

    root.dataset.bound = 'true';
    const maxBytes = 2 * 1024 * 1024;

    const setValue = (file) => {
        if (!file) {
            if (nameInput) nameInput.value = '';
            if (sizeInput) sizeInput.value = '';
            if (typeInput) typeInput.value = '';
            fileInput.value = '';
            trigger.hidden = false;
            if (item) item.hidden = true;
            return;
        }

        if (nameInput) nameInput.value = file.name;
        if (sizeInput) sizeInput.value = String(file.size || '');
        if (typeInput) typeInput.value = file.type || '';
        if (nameEl) nameEl.textContent = file.name;
        if (metaEl) metaEl.textContent = formatFileSize(file.size) || file.type || '已選擇檔案';
        trigger.hidden = true;
        if (item) item.hidden = false;
        refreshIcons(root);
    };

    const applyFile = (file) => {
        if (!file) {
            return;
        }
        if (file.size > maxBytes) {
            showToast('檔案超過 2MB，請重新選擇', 'error');
            fileInput.value = '';
            return;
        }
        setValue(file);
    };

    trigger.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => applyFile(fileInput.files?.[0] || null));

    ['dragenter', 'dragover'].forEach((type) => {
        trigger.addEventListener(type, (event) => {
            event.preventDefault();
            event.stopPropagation();
            trigger.classList.add('is-dragover');
        });
    });

    ['dragleave', 'drop'].forEach((type) => {
        trigger.addEventListener(type, (event) => {
            event.preventDefault();
            event.stopPropagation();
            trigger.classList.remove('is-dragover');
        });
    });

    trigger.addEventListener('drop', (event) => {
        applyFile(event.dataTransfer?.files?.[0] || null);
    });

    removeBtn?.addEventListener('click', () => setValue(null));
    root._applyFileMeta = setValue;
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

function applyPreviewRole() {
    if (typeof app().applyPreviewRole === 'function' && typeof app().getPreviewRole === 'function') {
        app().applyPreviewRole(app().getPreviewRole());
    }
}

function refreshCatalog(root) {
    if (typeof app().refreshResourceCatalog === 'function') {
        app().refreshResourceCatalog(root);
        return;
    }
    root?._catalogRender?.();
}

function searchText(item, label, kind) {
    return [item.date, label, item.title, kind === 'marketing' ? item.format : '']
        .filter(Boolean)
        .join(' ');
}

/* 未翻譯標記只給有管理權限的身分權限看，一般使用者看到的是回退後的內容 */
function toggleUntranslatedBadge(row, show, capability) {
    let badge = row.querySelector('[data-catalog-untranslated]');

    if (!show) {
        badge?.remove();
        return;
    }

    if (!badge) {
        const titleEl = row.querySelector('[data-catalog-title]');
        if (!titleEl) {
            return;
        }
        badge = document.createElement('span');
        badge.className = 'badge-untranslated';
        badge.setAttribute('data-catalog-untranslated', '');
        badge.setAttribute('data-requires', capability || '');
        badge.textContent = '未翻譯';
        titleEl.appendChild(badge);
    }
}

function fillAttachmentButton(button, item) {
    if (!button) {
        return;
    }

    const isDownload = (item.attachment || 'download') !== 'link';
    button.dataset.resourceAction = isDownload ? 'download' : 'link';
    button.innerHTML = isDownload
        ? '<i data-lucide="download" class="w-3.5 h-3.5"></i><span>下載</span>'
        : '<i data-lucide="external-link" class="w-3.5 h-3.5"></i><span>連結</span>';
}

function fillRow(row, record, state) {
    const item = localizedItem(record, state.locale);
    const label = categoryLabel(state.categories, item.category, state.locale);
    row.dataset.catalogId = item.id;
    row.dataset.category = item.category || '';
    row.dataset.search = searchText(item, label, state.kind);

    const dateEl = row.querySelector('[data-catalog-date]');
    const categoryEl = row.querySelector('[data-catalog-category]');
    const titleEl = row.querySelector('[data-catalog-title]');
    const formatEl = row.querySelector('[data-catalog-format]');
    if (dateEl) dateEl.textContent = item.date || '—';
    if (categoryEl) categoryEl.textContent = label;
    if (titleEl) titleEl.textContent = item.title || '—';
    if (formatEl) formatEl.textContent = item.format || '—';

    toggleUntranslatedBadge(row, !item.translated, state.capability);
    fillAttachmentButton(row.querySelector('[data-resource-action]'), item);

    const editLink = row.querySelector('[data-catalog-edit]');
    if (editLink) {
        const base = state.createUrl || editLink.getAttribute('href') || '';
        editLink.href = `${base}${base.includes('?') ? '&' : '?'}id=${encodeURIComponent(item.id)}`;
        editLink.setAttribute('aria-label', `編輯 ${item.title || item.id}`);
    }

    const deleteBtn = row.querySelector('[data-catalog-delete]');
    if (deleteBtn) {
        deleteBtn.setAttribute('aria-label', `刪除 ${item.title || item.id}`);
    }
}

function buildTab(category, active, locale) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tab${active ? ' is-active' : ''}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    button.dataset.catalogTab = category.value;
    button.textContent = pickLocale(category.label, locale) || category.value;
    return button;
}

function buildRow(template, item, state) {
    const row = template.content.firstElementChild.cloneNode(true);
    fillRow(row, item, state);
    return row;
}

function syncCatalogList(root, meta) {
    const state = catalogState(meta);
    const tablist = root.querySelector('[data-catalog-tabs]');
    const host = root.querySelector('[data-catalog-rows]');
    const template = document.querySelector('[data-catalog-row-template]');
    const empty = host?.querySelector('[data-catalog-empty]');

    if (tablist) {
        const requested = new URLSearchParams(window.location.search).get('tab');
        const previous = requested
            || tablist.querySelector('[data-catalog-tab].is-active')?.dataset.catalogTab
            || state.tabCategories[0]?.value
            || '';
        const active = state.tabCategories.some((cat) => cat.value === previous)
            ? previous
            : (state.tabCategories[0]?.value || '');
        tablist.replaceChildren();
        state.tabCategories.forEach((category) => {
            tablist.appendChild(buildTab(category, category.value === active, state.locale));
        });
    }

    if (host && template) {
        host.querySelectorAll('[data-catalog-row]').forEach((row) => row.remove());
        state.items.forEach((item) => {
            const row = buildRow(template, item, state);
            if (empty) {
                host.insertBefore(row, empty);
            } else {
                host.appendChild(row);
            }
        });
    } else {
        root.querySelectorAll('[data-catalog-row]').forEach((row) => {
            const item = state.items.find((entry) => String(entry.id) === String(row.dataset.catalogId));
            if (!item) {
                row.remove();
                return;
            }
            fillRow(row, item, state);
        });
    }

    applyPreviewRole();
    refreshIcons(root);
    if (typeof root._catalogGoToPage === 'function') {
        root._catalogGoToPage(1);
    } else {
        refreshCatalog(root);
    }
}

async function handleListClick(event, root, meta) {
    const deleteBtn = event.target.closest('[data-catalog-delete]');
    if (!deleteBtn || !root.contains(deleteBtn)) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
        showToast('目前身分權限無法刪除資料', 'error');
        return;
    }

    const row = deleteBtn.closest('[data-catalog-row]');
    const id = row?.dataset.catalogId;
    const item = findItem(meta, id);
    const title = (item ? pickLocale(item.title, baseLocale()) : '') || id || '此筆資料';
    const ok = await showConfirm({
        title: meta.kind === 'marketing' ? '刪除資源' : '刪除公告',
        message: `確定刪除「${escapeHtml(title)}」？三個語系的內容都會一併刪除，且無法復原。`,
        confirmLabel: '刪除',
        cancelLabel: '取消',
        danger: true,
    });

    if (!ok) {
        return;
    }

    deleteItem(meta.kind, id);
    syncCatalogList(root, meta);
    showToast(meta.kind === 'marketing' ? '已刪除資源' : '已刪除公告', 'success');
}

function bindCatalogList(root) {
    const kind = root.dataset.catalogKind;
    const meta = readJson(`${kind}-catalog-data`);
    if (!meta) {
        return;
    }

    meta.kind = kind;
    meta.createUrl = root.dataset.createUrl || meta.createUrl || '';
    meta.capability = root.dataset.manage || meta.capability;
    setLocales(meta.locales);

    syncCatalogList(root, meta);
    bindCategoryManager(root.querySelector('[data-manage-categories]'), meta, {
        onChange: () => syncCatalogList(root, meta),
    });
    root.addEventListener('click', (event) => {
        handleListClick(event, root, meta);
    });
    document.addEventListener('upas:localechange', () => {
        syncCatalogList(root, meta);
    });
}

function syncAttachmentUi(form) {
    const type = form.querySelector('[name="attachment"]:checked')?.value || 'download';
    const filePanel = form.querySelector('[data-attachment-file]');
    const linkPanel = form.querySelector('[data-attachment-link]');
    if (filePanel) filePanel.hidden = type !== 'download';
    if (linkPanel) linkPanel.hidden = type !== 'link';
}

function syncSourceOptions(form) {
    form.querySelectorAll('[data-source-input]').forEach((input) => {
        const option = input.closest('.source-option');
        if (option) {
            option.classList.toggle('is-selected', input.checked);
        }
    });
}

function setView(form, toolbar, missing, forbidden, mode) {
    if (form) form.hidden = mode !== 'form';
    if (toolbar) toolbar.hidden = mode !== 'form';
    if (missing) missing.hidden = mode !== 'missing';
    if (forbidden) forbidden.hidden = mode !== 'forbidden';
}

function emptySlice() {
    return {
        title: '',
        attachment: 'download',
        attachmentName: '',
        attachmentSize: '',
        attachmentType: '',
        attachmentUrl: '',
    };
}

function sliceHasContent(slice) {
    return Boolean(slice.title || slice.attachmentName || slice.attachmentUrl);
}

/* 把表單目前顯示的語系欄位讀成一份草稿切片 */
function readLocaleSlice(form) {
    const attachment = form.querySelector('[name="attachment"]:checked')?.value === 'link' ? 'link' : 'download';
    return {
        title: form.querySelector('[name="title"]')?.value.trim() || '',
        attachment,
        attachmentName: form.querySelector('[name="attachment_name"]')?.value.trim() || '',
        attachmentSize: form.querySelector('[name="attachment_size"]')?.value.trim() || '',
        attachmentType: form.querySelector('[name="attachment_type"]')?.value.trim() || '',
        attachmentUrl: form.querySelector('[name="attachment_url"]')?.value.trim() || '',
    };
}

/* 把草稿切片寫回表單欄位 */
function applyLocaleSlice(form, slice) {
    const titleInput = form.querySelector('[name="title"]');
    if (titleInput) {
        titleInput.value = slice.title || '';
    }

    const urlInput = form.querySelector('[name="attachment_url"]');
    if (urlInput) {
        urlInput.value = slice.attachmentUrl || '';
    }

    const radio = form.querySelector(`[name="attachment"][value="${slice.attachment === 'link' ? 'link' : 'download'}"]`);
    if (radio) {
        radio.checked = true;
    }

    const upload = form.querySelector('[data-file-upload]');
    if (slice.attachmentName) {
        upload?._applyFileMeta?.({
            name: slice.attachmentName,
            size: Number(slice.attachmentSize) || 0,
            type: slice.attachmentType || '',
        });
    } else {
        upload?._applyFileMeta?.(null);
    }

    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
    syncSourceOptions(form);
    syncAttachmentUi(form);
}

function collectFormItem(form, currentId, kind, draft) {
    const title = {};
    const assets = {};

    LOCALES.forEach((locale) => {
        const slice = draft[locale] || emptySlice();
        if (slice.title) {
            title[locale] = slice.title;
        }

        const asset = {
            attachment: slice.attachment === 'link' ? 'link' : 'download',
            attachmentName: slice.attachmentName,
            attachmentSize: slice.attachmentSize,
            attachmentType: slice.attachmentType,
            attachmentUrl: slice.attachmentUrl,
            format: '',
        };

        if (hasAsset(asset)) {
            asset.format = kind === 'marketing' ? detectResourceFormat(asset) : '';
            assets[locale] = asset;
        }
    });

    return {
        id: currentId || createItemId(kind),
        date: form.querySelector('[name="date"]')?.value.trim() || '',
        category: form.querySelector('[name="category"]')?.value.trim() || '',
        title,
        assets,
    };
}

/* 共用欄位（日期、分類）只驗一次；語系欄位只有基準語系必填 */
function validateSharedFields(form) {
    let valid = true;

    const dateInput = form.querySelector('[name="date"]');
    if (dateInput) {
        const empty = !String(dateInput.value || '').trim();
        dateInput.classList.toggle('form-error', empty);
        if (empty) valid = false;
    }

    const categoryValue = form.querySelector('[name="category"]')?.value || '';
    const categoryTrigger = form
        .querySelector('[name="category"]')
        ?.closest('[data-form-select]')
        ?.querySelector('[data-form-select-trigger]');
    if (categoryTrigger) {
        categoryTrigger.classList.toggle('form-error', !categoryValue);
    }
    if (!categoryValue) valid = false;

    return valid;
}

function validateLocaleSlice(slice, { required }) {
    const errors = [];

    if (!slice.title && required) {
        errors.push('title');
    }

    if (slice.attachment === 'link') {
        const url = slice.attachmentUrl;
        if (required ? !isValidUrl(url) : (url && !isValidUrl(url))) {
            errors.push('url');
        }
    } else if (required && !slice.attachmentName) {
        errors.push('file');
    }

    return errors;
}

function markLocaleErrors(form, errors) {
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

    if (errors.includes('title')) {
        form.querySelector('[name="title"]')?.classList.add('form-error');
    }
    if (errors.includes('url')) {
        form.querySelector('[name="attachment_url"]')?.classList.add('form-error');
    }
    if (errors.includes('file')) {
        form.querySelector('[data-file-trigger]')?.classList.add('form-error');
    }
}

function bindCatalogForm(form) {
    const kind = form.dataset.catalogKind;
    const meta = readJson(`${kind}-catalog-data`);
    if (!meta) {
        return;
    }

    meta.kind = kind;
    meta.capability = form.dataset.manage || meta.capability;
    meta.listUrl = form.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    const base = baseLocale();
    const toolbar = document.querySelector('[data-catalog-form-toolbar]');
    const missing = document.querySelector('[data-catalog-missing]');
    const forbidden = document.querySelector('[data-catalog-forbidden]');
    const crumb = document.querySelector('[data-catalog-crumb]');
    const heading = document.querySelector('[data-page-heading]');
    const copy = meta.copy || {};
    const params = new URLSearchParams(window.location.search);
    const editingId = params.get('id') || '';

    bindFileUpload(form.querySelector('[data-file-upload]'));
    syncAttachmentUi(form);
    syncSourceOptions(form);

    form.querySelectorAll('[name="attachment"]').forEach((input) => {
        input.addEventListener('change', () => {
            syncSourceOptions(form);
            syncAttachmentUi(form);
        });
    });

    const applyAccess = () => {
        const allowed = typeof app().roleCan !== 'function' || app().roleCan(meta.capability);
        if (!allowed) {
            setView(form, toolbar, missing, forbidden, 'forbidden');
            if (crumb) crumb.textContent = copy.headingNew || '新增';
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
        current = findItem(meta, editingId);
        if (!current) {
            setView(form, toolbar, missing, forbidden, 'missing');
            if (crumb) crumb.textContent = copy.headingEdit || '編輯';
            return;
        }
    }

    setView(form, toolbar, missing, forbidden, 'form');

    const state = catalogState(meta);
    const categorySelect = form.querySelector('[name="category"]')?.closest('[data-form-select]');

    // 每個語系一份草稿，切換分頁時互換，避免把三語系欄位同時攤在畫面上
    const draft = {};
    LOCALES.forEach((locale) => {
        const asset = current?.assets?.[locale];
        draft[locale] = {
            ...emptySlice(),
            title: current?.title?.[locale] || '',
            ...(asset ? {
                attachment: asset.attachment,
                attachmentName: asset.attachmentName,
                attachmentSize: asset.attachmentSize,
                attachmentType: asset.attachmentType,
                attachmentUrl: asset.attachmentUrl,
            } : {}),
        };
    });

    let editLocale = LOCALES.includes(activeLocale()) ? activeLocale() : base;

    const renderCategoryOptions = () => {
        const selected = form.querySelector('[name="category"]')?.value || '';
        replaceSelectOptions(categorySelect, catalogState(meta).categories, selected, editLocale);
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
                dot.hidden = locale === base || Boolean(slice.title);
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
        renderCategoryOptions();
        syncLocaleTabs();
    };

    form.querySelectorAll('[data-form-locale]').forEach((tab) => {
        tab.addEventListener('click', () => switchLocale(tab.dataset.formLocale));
    });

    form.querySelector('[name="title"]')?.addEventListener('input', syncLocaleTabs);

    bindCategoryManager(form.querySelector('[data-manage-categories]'), meta, {
        select: categorySelect,
        getLocale: () => editLocale,
    });

    renderCategoryOptions();

    if (current) {
        form.querySelector('[name="id"]').value = current.id;
        form.querySelector('[name="date"]').value = current.date || '';
        setFormSelectByValue(categorySelect, current.category || '');

        if (heading) heading.textContent = copy.headingEdit || '編輯';
        if (crumb) crumb.textContent = copy.headingEdit || '編輯';
        const submitLabel = form.querySelector('[data-catalog-submit-label]');
        if (submitLabel) submitLabel.textContent = copy.submitEdit || '儲存變更';
        const asideTitle = form.querySelector('[data-catalog-aside-title]');
        if (asideTitle) asideTitle.textContent = copy.asideEdit || '儲存變更';
    } else {
        form.querySelector('[name="date"]').value = todayIso();
        setFormSelectByValue(categorySelect, state.categories[0]?.value || '');
        if (heading) heading.textContent = copy.headingNew || '新增';
        if (crumb) crumb.textContent = copy.headingNew || '新增';
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

        if (!validateSharedFields(form)) {
            form.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('請先完成必填欄位', 'error');
            return;
        }

        // 基準語系必填，其他語系只在填了東西時才檢查格式
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
            showToast(required ? `請先完成 ${base} 的必填欄位` : `${locale} 的連結網址格式不正確`, 'error');
            return;
        }

        const item = collectFormItem(form, current?.id || '', kind, draft);
        upsertItem(kind, item);
        showToast(current ? (copy.savedEdit || '已儲存變更') : (copy.savedNew || '已發布'), 'success');
        const listUrl = form.dataset.listUrl || meta.listUrl || './';
        const separator = listUrl.includes('?') ? '&' : '?';
        window.location.href = `${listUrl}${separator}tab=${encodeURIComponent(item.category)}`;
    });

    document.addEventListener('upas:rolechange', () => {
        applyAccess();
    });

    document.addEventListener('upas:localechange', (event) => {
        switchLocale(event.detail?.locale);
    });
}

document.querySelectorAll('[data-resource-catalog][data-catalog-kind]').forEach(bindCatalogList);
document.querySelectorAll('[data-catalog-form]').forEach(bindCatalogForm);
document.addEventListener('upas:rolechange', () => {
    document.querySelectorAll('[data-resource-catalog][data-catalog-kind]').forEach((root) => {
        refreshCatalog(root);
    });
});
