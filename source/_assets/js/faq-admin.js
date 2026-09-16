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
        console.warn('Unable to parse FAQ data', error);
        return null;
    }
}

function readFaqMeta() {
    return readJson('support-faq-data') || readJson('support-center-data');
}

const STORE_KEY = 'upas-support-faqs';
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

/* 兩組 FAQ 分類軸，資料結構與持久化方式相同，只差 store 欄位與顯示字樣 */
const TAXONOMIES = [
    {
        kind: 'type',
        title: '問題類型',
        faqKey: 'type',
        idPrefix: 'type',
        storeKey: 'types',
        deletedKey: 'deletedTypes',
        managedKey: 'typesManaged',
        seed: (meta) => meta.typeOptions ?? meta.types,
    },
    {
        kind: 'module',
        title: '對應模組',
        faqKey: 'module',
        idPrefix: 'mod',
        storeKey: 'modules',
        deletedKey: 'deletedModules',
        managedKey: 'modulesManaged',
        seed: (meta) => meta.moduleOptions ?? meta.modules,
    },
];

function taxonomyConfig(kind) {
    return TAXONOMIES.find((entry) => entry.kind === kind) || TAXONOMIES[0];
}

function emptyStore() {
    return {
        faqs: [],
        deleted: [],
        faqsManaged: false,
        types: [],
        deletedTypes: [],
        typesManaged: false,
        modules: [],
        deletedModules: [],
        modulesManaged: false,
    };
}

function readStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        const store = {
            faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
            deleted: Array.isArray(parsed.deleted) ? parsed.deleted.map(String) : [],
            faqsManaged: Boolean(parsed.faqsManaged),
        };
        TAXONOMIES.forEach((cfg) => {
            store[cfg.storeKey] = Array.isArray(parsed[cfg.storeKey]) ? parsed[cfg.storeKey] : [];
            store[cfg.deletedKey] = Array.isArray(parsed[cfg.deletedKey]) ? parsed[cfg.deletedKey].map(String) : [];
            store[cfg.managedKey] = Boolean(parsed[cfg.managedKey]);
        });
        return store;
    } catch (error) {
        return emptyStore();
    }
}

