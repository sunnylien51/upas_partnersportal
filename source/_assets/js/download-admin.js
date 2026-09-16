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
        console.warn('Unable to parse support download data', error);
        return null;
    }
}

function readDownloadMeta() {
    return readJson('support-download-data') || readJson('support-center-data');
}

const STORE_KEY = 'upas-support-downloads';
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

/* ---------- 附件格式 ---------- */

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

/* 格式一律從檔名或網址推導，種子資料的 format 只當推導不出來時的備援 */
function detectFormat(asset) {
    if (!asset) {
        return '';
    }
    if ((asset.attachment || 'download') === 'link') {
        return extensionFromName(asset.attachmentUrl) || 'Link';
    }
    return extensionFromName(asset.attachmentName) || '';
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

/* ---------- 儲存 ---------- */

function emptyStore() {
    return { items: [], deleted: [], managed: false };
}

function readStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        return {
            items: Array.isArray(parsed.items) ? parsed.items : [],
            deleted: Array.isArray(parsed.deleted) ? parsed.deleted.map(String) : [],
            managed: Boolean(parsed.managed),
        };
    } catch (error) {
        return emptyStore();
    }
}

function writeStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify({
        items: store.items || [],
        deleted: store.deleted || [],
        managed: Boolean(store.managed),
    }));
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

function hasAsset(asset) {
    if (!asset) {
        return false;
    }
    return Boolean(asset.attachment === 'link' ? asset.attachmentUrl : asset.attachmentName);
}