function writeStore(store) {
    const payload = {
        faqs: store.faqs || [],
        deleted: store.deleted || [],
        faqsManaged: Boolean(store.faqsManaged),
    };
    TAXONOMIES.forEach((cfg) => {
        payload[cfg.storeKey] = store[cfg.storeKey] || [];
        payload[cfg.deletedKey] = store[cfg.deletedKey] || [];
        payload[cfg.managedKey] = Boolean(store[cfg.managedKey]);
    });
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function normalizeTaxon(entry) {
    const value = String(entry?.value || '').trim();
    if (!value) {
        return null;
    }
    const label = toLocaleMap(entry.label ?? entry.labels);
    if (!Object.keys(label).length) {
        label[baseLocale()] = value;
    }
    return { value, label };
}

/* 種子資料是 [{value,label}]，列表頁的備援欄位則是 {value: label}，兩種都接受 */
function toTaxonList(source) {
    if (Array.isArray(source)) {
        return source.map(normalizeTaxon).filter(Boolean);
    }
    if (source && typeof source === 'object') {
        return Object.entries(source)
            .map(([value, label]) => normalizeTaxon({ value, label }))
            .filter(Boolean);
    }
    return [];
}

function mergeTaxonomy(seedList, storedList, deletedList, managed) {
    const deleted = new Set((deletedList || []).map(String));
    const stored = toTaxonList(storedList);

    if (managed) {
        const ordered = [];
        const seen = new Set();
        stored.forEach((taxon) => {
            if (deleted.has(taxon.value) || seen.has(taxon.value)) {
                return;
            }
            ordered.push(taxon);
            seen.add(taxon.value);
        });
        seedList.forEach((taxon) => {
            if (deleted.has(taxon.value) || seen.has(taxon.value)) {
                return;
            }
            ordered.push(taxon);
            seen.add(taxon.value);
        });
        return ordered;
    }

    const map = new Map();
    seedList.forEach((taxon) => {
        if (!deleted.has(taxon.value)) {
            map.set(taxon.value, taxon);
        }
    });
    stored.forEach((taxon) => {
        if (deleted.has(taxon.value)) {
            return;
        }
        const previous = map.get(taxon.value);
        map.set(taxon.value, previous
            ? { value: taxon.value, label: { ...previous.label, ...taxon.label } }
            : taxon);
    });
    return [...map.values()];
}

function taxonomyList(meta, kind) {
    const cfg = taxonomyConfig(kind);
    const store = readStore();
    return mergeTaxonomy(
        toTaxonList(cfg.seed(meta)),
        store[cfg.storeKey],
        store[cfg.deletedKey],
        store[cfg.managedKey],
    );
}

function persistTaxonomy(meta, kind, list) {
    const cfg = taxonomyConfig(kind);
    const store = readStore();
    const current = toTaxonList(list);
    const values = new Set(current.map((taxon) => taxon.value));
    store[cfg.storeKey] = current;
    store[cfg.managedKey] = true;
    store[cfg.deletedKey] = toTaxonList(cfg.seed(meta))
        .map((taxon) => taxon.value)
        .filter((value) => !values.has(value));
    writeStore(store);
}

function taxonLabelMap(list, locale) {
    const map = {};
    (list || []).forEach((taxon) => {
        map[taxon.value] = pickLocale(taxon.label, locale) || taxon.value;
    });
    return map;
}

function uniqueTaxonValue(label, existing, prefix) {
    const used = new Set((existing || []).map((taxon) => String(taxon.value)));
    const ascii = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const base = ascii || `${prefix}-${Date.now().toString(36)}`;
    if (!used.has(base)) {
        return base;
    }
    let index = 2;
    while (used.has(`${base}-${index}`)) {
        index += 1;
    }
    return `${base}-${index}`;
}

function normalizeFaq(faq) {
    const id = String(faq?.id || '').trim();
    if (!id) {
        return null;
    }
    return {
        id,
        type: String(faq.type || '').trim(),
        module: String(faq.module || '').trim(),
        question: toLocaleMap(faq.question ?? faq.questions),
        answer: toLocaleMap(faq.answer ?? faq.answers),
    };
}

function mergeFaqs(seedFaqs, stored) {
    const deleted = new Set((stored.deleted || []).map(String));
    const map = new Map();

    (seedFaqs || []).forEach((faq) => {
        const normalized = normalizeFaq(faq);
        if (!normalized || deleted.has(normalized.id)) {
            return;
        }
        map.set(normalized.id, normalized);
    });

    (stored.faqs || []).forEach((faq) => {
        const normalized = normalizeFaq(faq);
        if (!normalized || deleted.has(normalized.id)) {
            return;
        }
        const previous = map.get(normalized.id) || {};
        map.set(normalized.id, {
            ...previous,
            ...normalized,
            question: { ...(previous.question || {}), ...normalized.question },
            answer: { ...(previous.answer || {}), ...normalized.answer },
        });
    });

    if (stored.faqsManaged) {
        const ordered = [];
        const seen = new Set();
        (stored.faqs || []).forEach((faq) => {
            const id = String(faq?.id || '');
            if (!id || seen.has(id) || !map.has(id)) {
                return;
            }
            ordered.push(map.get(id));
            seen.add(id);
        });
        map.forEach((faq, id) => {
            if (!seen.has(id)) {
                ordered.push(faq);
            }
        });
        return ordered;
    }

    return [...map.values()];
}

function faqState(meta = {}) {
    const stored = readStore();
    const locale = activeLocale();
    const typeList = taxonomyList(meta, 'type');
    const moduleList = taxonomyList(meta, 'module');
    return {
        capability: meta.capability || 'support.manage',
        createUrl: meta.createFaqUrl || meta.createUrl || '',
        listUrl: meta.listUrl || '',
        locales: meta.locales || LOCALES,
        typeList,
        moduleList,
        types: taxonLabelMap(typeList, locale),
        modules: taxonLabelMap(moduleList, locale),
        faqs: mergeFaqs(meta.faqs, stored),
        locale,
        copy: meta.copy || {},
        stored,
    };
}

function findFaq(meta, id) {
    if (!id) {
        return null;
    }
    return faqState(meta).faqs.find((faq) => String(faq.id) === String(id)) || null;
}

function slugFromLabel(label) {
    const ascii = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return ascii || `faq-${Date.now().toString(36)}`;
}

function uniqueId(label, existing) {
    const used = new Set((existing || []).map(String));
    const slug = slugFromLabel(label);
    const base = slug.startsWith('faq-') ? slug : `faq-${slug}`;
    if (!used.has(base)) {
        return base;
    }
    let index = 2;
    while (used.has(`${base}-${index}`)) {
        index += 1;
    }
    return `${base}-${index}`;
}

function snapshotFaqs(meta, faqs) {
    const store = readStore();
    store.faqs = (faqs || []).map(normalizeFaq).filter(Boolean);
    store.faqsManaged = true;
    const currentIds = new Set(store.faqs.map((faq) => faq.id));
    const seedIds = (meta.faqs || []).map((faq) => String(faq.id || '')).filter(Boolean);
    store.deleted = seedIds.filter((id) => !currentIds.has(id));
    writeStore(store);
}

function upsertFaq(meta, faq, { prepend = false } = {}) {
    const normalized = normalizeFaq(faq);
    if (!normalized) {
        return;
    }
    const state = faqState(meta);
    const next = [...state.faqs];
    const index = next.findIndex((item) => String(item.id) === normalized.id);
    if (index >= 0) {
        next[index] = normalized;
    } else if (prepend) {
        next.unshift(normalized);
    } else {
        next.push(normalized);
    }
    snapshotFaqs(meta, next);
}

function deleteFaq(meta, id) {
    const key = String(id || '');
    if (!key) {
        return;
    }
    snapshotFaqs(meta, faqState(meta).faqs.filter((faq) => String(faq.id) !== key));
}

function persistFaqOrder(meta, orderedIds) {
    const state = faqState(meta);
    const byId = new Map(state.faqs.map((faq) => [String(faq.id), faq]));
    const ordered = [];
    const seen = new Set();
    (orderedIds || []).forEach((id) => {
        const key = String(id);
        const faq = byId.get(key);
        if (!faq || seen.has(key)) {
            return;
        }
        ordered.push(faq);
        seen.add(key);
    });
    state.faqs.forEach((faq) => {
        if (!seen.has(faq.id)) {
            ordered.push(faq);
        }
    });
    snapshotFaqs(meta, ordered);
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

function selectMenu(select) {
    return select?._formMenu || select?.querySelector('[data-form-select-menu]') || null;
}

function addSelectOption(select, value, label, text = label) {
    const menu = selectMenu(select);
    if (!menu) {
        return null;
    }

    const wrap = menu.querySelector('[data-form-select-options]') || menu;
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'form-select-option';
    option.setAttribute('role', 'option');
    option.setAttribute('data-form-select-option', '');
    option.dataset.value = value;
    option.dataset.label = label;
    option.textContent = text;
    wrap.appendChild(option);

    /* 自訂下拉是逐項綁定的，動態加入的選項要自己補上點擊行為 */
    option.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof app().setFormSelectValue === 'function') {
            app().setFormSelectValue(select, option);
        }
        if (typeof app().closeFormSelects === 'function') {
            app().closeFormSelects();
        }
    });
    return option;
}

/* 依管理後的分類重建選項；篩選器保留第一個「全部」選項，表單則維持未選取狀態 */
function rebuildSelectOptions(select, list, locale) {
    const menu = selectMenu(select);
    if (!menu) {
        return;
    }

    const wrap = menu.querySelector('[data-form-select-options]') || menu;
    const hidden = select.querySelector('[data-form-select-value]');
    const labelEl = select.querySelector('[data-form-select-label]');
    const previous = hidden?.value || '';
    const allOption = wrap.querySelector('[data-form-select-option][data-value=""]');
    const hasAll = Boolean(allOption);
    const allLabel = allOption?.dataset.label || '';
    const allText = allOption?.textContent || '';

    if (labelEl && !select.dataset.placeholderLabel && labelEl.classList.contains('is-placeholder')) {
        select.dataset.placeholderLabel = labelEl.textContent;
    }

    wrap.querySelectorAll('[data-form-select-option]').forEach((option) => option.remove());

    if (hasAll) {
        addSelectOption(select, '', allLabel, allText);
    }
    list.forEach((taxon) => {
        addSelectOption(select, taxon.value, pickLocale(taxon.label, locale) || taxon.value);
    });

    const keep = previous === '' || list.some((taxon) => taxon.value === previous);
    const next = keep ? previous : '';

    if (next === '' && !hasAll) {
        if (hidden) {
            hidden.value = '';
            hidden.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (labelEl) {
            labelEl.textContent = select.dataset.placeholderLabel || labelEl.textContent;
            labelEl.classList.add('is-placeholder');
        }
        menu.querySelectorAll('[data-form-select-option]').forEach((option) => option.classList.remove('is-selected'));
        return;
    }

    setFormSelectByValue(select, next);
}

function openTaxonomyManager({ meta, kind, onChange }) {
    document.querySelector('[data-taxonomy-manager-host]')?.remove();

    const cfg = taxonomyConfig(kind);
    const base = baseLocale();
    const host = document.createElement('div');
    host.className = 'app-modal-host';
    host.setAttribute('data-taxonomy-manager-host', '');
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'taxonomy-manager-title');

    host.innerHTML = `
        <div class="app-modal-backdrop" data-taxonomy-dismiss></div>
        <div class="app-modal-panel category-manager-panel">
            <div class="self-stretch inline-flex items-start justify-between gap-3">
                <div class="min-w-0 flex flex-col gap-1">
                    <h3 id="taxonomy-manager-title" class="text-cb1 text-gray5">管理 FAQ 分類</h3>
                    <p class="text-cb3 text-gray3">可新增分類、修改名稱或調整順序。名稱需逐語系填寫，未填的語系會顯示 ${escapeHtml(base)} 名稱。</p>
                </div>
                <button type="button" class="icon-action -mt-1 -mr-1" data-taxonomy-dismiss aria-label="關閉">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="locale-tabs" role="tablist" aria-label="分類軸" data-taxonomy-kind-tabs>
                ${TAXONOMIES.map((entry) => `
                    <button type="button" class="locale-tab" role="tab" data-taxonomy-kind="${escapeHtml(entry.kind)}" aria-selected="false">
                        <span>${escapeHtml(entry.title)}</span>
                    </button>
                `).join('')}
            </div>
            <div class="locale-tabs" role="tablist" aria-label="編輯語系" data-taxonomy-locale-tabs>
                ${LOCALES.map((locale) => `
                    <button type="button" class="locale-tab" role="tab" data-taxonomy-locale="${escapeHtml(locale)}" aria-selected="false">
                        <span>${escapeHtml(locale)}</span>
                        <span class="locale-tab-dot" data-locale-incomplete hidden aria-hidden="true"></span>
                    </button>
                `).join('')}
            </div>
            <div class="category-manager-list" data-taxonomy-list></div>
            <div class="self-stretch flex flex-col gap-2">
                <button type="button" class="btn-dashed w-full" data-taxonomy-add-open>
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>新增分類</span>
                </button>
                <div class="self-stretch flex flex-col gap-2" data-taxonomy-add-panel hidden>
                    <div class="self-stretch flex flex-col md:flex-row md:items-center gap-2">
                        <input type="text" class="form-input" data-taxonomy-add-label placeholder="輸入 ${escapeHtml(base)} 分類名稱" maxlength="20">
                        <div class="inline-flex items-center gap-2 shrink-0">
                            <button type="button" class="btn-primary px-4" data-taxonomy-add-confirm>加入</button>
                            <button type="button" class="btn-secondary px-4" data-taxonomy-add-cancel>取消</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="self-stretch inline-flex items-center justify-end gap-2 pt-1">
                <button type="button" class="btn-secondary" data-taxonomy-dismiss>取消</button>
                <button type="button" class="btn-primary" data-taxonomy-save>完成</button>
            </div>
        </div>
    `;

    /* 兩個分類軸各自保留草稿，按「完成」時一起寫入 */
    const drafts = {};
    TAXONOMIES.forEach((entry) => {
        drafts[entry.kind] = taxonomyList(meta, entry.kind).map((taxon) => ({
            value: taxon.value,
            label: { ...taxon.label },
        }));
    });

    let editKind = cfg.kind;
    let editLocale = LOCALES.includes(activeLocale()) ? activeLocale() : base;
    let dragIndex = -1;

    const listEl = host.querySelector('[data-taxonomy-list]');
    const addPanel = host.querySelector('[data-taxonomy-add-panel]');
    const addInput = host.querySelector('[data-taxonomy-add-label]');
    const draft = () => drafts[editKind];

    const closeAddPanel = () => {
        if (addPanel) addPanel.hidden = true;
        if (addInput) addInput.value = '';
        addInput?.classList.remove('form-error');
    };

    const close = () => {
        host.classList.remove('is-open');
        document.removeEventListener('keydown', onKeyDown);
        window.setTimeout(() => host.remove(), 200);
    };

    function onKeyDown(event) {
        if (event.key !== 'Escape') {
            return;
        }
        event.preventDefault();
        if (addPanel && !addPanel.hidden) {
            closeAddPanel();
            return;
        }
        close();
    }

    const baseName = (taxon) => taxon.label[base] || taxon.value;

    const faqCount = (value) => faqState(meta).faqs
        .filter((faq) => String(faq[taxonomyConfig(editKind).faqKey]) === String(value))
        .length;

    const duplicateName = (label, exceptValue = '') => draft().some((taxon) => (
        String(taxon.label[editLocale] || '').trim() === label && String(taxon.value) !== String(exceptValue)
    ));

    const syncTabs = () => {
        host.querySelectorAll('[data-taxonomy-kind]').forEach((tab) => {
            const active = tab.dataset.taxonomyKind === editKind;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        host.querySelectorAll('[data-taxonomy-locale]').forEach((tab) => {
            const locale = tab.dataset.taxonomyLocale;
            const active = locale === editLocale;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');

            const incomplete = locale !== base && draft().some((taxon) => !String(taxon.label[locale] || '').trim());
            const dot = tab.querySelector('[data-locale-incomplete]');
            if (dot) {
                dot.hidden = !incomplete;
            }
        });
    };

    const moveTaxon = (from, to) => {
        const list = draft();
        if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
            return;
        }
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        render();
    };

    const bindRowEvents = () => {
        listEl.querySelectorAll('[data-taxonomy-row]').forEach((row) => {
            const index = Number(row.dataset.index);
            const input = row.querySelector('[data-taxonomy-name]');
            const handle = row.querySelector('[data-taxonomy-handle]');

            input?.addEventListener('pointerdown', () => {
                row.draggable = false;
            });
            input?.addEventListener('input', () => {
                const label = input.value.trim();
                if (label) {
                    draft()[index].label[editLocale] = label;
                } else if (editLocale !== base) {
                    delete draft()[index].label[editLocale];
                }
            });
            input?.addEventListener('blur', () => {
                const label = input.value.trim();

                if (!label) {
                    input.classList.remove('form-error');
                    if (editLocale === base) {
                        /* 基準語系不可空白，還原本次渲染時的原值 */
                        draft()[index].label[base] = input.defaultValue;
                        input.value = input.defaultValue;
                        return;
                    }
                    delete draft()[index].label[editLocale];
                    render();
                    return;
                }

                if (duplicateName(label, draft()[index].value)) {
                    input.classList.add('form-error');
                    showToast('此分類已存在', 'error');
                    input.value = draft()[index].label[editLocale] || '';
                    return;
                }

                input.classList.remove('form-error');
                draft()[index].label[editLocale] = label;
                syncTabs();
            });

            row.querySelector('[data-taxonomy-move="-1"]')?.addEventListener('click', () => moveTaxon(index, index - 1));
            row.querySelector('[data-taxonomy-move="1"]')?.addEventListener('click', () => moveTaxon(index, index + 1));
            row.querySelector('[data-taxonomy-delete]')?.addEventListener('click', async () => {
                if (draft().length <= 1) {
                    showToast('至少需保留一個分類', 'error');
                    return;
                }
                const taxon = draft()[index];
                const name = baseName(taxon);
                const count = faqCount(taxon.value);
                const ok = await showConfirm({
                    title: '刪除分類',
                    message: count
                        ? `「${escapeHtml(name)}」尚有 ${count} 筆 FAQ。刪除分類後這些 FAQ 連同各語系內容也會一併刪除，且無法復原。`
                        : `確定刪除「${escapeHtml(name)}」？各語系名稱會一起移除。`,
                    confirmLabel: '刪除',
                    cancelLabel: '取消',
                    danger: true,
                });
                if (!ok) {
                    return;
                }
                draft().splice(index, 1);
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
                listEl.querySelectorAll('[data-taxonomy-row]').forEach((item) => {
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
                moveTaxon(dragIndex, index);
            });
        });
    };

    function render() {
        listEl.replaceChildren();
        syncTabs();

        const list = draft();
        if (!list.length) {
            const empty = document.createElement('div');
            empty.className = 'list-empty';
            empty.textContent = '尚未建立分類';
            listEl.appendChild(empty);
            refreshIcons(host);
            return;
        }

        list.forEach((taxon, index) => {
            const name = baseName(taxon);
            const localeName = String(taxon.label[editLocale] || '');
            const untranslated = editLocale !== base && !localeName.trim();

            const row = document.createElement('div');
            row.className = `category-manager-row${untranslated ? ' is-untranslated' : ''}`;
            row.setAttribute('data-taxonomy-row', '');
            row.dataset.index = String(index);
            row.innerHTML = `
                <button type="button" class="category-manager-handle" data-taxonomy-handle aria-label="拖曳排序 ${escapeHtml(name)}">
                    <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                </button>
                <input
                    type="text"
                    class="form-input"
                    data-taxonomy-name
                    maxlength="20"
                    value="${escapeHtml(localeName)}"
                    placeholder="${escapeHtml(untranslated ? name : '')}"
                    aria-label="${escapeHtml(`${name} 的 ${editLocale} 名稱`)}"
                >
                <div class="inline-flex items-center shrink-0">
                    <button type="button" class="icon-action" data-taxonomy-move="-1" aria-label="上移" ${index === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-up" class="w-4 h-4"></i>
                    </button>
                    <button type="button" class="icon-action" data-taxonomy-move="1" aria-label="下移" ${index === list.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </button>
                    <button type="button" class="icon-action" data-taxonomy-delete aria-label="刪除 ${escapeHtml(name)}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            listEl.appendChild(row);
        });
        refreshIcons(host);
        bindRowEvents();
    }

    host.querySelectorAll('[data-taxonomy-kind]').forEach((tab) => {
        tab.addEventListener('click', () => {
            editKind = tab.dataset.taxonomyKind;
            closeAddPanel();
            render();
        });
    });

    host.querySelectorAll('[data-taxonomy-locale]').forEach((tab) => {
        tab.addEventListener('click', () => {
            editLocale = tab.dataset.taxonomyLocale;
            closeAddPanel();
            render();
        });
    });

    host.querySelector('[data-taxonomy-add-open]')?.addEventListener('click', () => {
        if (addPanel) addPanel.hidden = false;
        addInput?.focus();
    });
    host.querySelector('[data-taxonomy-add-cancel]')?.addEventListener('click', closeAddPanel);
    addInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            host.querySelector('[data-taxonomy-add-confirm]')?.click();
        }
    });
    host.querySelector('[data-taxonomy-add-confirm]')?.addEventListener('click', () => {
        const label = addInput?.value.trim() || '';
        if (!label) {
            addInput?.classList.add('form-error');
            showToast('請輸入分類名稱', 'error');
            return;
        }
        if (draft().some((taxon) => String(taxon.label[base] || '').trim() === label)) {
            addInput?.classList.add('form-error');
            showToast('此分類已存在', 'error');
            return;
        }
        draft().push({
            value: uniqueTaxonValue(label, draft(), taxonomyConfig(editKind).idPrefix),
            label: { [base]: label },
        });
        closeAddPanel();
        render();
    });

    host.addEventListener('click', (event) => {
        if (event.target.closest('[data-taxonomy-dismiss]')) {
            close();
        }
    });

    host.querySelector('[data-taxonomy-save]')?.addEventListener('click', () => {
        const cleanedByKind = {};

        for (const entry of TAXONOMIES) {
            const cleaned = [];
            for (const taxon of drafts[entry.kind]) {
                const label = {};
                LOCALES.forEach((locale) => {
                    const text = String(taxon.label[locale] || '').trim();
                    if (text) {
                        label[locale] = text;
                    }
                });

                if (!label[base]) {
                    editKind = entry.kind;
                    editLocale = base;
                    render();
                    showToast(`請先填寫${entry.title}的 ${base} 名稱`, 'error');
                    return;
                }
                if (cleaned.some((item) => item.label[base] === label[base])) {
                    editKind = entry.kind;
                    render();
                    showToast(`${entry.title}名稱不可重複`, 'error');
                    return;
                }

                cleaned.push({ value: taxon.value, label });
            }

            if (!cleaned.length) {
                editKind = entry.kind;
                render();
                showToast(`${entry.title}至少需保留一個分類`, 'error');
                return;
            }

            cleanedByKind[entry.kind] = cleaned;
        }

        /* 分類被移除時，連帶清掉掛在該分類底下的 FAQ */
        const state = faqState(meta);
        const orphaned = new Set();
        TAXONOMIES.forEach((entry) => {
            const kept = new Set(cleanedByKind[entry.kind].map((taxon) => taxon.value));
            state.faqs.forEach((faq) => {
                if (!kept.has(String(faq[entry.faqKey]))) {
                    orphaned.add(faq.id);
                }
            });
        });

        TAXONOMIES.forEach((entry) => persistTaxonomy(meta, entry.kind, cleanedByKind[entry.kind]));
        if (orphaned.size) {
            snapshotFaqs(meta, faqState(meta).faqs.filter((faq) => !orphaned.has(faq.id)));
        }

        onChange?.();
        close();
        showToast('已更新分類', 'success');
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(host);
    render();
    requestAnimationFrame(() => host.classList.add('is-open'));
}

function stripHtml(value) {
    return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function answerHtml(value) {
    const text = String(value || '').trim();
    if (!text) {
        return '<p class="text-gray3">尚無內容</p>';
    }
    if (/<[a-z][\s\S]*>/i.test(text)) {
        return text;
    }
    return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
}

function notifyFaqList(root) {
    if (typeof root?._applyFaqFilter === 'function') {
        root._applyFaqFilter();
        return;
    }
    document.dispatchEvent(new CustomEvent('upas:faqs-updated'));
}

function buildFaqItem(faq, state) {
    const locale = state.locale;
    const question = pickLocale(faq.question, locale) || faq.id;
    const answer = pickLocale(faq.answer, locale);
    const typeLabel = state.types[faq.type] || faq.type;
    const moduleLabel = state.modules[faq.module] || faq.module;
    const translated = locale === baseLocale() || Boolean(faq.question?.[locale]);
    const search = [
        question,
        stripHtml(answer),
        typeLabel,
        moduleLabel,
        pickLocale(faq.question, baseLocale()),
        stripHtml(pickLocale(faq.answer, baseLocale())),
    ].join(' ');

    const article = document.createElement('article');
    article.className = 'faq-item';
    article.dataset.faqItem = '';
    article.dataset.faqId = faq.id;
    article.dataset.type = faq.type;
    article.dataset.module = faq.module;
    article.dataset.search = search;
    article.innerHTML = `
        <div class="faq-heading">
            <button type="button" class="faq-trigger" data-faq-trigger aria-expanded="false">
                <span class="min-w-0 flex-1 flex flex-col-reverse items-start gap-1 md:flex-row md:items-center md:justify-between md:gap-4">
                    <span class="text-cb2 text-gray5 min-w-0 md:flex-1">
                        <span data-faq-question>${escapeHtml(question)}</span>
                        ${!translated ? '<span class="badge-untranslated" data-requires="support.manage">未翻譯</span>' : ''}
                    </span>
                    <span class="inline-flex items-center gap-1.5 shrink-0">
                        <span class="px-2 py-0.5 rounded-md border border-gray1 bg-bg text-[12px] font-medium tracking-[0.06em] text-gray4 uppercase">${escapeHtml(typeLabel)}</span>
                        <span class="px-2 py-0.5 rounded-md border border-gray1 bg-bg text-[12px] font-medium tracking-[0.06em] text-gray4 uppercase">${escapeHtml(moduleLabel)}</span>
                    </span>
                </span>
                <span class="faq-plus" aria-hidden="true">
                    <i data-lucide="plus"></i>
                </span>
            </button>
            <div class="faq-admin" data-faq-admin data-requires="support.manage">
                <a
                    href="${escapeHtml(state.createUrl)}?id=${encodeURIComponent(faq.id)}"
                    class="icon-action"
                    data-faq-edit
                    aria-label="編輯 ${escapeHtml(question)}"
                    title="編輯"
                >
                    <i data-lucide="square-pen" class="w-4 h-4"></i>
                </a>
                <button
                    type="button"
                    class="icon-action"
                    data-faq-delete="${escapeHtml(faq.id)}"
                    aria-label="刪除 ${escapeHtml(question)}"
                    title="刪除"
                >
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
        <div class="faq-panel" data-faq-panel>
            <div class="faq-panel-clip">
                <div class="richtext px-4 pt-4 pb-6" data-faq-answer>${answerHtml(answer)}</div>
            </div>
        </div>
    `;
    return article;
}

function syncFaqList(root, meta) {
    const host = root.querySelector('[data-faq-list]');
    if (!host) {
        return;
    }
    const state = faqState(meta);
    host.replaceChildren();
    state.faqs.forEach((faq) => {
        host.appendChild(buildFaqItem(faq, state));
    });
    applyPreviewRole();
    refreshIcons(host);
    notifyFaqList(root);
}

function openFaqSorter({ meta, onChange }) {
    document.querySelector('[data-faq-sorter-host]')?.remove();

    const state = faqState(meta);
    const host = document.createElement('div');
    host.className = 'app-modal-host';
    host.setAttribute('data-faq-sorter-host', '');
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'faq-sorter-title');

    host.innerHTML = `
        <div class="app-modal-backdrop" data-faq-sorter-dismiss></div>
        <div class="app-modal-panel category-manager-panel">
            <div class="self-stretch inline-flex items-start justify-between gap-3">
                <div class="min-w-0 flex flex-col gap-1">
                    <h3 id="faq-sorter-title" class="text-cb1 text-gray5">排序 FAQ</h3>
                    <p class="text-cb3 text-gray3">調整技術 FAQ 的顯示順序，可用拖曳或上下鍵移動。</p>
                </div>
                <button type="button" class="icon-action -mt-1 -mr-1" data-faq-sorter-dismiss aria-label="關閉">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="category-manager-list" data-faq-sorter-list></div>
            <div class="self-stretch inline-flex items-center justify-end gap-2 pt-1">
                <button type="button" class="btn-secondary" data-faq-sorter-dismiss>取消</button>
                <button type="button" class="btn-primary" data-faq-sorter-save>完成</button>
            </div>
        </div>
    `;

    const draft = state.faqs.map((faq) => ({
        id: faq.id,
        label: pickLocale(faq.question, baseLocale()) || faq.id,
    }));
    const listEl = host.querySelector('[data-faq-sorter-list]');
    let dragIndex = -1;

    const close = () => {
        host.classList.remove('is-open');
        document.removeEventListener('keydown', onKeyDown);
        window.setTimeout(() => host.remove(), 200);
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    };

    const moveItem = (from, to) => {
        if (from === to || from < 0 || to < 0 || from >= draft.length || to >= draft.length) {
            return;
        }
        const [moved] = draft.splice(from, 1);
        draft.splice(to, 0, moved);
        render();
    };

    const bindRowEvents = () => {
        listEl.querySelectorAll('[data-faq-sorter-row]').forEach((row) => {
            const index = Number(row.dataset.index);
            const handle = row.querySelector('[data-faq-sorter-handle]');

            row.querySelector('[data-faq-sorter-move="-1"]')?.addEventListener('click', () => moveItem(index, index - 1));
            row.querySelector('[data-faq-sorter-move="1"]')?.addEventListener('click', () => moveItem(index, index + 1));

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
                listEl.querySelectorAll('[data-faq-sorter-row]').forEach((item) => {
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
                moveItem(dragIndex, index);
            });
        });
    };

    const render = () => {
        listEl.replaceChildren();
        if (!draft.length) {
            const empty = document.createElement('div');
            empty.className = 'list-empty';
            empty.textContent = '尚無 FAQ';
            listEl.appendChild(empty);
            refreshIcons(host);
            return;
        }

        draft.forEach((faq, index) => {
            const row = document.createElement('div');
            row.className = 'category-manager-row';
            row.setAttribute('data-faq-sorter-row', '');
            row.dataset.index = String(index);
            row.innerHTML = `
                <button type="button" class="category-manager-handle" data-faq-sorter-handle aria-label="拖曳排序 ${escapeHtml(faq.label)}">
                    <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                </button>
                <p class="min-w-0 flex-1 text-cb3 text-gray5 truncate px-1">${escapeHtml(faq.label)}</p>
                <div class="inline-flex items-center shrink-0">
                    <button type="button" class="icon-action" data-faq-sorter-move="-1" aria-label="上移" ${index === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-up" class="w-4 h-4"></i>
                    </button>
                    <button type="button" class="icon-action" data-faq-sorter-move="1" aria-label="下移" ${index === draft.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            listEl.appendChild(row);
        });
        refreshIcons(host);
        bindRowEvents();
    };

    host.addEventListener('click', (event) => {
        if (event.target.closest('[data-faq-sorter-dismiss]')) {
            close();
        }
    });

    host.querySelector('[data-faq-sorter-save]')?.addEventListener('click', () => {
        persistFaqOrder(meta, draft.map((faq) => faq.id));
        onChange?.();
        close();
        showToast('已更新 FAQ 順序', 'success');
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(host);
    render();
    requestAnimationFrame(() => host.classList.add('is-open'));
}

async function handleFaqDelete(event, root, meta) {
    const deleteBtn = event.target.closest('[data-faq-delete]');
    if (!deleteBtn || !root.contains(deleteBtn)) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
        showToast('目前身分權限無法刪除資料', 'error');
        return;
    }

    const id = deleteBtn.dataset.faqDelete;
    const faq = findFaq(meta, id);
    const title = (faq ? pickLocale(faq.question, baseLocale()) : '') || id || '此筆 FAQ';
    const ok = await showConfirm({
        title: '刪除 FAQ',
        message: `確定刪除「${escapeHtml(title)}」？三個語系的內容都會一併刪除，且無法復原。`,
        confirmLabel: '刪除',
        cancelLabel: '取消',
        danger: true,
    });

    if (!ok) {
        return;
    }

    deleteFaq(meta, id);
    syncFaqList(root, meta);
    showToast('已刪除 FAQ', 'success');
}

function bindFaqList(root) {
    const meta = readFaqMeta();
    if (!meta) {
        return;
    }

    meta.capability = root.dataset.manage || meta.capability || 'support.manage';
    meta.createUrl = root.dataset.faqCreateUrl || meta.createFaqUrl || meta.createUrl || '';
    meta.createFaqUrl = meta.createUrl;
    meta.listUrl = root.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    const syncFilterOptions = () => {
        const state = faqState(meta);
        root.querySelectorAll('[data-faq-filter]').forEach((select) => {
            const list = select.dataset.faqFilter === 'module' ? state.moduleList : state.typeList;
            rebuildSelectOptions(select, list, state.locale);
        });
    };

    const syncAll = () => {
        syncFilterOptions();
        syncFaqList(root, meta);
    };

    syncAll();

    root.addEventListener('click', (event) => {
        const manageBtn = event.target.closest('[data-faq-manage-categories]');
        if (manageBtn && root.contains(manageBtn)) {
            event.preventDefault();
            if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
                showToast('目前身分權限無法管理分類', 'error');
                return;
            }
            openTaxonomyManager({ meta, kind: 'type', onChange: syncAll });
            return;
        }

        const sortBtn = event.target.closest('[data-faq-sort]');
        if (sortBtn && root.contains(sortBtn)) {
            event.preventDefault();
            if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
                showToast('目前身分權限無法排序 FAQ', 'error');
                return;
            }
            openFaqSorter({
                meta,
                onChange: () => syncFaqList(root, meta),
            });
            return;
        }
        handleFaqDelete(event, root, meta);
    });

    document.addEventListener('upas:localechange', syncAll);
}

function emptySlice() {
    return { question: '', answer: '' };
}

function readLocaleSlice(form) {
    return {
        question: form.querySelector('[name="question"]')?.value.trim() || '',
        answer: form.querySelector('[name="answer"]')?.value || '',
    };
}

function applyLocaleSlice(form, slice) {
    const questionInput = form.querySelector('[name="question"]');
    const answerInput = form.querySelector('[name="answer"]');
    if (questionInput) questionInput.value = slice.question || '';
    if (answerInput) answerInput.value = slice.answer || '';
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
}

function sliceHasContent(slice) {
    return Boolean(slice.question || String(slice.answer || '').trim());
}

function collectFaq(form, currentId, draft, existingIds) {
    const question = {};
    const answer = {};
    LOCALES.forEach((locale) => {
        const slice = draft[locale] || emptySlice();
        if (slice.question) question[locale] = slice.question;
        if (String(slice.answer || '').trim()) answer[locale] = slice.answer;
    });
    return {
        id: currentId || uniqueId(question[baseLocale()] || 'faq', existingIds),
        type: form.querySelector('[name="type"]')?.value.trim() || '',
        module: form.querySelector('[name="module"]')?.value.trim() || '',
        question,
        answer,
    };
}

function validateShared(form) {
    let valid = true;
    ['type', 'module'].forEach((name) => {
        const field = form.querySelector(`[name="${name}"]`);
        const trigger = field?.closest('[data-form-select]')?.querySelector('[data-form-select-trigger]');
        const empty = !String(field?.value || '').trim();
        if (trigger) {
            trigger.classList.toggle('form-error', empty);
        }
        if (empty) {
            valid = false;
        }
    });
    return valid;
}

function validateLocaleSlice(slice, { required }) {
    const errors = [];
    if (required && !slice.question) errors.push('question');
    if (required && !String(slice.answer || '').trim()) errors.push('answer');
    return errors;
}

function markLocaleErrors(form, errors) {
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
    if (errors.includes('question')) form.querySelector('[name="question"]')?.classList.add('form-error');
    if (errors.includes('answer')) form.querySelector('[name="answer"]')?.classList.add('form-error');
}

function setView(form, toolbar, missing, forbidden, mode) {
    if (form) form.hidden = mode !== 'form';
    if (toolbar) toolbar.hidden = mode !== 'form';
    if (missing) missing.hidden = mode !== 'missing';
    if (forbidden) forbidden.hidden = mode !== 'forbidden';
}

function bindFaqForm(form) {
    const meta = readFaqMeta();
    if (!meta) {
        return;
    }

    meta.capability = form.dataset.manage || meta.capability || 'support.manage';
    meta.createUrl = form.dataset.createUrl || meta.createUrl || meta.createFaqUrl || '';
    meta.listUrl = form.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    const base = baseLocale();
    const toolbar = document.querySelector('[data-faq-form-toolbar]');
    const missing = document.querySelector('[data-faq-missing]');
    const forbidden = document.querySelector('[data-faq-forbidden]');
    const crumb = document.querySelector('[data-faq-form-crumb]');
    const heading = document.querySelector('[data-page-heading]');
    const copy = meta.copy || {};
    const editingId = new URLSearchParams(window.location.search).get('id') || '';

    const applyAccess = () => {
        const allowed = typeof app().roleCan !== 'function' || app().roleCan(meta.capability);
        if (!allowed) {
            setView(form, toolbar, missing, forbidden, 'forbidden');
            if (crumb) crumb.textContent = copy.headingNew || '新增 FAQ';
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
        current = findFaq(meta, editingId);
        if (!current) {
            setView(form, toolbar, missing, forbidden, 'missing');
            if (crumb) crumb.textContent = copy.headingEdit || '編輯 FAQ';
            return;
        }
    }

    setView(form, toolbar, missing, forbidden, 'form');

    const typeSelect = form.querySelector('[name="type"]')?.closest('[data-form-select]');
    const moduleSelect = form.querySelector('[name="module"]')?.closest('[data-form-select]');

    const syncTaxonomySelects = () => {
        const state = faqState(meta);
        rebuildSelectOptions(typeSelect, state.typeList, state.locale);
        rebuildSelectOptions(moduleSelect, state.moduleList, state.locale);
    };

    syncTaxonomySelects();

    form.addEventListener('click', (event) => {
        const manageBtn = event.target.closest('[data-faq-manage-categories]');
        if (!manageBtn || !form.contains(manageBtn)) {
            return;
        }
        event.preventDefault();
        if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
            showToast('目前身分權限無法管理分類', 'error');
            return;
        }
        openTaxonomyManager({
            meta,
            kind: manageBtn.dataset.faqManageCategories || 'type',
            onChange: syncTaxonomySelects,
        });
    });

    const draft = {};
    LOCALES.forEach((locale) => {
        draft[locale] = {
            question: current?.question?.[locale] || '',
            answer: current?.answer?.[locale] || '',
        };
    });

    let editLocale = LOCALES.includes(activeLocale()) ? activeLocale() : base;

    const syncLocaleTabs = () => {
        form.querySelectorAll('[data-form-locale]').forEach((tab) => {
            const locale = tab.dataset.formLocale;
            const active = locale === editLocale;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            const dot = tab.querySelector('[data-locale-incomplete]');
            if (dot) {
                const slice = locale === editLocale ? readLocaleSlice(form) : (draft[locale] || emptySlice());
                dot.hidden = locale === base || Boolean(slice.question);
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
        syncLocaleTabs();
    };

    form.querySelectorAll('[data-form-locale]').forEach((tab) => {
        tab.addEventListener('click', () => switchLocale(tab.dataset.formLocale));
    });
    form.querySelector('[name="question"]')?.addEventListener('input', syncLocaleTabs);

    if (current) {
        form.querySelector('[name="id"]').value = current.id;
        setFormSelectByValue(typeSelect, current.type || '');
        setFormSelectByValue(moduleSelect, current.module || '');
        if (heading) heading.textContent = copy.headingEdit || '編輯 FAQ';
        if (crumb) crumb.textContent = copy.headingEdit || '編輯 FAQ';
        const submitLabel = form.querySelector('[data-faq-submit-label]');
        if (submitLabel) submitLabel.textContent = copy.submitEdit || '儲存變更';
        const asideTitle = form.querySelector('[data-faq-aside-title]');
        if (asideTitle) asideTitle.textContent = copy.asideEdit || '儲存變更';
    } else {
        if (heading) heading.textContent = copy.headingNew || '新增 FAQ';
        if (crumb) crumb.textContent = copy.headingNew || '新增 FAQ';
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

        const existingIds = faqState(meta).faqs.map((item) => item.id);
        const faq = collectFaq(form, current?.id || '', draft, existingIds);
        if (!current) {
            faq.id = uniqueId(faq.question[base] || 'faq', existingIds);
        }
        upsertFaq(meta, faq, { prepend: !current });
        showToast(current ? (copy.savedEdit || '已儲存 FAQ') : (copy.savedNew || '已發布 FAQ'), 'success');
        window.setTimeout(() => {
            window.location.href = form.dataset.listUrl || meta.listUrl || '../';
        }, 350);
    });

    document.addEventListener('upas:rolechange', () => applyAccess());
    document.addEventListener('upas:localechange', (event) => {
        switchLocale(event.detail?.locale);
        syncTaxonomySelects();
    });
}

document.querySelectorAll('[data-support-center]').forEach(bindFaqList);
document.querySelectorAll('[data-faq-form]').forEach(bindFaqForm);