function normalizeDownload(raw) {
    const id = String(raw?.id || '').trim();
    if (!id) {
        return null;
    }

    const assets = {};
    if (raw.assets && typeof raw.assets === 'object') {
        LOCALES.forEach((locale) => {
            const asset = normalizeAsset(raw.assets[locale]);
            if (asset) {
                assets[locale] = asset;
            }
        });
    } else {
        /* 種子資料把附件欄位攤平在最外層，視為基準語系的附件 */
        const legacy = normalizeAsset(raw);
        if (legacy) {
            assets[baseLocale()] = legacy;
        }
    }

    return { id, title: toLocaleMap(raw.title ?? raw.titles), assets };
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

/* 基準語系永遠視為完整；其他語系以標題是否填寫為準（附件可刻意共用基準語系） */
function isTranslated(item, locale) {
    return locale === baseLocale() || Boolean(item.title?.[locale]);
}

function localizedDownload(item, locale) {
    const asset = pickAsset(item.assets, locale) || {};
    return {
        id: item.id,
        title: pickLocale(item.title, locale),
        attachment: asset.attachment || 'download',
        attachmentName: asset.attachmentName || '',
        attachmentSize: asset.attachmentSize || '',
        attachmentType: asset.attachmentType || '',
        attachmentUrl: asset.attachmentUrl || '',
        format: detectFormat(asset) || asset.format || '',
        translated: isTranslated(item, locale),
    };
}

function mergeDownloads(seedItems, stored) {
    const deleted = new Set((stored.deleted || []).map(String));
    const map = new Map();

    (seedItems || []).forEach((raw) => {
        const item = normalizeDownload(raw);
        if (!item || deleted.has(item.id)) {
            return;
        }
        map.set(item.id, item);
    });

    (stored.items || []).forEach((raw) => {
        const item = normalizeDownload(raw);
        if (!item || deleted.has(item.id)) {
            return;
        }
        const previous = map.get(item.id) || {};
        map.set(item.id, {
            ...previous,
            ...item,
            title: { ...(previous.title || {}), ...item.title },
            assets: { ...(previous.assets || {}), ...item.assets },
        });
    });

    if (stored.managed) {
        const ordered = [];
        const seen = new Set();
        (stored.items || []).forEach((raw) => {
            const id = String(raw?.id || '');
            if (!id || seen.has(id) || !map.has(id)) {
                return;
            }
            ordered.push(map.get(id));
            seen.add(id);
        });
        map.forEach((item, id) => {
            if (!seen.has(id)) {
                ordered.push(item);
            }
        });
        return ordered;
    }

    return [...map.values()];
}

function downloadState(meta = {}) {
    const stored = readStore();
    return {
        capability: meta.capability || 'support.manage',
        createUrl: meta.createDownloadUrl || meta.createUrl || '',
        listUrl: meta.listUrl || '',
        items: mergeDownloads(meta.downloads, stored),
        locale: activeLocale(),
        copy: meta.copy || {},
    };
}

function findDownload(meta, id) {
    if (!id) {
        return null;
    }
    return downloadState(meta).items.find((item) => String(item.id) === String(id)) || null;
}

function uniqueId(label, existing) {
    const used = new Set((existing || []).map(String));
    const ascii = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const slug = ascii || Date.now().toString(36);
    const base = `dl-${slug}`;
    if (!used.has(base)) {
        return base;
    }
    let index = 2;
    while (used.has(`${base}-${index}`)) {
        index += 1;
    }
    return `${base}-${index}`;
}

function snapshotDownloads(meta, items) {
    const store = readStore();
    store.items = (items || []).map(normalizeDownload).filter(Boolean);
    store.managed = true;
    const currentIds = new Set(store.items.map((item) => item.id));
    const seedIds = (meta.downloads || []).map((item) => String(item.id || '')).filter(Boolean);
    store.deleted = seedIds.filter((id) => !currentIds.has(id));
    writeStore(store);
}

function upsertDownload(meta, item, { prepend = false } = {}) {
    const normalized = normalizeDownload(item);
    if (!normalized) {
        return;
    }
    const next = [...downloadState(meta).items];
    const index = next.findIndex((entry) => String(entry.id) === normalized.id);
    if (index >= 0) {
        next[index] = normalized;
    } else if (prepend) {
        next.unshift(normalized);
    } else {
        next.push(normalized);
    }
    snapshotDownloads(meta, next);
}

function deleteDownload(meta, id) {
    const key = String(id || '');
    if (!key) {
        return;
    }
    snapshotDownloads(meta, downloadState(meta).items.filter((item) => String(item.id) !== key));
}

function persistDownloadOrder(meta, orderedIds) {
    const items = downloadState(meta).items;
    const byId = new Map(items.map((item) => [String(item.id), item]));
    const ordered = [];
    const seen = new Set();
    (orderedIds || []).forEach((id) => {
        const key = String(id);
        const item = byId.get(key);
        if (!item || seen.has(key)) {
            return;
        }
        ordered.push(item);
        seen.add(key);
    });
    items.forEach((item) => {
        if (!seen.has(item.id)) {
            ordered.push(item);
        }
    });
    snapshotDownloads(meta, ordered);
}

function applyPreviewRole() {
    if (typeof app().applyPreviewRole === 'function' && typeof app().getPreviewRole === 'function') {
        app().applyPreviewRole(app().getPreviewRole());
    }
}

/* ---------- 列表 ---------- */

function buildDownloadRow(record, state) {
    const item = localizedDownload(record, state.locale);
    const isDownload = item.attachment !== 'link';
    const title = item.title || item.id;

    const row = document.createElement('div');
    row.className = 'file-upload-item';
    row.setAttribute('data-download-item', '');
    row.dataset.downloadId = item.id;
    row.innerHTML = `
        <div class="inline-flex items-center gap-3 min-w-0">
            <span class="file-icon">
                <i data-lucide="${isDownload ? 'file-text' : 'external-link'}" class="w-4 h-4 text-gray4"></i>
            </span>
            <span class="min-w-0 flex flex-col items-start gap-0.5">
                <span class="min-w-0 max-w-full inline-flex items-center gap-1.5">
                    <span class="text-cb3 text-gray5 truncate">${escapeHtml(title)}</span>
                    ${item.translated ? '' : `<span class="badge-untranslated shrink-0" data-requires="${escapeHtml(state.capability)}">未翻譯</span>`}
                </span>
                <span class="text-[11px] font-medium text-gray3 uppercase">${escapeHtml(item.format || '—')}</span>
            </span>
        </div>
        <div class="inline-flex items-center gap-1 shrink-0">
            <button type="button" class="px-3 py-2 text-[12px] btn-secondary" data-resource-action="${isDownload ? 'download' : 'link'}">
                <i data-lucide="${isDownload ? 'download' : 'external-link'}" class="w-3.5 h-3.5"></i>
                <span>${isDownload ? '下載' : '連結'}</span>
            </button>
            <span class="inline-flex items-center" data-download-admin data-requires="${escapeHtml(state.capability)}">
                <a
                    href="${escapeHtml(state.createUrl)}?id=${encodeURIComponent(item.id)}"
                    class="icon-action"
                    data-download-edit
                    aria-label="編輯 ${escapeHtml(title)}"
                    title="編輯"
                >
                    <i data-lucide="square-pen" class="w-4 h-4"></i>
                </a>
                <button
                    type="button"
                    class="icon-action"
                    data-download-delete="${escapeHtml(item.id)}"
                    aria-label="刪除 ${escapeHtml(title)}"
                    title="刪除"
                >
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </span>
        </div>
    `;
    return row;
}

function syncDownloadList(root, meta, options = {}) {
    const host = root.querySelector('[data-download-list]');
    if (!host) {
        return;
    }

    const summary = root.querySelector('[data-download-summary]');
    const pagination = root.querySelector('[data-download-pagination]');
    const pageSize = Number(root.dataset.downloadPageSize || 5);
    let page = Number(root.dataset.downloadPage || 1);
    if (options.resetPage) {
        page = 1;
    }

    const state = downloadState(meta);
    const total = state.items.length;
    const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > pages) {
        page = pages;
    }
    root.dataset.downloadPage = String(page);

    const start = total === 0 ? 0 : (page - 1) * pageSize;
    const end = start + pageSize;
    const visible = state.items.slice(start, end);

    host.replaceChildren();
    visible.forEach((item) => {
        host.appendChild(buildDownloadRow(item, state));
    });

    const empty = root.querySelector('[data-download-empty]');
    if (empty) {
        empty.hidden = total > 0;
    }

    if (summary) {
        summary.textContent = total === 0
            ? 'Showing 0 of 0 results'
            : `Showing ${start + 1}-${Math.min(end, total)} of ${total} results`;
    }

    if (pagination) {
        pagination.replaceChildren();

        const appendBtn = ({ label, icon, target, active, disabled, last, aria }) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `pagination-btn${active ? ' is-active' : ''}${!icon && !active ? ' text-gray3' : ''}${last ? ' border-r-0' : ''}`;
            if (aria) {
                btn.setAttribute('aria-label', aria);
            }
            if (disabled) {
                btn.disabled = true;
            }
            if (icon) {
                const iconEl = document.createElement('i');
                iconEl.setAttribute('data-lucide', icon);
                iconEl.className = 'w-4 h-4 text-gray4';
                btn.appendChild(iconEl);
            } else {
                btn.textContent = label;
            }
            if (!disabled && target != null) {
                btn.addEventListener('click', () => {
                    root.dataset.downloadPage = String(target);
                    syncDownloadList(root, meta);
                });
            }
            pagination.appendChild(btn);
        };

        appendBtn({
            icon: 'chevron-left',
            target: page - 1,
            disabled: page <= 1,
            aria: '上一頁',
        });

        for (let index = 1; index <= pages; index += 1) {
            appendBtn({
                label: String(index),
                target: index,
                active: index === page,
            });
        }

        appendBtn({
            icon: 'chevron-right',
            target: page + 1,
            disabled: page >= pages,
            last: true,
            aria: '下一頁',
        });

        refreshIcons(pagination);
    }

    applyPreviewRole();
    refreshIcons(host);
}

/* ---------- 排序彈窗 ---------- */

function openDownloadSorter({ meta, onChange }) {
    document.querySelector('[data-download-sorter-host]')?.remove();

    const state = downloadState(meta);
    const host = document.createElement('div');
    host.className = 'app-modal-host';
    host.setAttribute('data-download-sorter-host', '');
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'download-sorter-title');

    host.innerHTML = `
        <div class="app-modal-backdrop" data-download-sorter-dismiss></div>
        <div class="app-modal-panel category-manager-panel">
            <div class="self-stretch inline-flex items-start justify-between gap-3">
                <div class="min-w-0 flex flex-col gap-1">
                    <h3 id="download-sorter-title" class="text-cb1 text-gray5">排序檔案下載</h3>
                    <p class="text-cb3 text-gray3">調整檔案下載的顯示順序，可用拖曳或上下鍵移動。</p>
                </div>
                <button type="button" class="icon-action -mt-1 -mr-1" data-download-sorter-dismiss aria-label="關閉">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="category-manager-list" data-download-sorter-list></div>
            <div class="self-stretch inline-flex items-center justify-end gap-2 pt-1">
                <button type="button" class="btn-secondary" data-download-sorter-dismiss>取消</button>
                <button type="button" class="btn-primary" data-download-sorter-save>完成</button>
            </div>
        </div>
    `;

    const draft = state.items.map((item) => ({
        id: item.id,
        label: pickLocale(item.title, baseLocale()) || item.id,
    }));
    const listEl = host.querySelector('[data-download-sorter-list]');
    let dragIndex = -1;

    const close = () => {
        host.classList.remove('is-open');
        document.removeEventListener('keydown', onKeyDown);
        window.setTimeout(() => host.remove(), 200);
    };

    function onKeyDown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    }

    const moveItem = (from, to) => {
        if (from === to || from < 0 || to < 0 || from >= draft.length || to >= draft.length) {
            return;
        }
        const [moved] = draft.splice(from, 1);
        draft.splice(to, 0, moved);
        render();
    };

    const bindRowEvents = () => {
        listEl.querySelectorAll('[data-download-sorter-row]').forEach((row) => {
            const index = Number(row.dataset.index);
            const handle = row.querySelector('[data-download-sorter-handle]');

            row.querySelector('[data-download-sorter-move="-1"]')?.addEventListener('click', () => moveItem(index, index - 1));
            row.querySelector('[data-download-sorter-move="1"]')?.addEventListener('click', () => moveItem(index, index + 1));

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
                listEl.querySelectorAll('[data-download-sorter-row]').forEach((item) => {
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

    function render() {
        listEl.replaceChildren();
        if (!draft.length) {
            const empty = document.createElement('div');
            empty.className = 'list-empty';
            empty.textContent = '尚無檔案';
            listEl.appendChild(empty);
            refreshIcons(host);
            return;
        }

        draft.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'category-manager-row';
            row.setAttribute('data-download-sorter-row', '');
            row.dataset.index = String(index);
            row.innerHTML = `
                <button type="button" class="category-manager-handle" data-download-sorter-handle aria-label="拖曳排序 ${escapeHtml(item.label)}">
                    <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                </button>
                <p class="min-w-0 flex-1 text-cb3 text-gray5 truncate px-1">${escapeHtml(item.label)}</p>
                <div class="inline-flex items-center shrink-0">
                    <button type="button" class="icon-action" data-download-sorter-move="-1" aria-label="上移" ${index === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-up" class="w-4 h-4"></i>
                    </button>
                    <button type="button" class="icon-action" data-download-sorter-move="1" aria-label="下移" ${index === draft.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            listEl.appendChild(row);
        });
        refreshIcons(host);
        bindRowEvents();
    }

    host.addEventListener('click', (event) => {
        if (event.target.closest('[data-download-sorter-dismiss]')) {
            close();
        }
    });

    host.querySelector('[data-download-sorter-save]')?.addEventListener('click', () => {
        persistDownloadOrder(meta, draft.map((item) => item.id));
        onChange?.();
        close();
        showToast('已更新檔案順序', 'success');
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(host);
    render();
    requestAnimationFrame(() => host.classList.add('is-open'));
}

async function handleDownloadDelete(event, root, meta) {
    const deleteBtn = event.target.closest('[data-download-delete]');
    if (!deleteBtn || !root.contains(deleteBtn)) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
        showToast('目前身分權限無法刪除資料', 'error');
        return;
    }

    const id = deleteBtn.dataset.downloadDelete;
    const item = findDownload(meta, id);
    const title = (item ? pickLocale(item.title, baseLocale()) : '') || id || '此筆檔案';
    const ok = await showConfirm({
        title: '刪除檔案',
        message: `確定刪除「${escapeHtml(title)}」？三個語系的內容都會一併刪除，且無法復原。`,
        confirmLabel: '刪除',
        cancelLabel: '取消',
        danger: true,
    });

    if (!ok) {
        return;
    }

    deleteDownload(meta, id);
    syncDownloadList(root, meta);
    showToast('已刪除檔案', 'success');
}

function bindDownloadList(root) {
    const meta = readDownloadMeta();
    if (!meta) {
        return;
    }

    meta.capability = root.dataset.manage || meta.capability || 'support.manage';
    meta.createDownloadUrl = root.dataset.downloadCreateUrl || meta.createDownloadUrl || '';
    meta.listUrl = root.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    const sync = (options = {}) => syncDownloadList(root, meta, options);
    sync();

    root.addEventListener('click', (event) => {
        const sortBtn = event.target.closest('[data-download-sort]');
        if (sortBtn && root.contains(sortBtn)) {
            event.preventDefault();
            if (typeof app().roleCan === 'function' && !app().roleCan(meta.capability)) {
                showToast('目前身分權限無法排序檔案', 'error');
                return;
            }
            openDownloadSorter({
                meta,
                onChange: () => sync({ resetPage: true }),
            });
            return;
        }
        handleDownloadDelete(event, root, meta);
    });

    document.addEventListener('upas:localechange', () => sync());
}

/* ---------- 表單 ---------- */

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

function sliceFromAsset(title, asset) {
    return {
        title: title || '',
        attachment: asset?.attachment === 'link' ? 'link' : 'download',
        attachmentName: asset?.attachmentName || '',
        attachmentSize: asset?.attachmentSize || '',
        attachmentType: asset?.attachmentType || '',
        attachmentUrl: asset?.attachmentUrl || '',
    };
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
        input.closest('.source-option')?.classList.toggle('is-selected', input.checked);
    });
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

function readLocaleSlice(form) {
    return {
        title: form.querySelector('[name="title"]')?.value.trim() || '',
        attachment: form.querySelector('[name="attachment"]:checked')?.value === 'link' ? 'link' : 'download',
        attachmentName: form.querySelector('[name="attachment_name"]')?.value.trim() || '',
        attachmentSize: form.querySelector('[name="attachment_size"]')?.value.trim() || '',
        attachmentType: form.querySelector('[name="attachment_type"]')?.value.trim() || '',
        attachmentUrl: form.querySelector('[name="attachment_url"]')?.value.trim() || '',
    };
}

function applyLocaleSlice(form, slice) {
    const titleInput = form.querySelector('[name="title"]');
    if (titleInput) titleInput.value = slice.title || '';

    const urlInput = form.querySelector('[name="attachment_url"]');
    if (urlInput) urlInput.value = slice.attachmentUrl || '';

    const radio = form.querySelector(`[name="attachment"][value="${slice.attachment === 'link' ? 'link' : 'download'}"]`);
    if (radio) radio.checked = true;

    const upload = form.querySelector('[data-file-upload]');
    upload?._applyFileMeta?.(slice.attachmentName
        ? {
            name: slice.attachmentName,
            size: Number(slice.attachmentSize) || 0,
            type: slice.attachmentType || '',
        }
        : null);

    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
    syncSourceOptions(form);
    syncAttachmentUi(form);
}

function sliceHasAsset(slice) {
    return Boolean(slice.attachment === 'link' ? slice.attachmentUrl : slice.attachmentName);
}

function sliceHasContent(slice) {
    return Boolean(slice.title) || sliceHasAsset(slice);
}

function collectDownload(currentId, draft, existingIds) {
    const title = {};
    const assets = {};

    LOCALES.forEach((locale) => {
        const slice = draft[locale] || emptySlice();
        if (slice.title) {
            title[locale] = slice.title;
        }
        if (!sliceHasAsset(slice)) {
            return;
        }
        const asset = {
            attachment: slice.attachment === 'link' ? 'link' : 'download',
            attachmentName: slice.attachment === 'link' ? '' : slice.attachmentName,
            attachmentSize: slice.attachment === 'link' ? '' : slice.attachmentSize,
            attachmentType: slice.attachment === 'link' ? '' : slice.attachmentType,
            attachmentUrl: slice.attachment === 'link' ? slice.attachmentUrl : '',
        };
        assets[locale] = { ...asset, format: detectFormat(asset) };
    });

    return {
        id: currentId || uniqueId(title[baseLocale()] || 'file', existingIds),
        title,
        assets,
    };
}

function validateLocaleSlice(slice, { required }) {
    const errors = [];
    if (required && !slice.title) {
        errors.push('title');
    }
    if (slice.attachment === 'link') {
        if (required && !slice.attachmentUrl) {
            errors.push('attachment_url');
        } else if (slice.attachmentUrl && !isValidUrl(slice.attachmentUrl)) {
            errors.push('attachment_url');
        }
    } else if (required && !slice.attachmentName) {
        errors.push('attachment_file');
    }
    return errors;
}

function markLocaleErrors(form, errors) {
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
    if (errors.includes('title')) {
        form.querySelector('[name="title"]')?.classList.add('form-error');
    }
    if (errors.includes('attachment_url')) {
        form.querySelector('[name="attachment_url"]')?.classList.add('form-error');
    }
    if (errors.includes('attachment_file')) {
        form.querySelector('[data-file-trigger]')?.classList.add('form-error');
    }
}

/* 標題缺漏優先提示，附件訊息只在標題已填時才更具體 */
function errorMessage(errors, locale, base) {
    if (errors.includes('title')) {
        return locale === base ? `請先完成 ${base} 的必填欄位` : `${locale} 尚有未填欄位`;
    }
    if (errors.includes('attachment_file')) {
        return '請先選擇要上傳的檔案';
    }
    if (errors.includes('attachment_url')) {
        return '請輸入有效的連結網址';
    }
    return locale === base ? `請先完成 ${base} 的必填欄位` : `${locale} 尚有未填欄位`;
}

function setView(form, toolbar, missing, forbidden, mode) {
    if (form) form.hidden = mode !== 'form';
    if (toolbar) toolbar.hidden = mode !== 'form';
    if (missing) missing.hidden = mode !== 'missing';
    if (forbidden) forbidden.hidden = mode !== 'forbidden';
}

function bindDownloadForm(form) {
    const meta = readDownloadMeta();
    if (!meta) {
        return;
    }

    meta.capability = form.dataset.manage || meta.capability || 'support.manage';
    meta.createDownloadUrl = form.dataset.createUrl || meta.createDownloadUrl || '';
    meta.listUrl = form.dataset.listUrl || meta.listUrl || '';
    setLocales(meta.locales);

    const base = baseLocale();
    const toolbar = document.querySelector('[data-download-form-toolbar]');
    const missing = document.querySelector('[data-download-missing]');
    const forbidden = document.querySelector('[data-download-forbidden]');
    const crumb = document.querySelector('[data-download-form-crumb]');
    const heading = document.querySelector('[data-page-heading]');
    const copy = meta.copy || {};
    const editingId = new URLSearchParams(window.location.search).get('id') || '';

    const applyAccess = () => {
        const allowed = typeof app().roleCan !== 'function' || app().roleCan(meta.capability);
        if (!allowed) {
            setView(form, toolbar, missing, forbidden, 'forbidden');
            if (crumb) crumb.textContent = copy.headingNew || '新增檔案';
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
        current = findDownload(meta, editingId);
        if (!current) {
            setView(form, toolbar, missing, forbidden, 'missing');
            if (crumb) crumb.textContent = copy.headingEdit || '編輯檔案';
            return;
        }
    }

    setView(form, toolbar, missing, forbidden, 'form');

    bindFileUpload(form.querySelector('[data-file-upload]'));

    const draft = {};
    LOCALES.forEach((locale) => {
        draft[locale] = sliceFromAsset(current?.title?.[locale] || '', current?.assets?.[locale]);
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
        syncLocaleTabs();
    };

    form.querySelectorAll('[data-form-locale]').forEach((tab) => {
        tab.addEventListener('click', () => switchLocale(tab.dataset.formLocale));
    });
    form.querySelector('[name="title"]')?.addEventListener('input', syncLocaleTabs);
    form.querySelectorAll('[data-source-input]').forEach((input) => {
        input.addEventListener('change', () => {
            syncSourceOptions(form);
            syncAttachmentUi(form);
        });
    });

    if (current) {
        form.querySelector('[name="id"]').value = current.id;
        if (heading) heading.textContent = copy.headingEdit || '編輯檔案';
        if (crumb) crumb.textContent = copy.headingEdit || '編輯檔案';
        const submitLabel = form.querySelector('[data-download-submit-label]');
        if (submitLabel) submitLabel.textContent = copy.submitEdit || '儲存變更';
        const asideTitle = form.querySelector('[data-download-aside-title]');
        if (asideTitle) asideTitle.textContent = copy.asideEdit || '儲存變更';
    } else {
        if (heading) heading.textContent = copy.headingNew || '新增檔案';
        if (crumb) crumb.textContent = copy.headingNew || '新增檔案';
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
            showToast(errorMessage(errors, locale, base), 'error');
            return;
        }

        const existingIds = downloadState(meta).items.map((item) => item.id);
        const item = collectDownload(current?.id || '', draft, existingIds);
        upsertDownload(meta, item, { prepend: !current });
        showToast(current ? (copy.savedEdit || '已儲存檔案') : (copy.savedNew || '已新增檔案'), 'success');
        window.setTimeout(() => {
            window.location.href = form.dataset.listUrl || meta.listUrl || '../';
        }, 350);
    });

    document.addEventListener('upas:rolechange', () => applyAccess());
    document.addEventListener('upas:localechange', (event) => switchLocale(event.detail?.locale));
}

document.querySelectorAll('[data-support-center]').forEach(bindDownloadList);
document.querySelectorAll('[data-download-form]').forEach(bindDownloadForm);
