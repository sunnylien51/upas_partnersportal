const STORAGE_KEY = 'upas-system-admins';
const DELETED_KEY = 'upas-system-admins-deleted';
const PREVIEW_KEY = 'upas-preview-sysadmin-id';
const ADMIN_ONLY_PATH = '/admins';

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

function readJson(id) {
    const el = document.getElementById(id);
    if (!el) {
        return null;
    }
    try {
        return JSON.parse(el.textContent);
    } catch (error) {
        console.warn('Unable to parse admin catalog', error);
        return null;
    }
}

function catalogMaps() {
    const meta = readJson('admin-catalog-data') || {};
    return {
        admins: meta.admins || [],
        statuses: meta.statuses || {},
        navItems: meta.navItems || [],
        navLabels: meta.navLabels || {},
        editUrl: meta.editUrl || '/admins/edit/',
    };
}

function assignablePaths() {
    return catalogMaps().navItems.map((item) => item.path).filter((path) => path && path !== ADMIN_ONLY_PATH);
}

function sanitizeNav(nav) {
    const allowed = new Set(assignablePaths());
    const seen = new Set();
    const next = [];
    (Array.isArray(nav) ? nav : []).forEach((path) => {
        if (!allowed.has(path) || seen.has(path) || path === ADMIN_ONLY_PATH) {
            return;
        }
        seen.add(path);
        next.push(path);
    });
    return next;
}

function readStoredAdmins() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function upsertStoredAdmin(admin) {
    const next = readStoredAdmins().filter((item) => item.id !== admin.id);
    next.push(admin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function readDeletedIds() {
    try {
        const raw = localStorage.getItem(DELETED_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (error) {
        return [];
    }
}

function isAdminDeleted(id) {
    return readDeletedIds().includes(String(id || ''));
}

function markAdminDeleted(id) {
    const key = String(id || '');
    if (!key) {
        return;
    }

    const deleted = readDeletedIds().filter((item) => item !== key);
    deleted.push(key);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(readStoredAdmins().filter((item) => item.id !== key))
    );

    if (localStorage.getItem(PREVIEW_KEY) === key) {
        localStorage.removeItem(PREVIEW_KEY);
    }
}

function todayStamp() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
}

function formatCreatedAt(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function generateNextAdminId() {
    const prefix = `A${todayStamp()}`;
    const ids = [
        ...(catalogMaps().admins || []).map((item) => item.id),
        ...readStoredAdmins().map((item) => item.id),
    ];
    let max = 0;
    ids.forEach((rawId) => {
        const id = String(rawId || '');
        if (!id.startsWith(prefix)) {
            return;
        }
        const seq = Number.parseInt(id.slice(prefix.length), 10);
        if (!Number.isNaN(seq)) {
            max = Math.max(max, seq);
        }
    });
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function findAdmin(id) {
    if (!id || isAdminDeleted(id)) {
        return null;
    }

    const { admins } = catalogMaps();
    const stored = readStoredAdmins().find((item) => item.id === id);
    const seed = admins.find((item) => item.id === id);
    if (!seed && !stored) {
        return null;
    }
    return { ...(seed || {}), ...(stored || {}) };
}

function searchText(admin) {
    return [
        admin.id,
        admin.name,
        admin.email,
    ].filter(Boolean).join(' ');
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

function navChipsHtml(nav, labels) {
    const paths = sanitizeNav(nav);
    if (!paths.length) {
        return '<span class="text-cb3 text-gray3">未指定</span>';
    }
    return paths.map((path) => `<span class="nav-permission-chip">${labels[path] || path}</span>`).join('');
}

function applyAdminToRow(row, admin, maps) {
    if (!admin) {
        return;
    }

    const statusLabel = maps.statuses[admin.status] || admin.status || '—';
    row.dataset.status = admin.status || '';
    row.dataset.search = searchText(admin);

    const setText = (selector, value) => {
        const el = row.querySelector(selector);
        if (el) {
            el.textContent = value || '—';
        }
    };

    setText('[data-admin-name]', admin.name);
    setText('[data-admin-member-id]', admin.id);
    setText('[data-admin-email]', admin.email);

    const navEl = row.querySelector('[data-admin-nav]');
    if (navEl) {
        navEl.innerHTML = navChipsHtml(admin.nav, maps.navLabels);
    }

    const pill = row.querySelector('[data-admin-status]');
    if (pill) {
        pill.className = `status-pill status-${admin.status || ''}`;
        pill.textContent = statusLabel;
    }
}

function createAdminRow(root, admin, maps) {
    const template = root.querySelector('[data-admin-row-template]');
    const list = template?.parentElement;
    if (!template || !list) {
        return null;
    }

    const row = template.cloneNode(true);
    row.removeAttribute('data-admin-row-template');
    row.removeAttribute('hidden');
    row.setAttribute('data-admin-row', '');
    row.dataset.adminId = admin.id || '';

    const editBase = root.dataset.editUrl || maps.editUrl || '/admins/edit/';
    const editHref = `${editBase}${editBase.includes('?') ? '&' : '?'}id=${encodeURIComponent(admin.id || '')}`;
    row.dataset.editHref = editHref;

    const editLink = row.querySelector('[data-admin-edit-link]');
    if (editLink) {
        editLink.href = editHref;
        editLink.setAttribute('aria-label', `編輯 ${admin.name || admin.id || ''}`);
    }

    const previewBtn = row.querySelector('[data-admin-preview]');
    if (previewBtn) {
        previewBtn.setAttribute('aria-label', `預覽 ${admin.name || ''} 的選單權限`);
    }

    const deleteBtn = row.querySelector('[data-admin-delete]');
    if (deleteBtn) {
        deleteBtn.setAttribute('aria-label', `刪除 ${admin.name || admin.id || ''}`);
    }

    applyAdminToRow(row, admin, maps);
    list.insertBefore(row, template);
    refreshIcons(row);
    return row;
}

function sortAdminRowsNewestFirst(root) {
    const template = root.querySelector('[data-admin-row-template]');
    const list = template?.parentElement;
    if (!list) {
        return;
    }

    const rows = [...list.querySelectorAll('[data-admin-row]')];
    rows.sort((a, b) => String(b.dataset.adminId || '').localeCompare(String(a.dataset.adminId || '')));
    rows.forEach((row) => list.insertBefore(row, template));
}

function hydrateAdminRows(root) {
    const maps = catalogMaps();
    const stored = readStoredAdmins();
    const deleted = new Set(readDeletedIds());

    root.querySelectorAll('[data-admin-row]').forEach((row) => {
        if (deleted.has(String(row.dataset.adminId || ''))) {
            row.remove();
        }
    });

    root.querySelectorAll('[data-admin-row]').forEach((row) => {
        const admin = findAdmin(row.dataset.adminId || '');
        if (admin) {
            applyAdminToRow(row, admin, maps);
        }
    });

    stored.forEach((admin) => {
        if (deleted.has(String(admin.id || ''))) {
            return;
        }
        const merged = findAdmin(admin.id);
        if (!merged) {
            return;
        }
        let row = root.querySelector(`[data-admin-row][data-admin-id="${CSS.escape(admin.id)}"]`);
        if (!row) {
            createAdminRow(root, merged, maps);
        } else {
            applyAdminToRow(row, merged, maps);
        }
    });

    sortAdminRowsNewestFirst(root);
}

function syncAdminStats(root, rows) {
    const counts = {
        all: rows.length,
        active: 0,
        disabled: 0,
    };

    rows.forEach((row) => {
        const status = row.dataset.status;
        if (Object.prototype.hasOwnProperty.call(counts, status)) {
            counts[status] += 1;
        }
    });

    root.querySelectorAll('[data-admin-stat]').forEach((el) => {
        const key = el.dataset.adminStat;
        const countEl = el.querySelector('[data-admin-stat-count]');
        if (countEl && Object.prototype.hasOwnProperty.call(counts, key)) {
            countEl.textContent = String(counts[key]);
        }
    });
}

function canManageAdmins() {
    if (typeof app().roleCan === 'function') {
        return app().roleCan('admin.manage');
    }
    return true;
}

function syncAdminGuard() {
    const allowed = canManageAdmins();
    document.querySelectorAll('[data-admin-allowed]').forEach((el) => {
        el.hidden = !allowed;
    });
    document.querySelectorAll('[data-admin-forbidden]').forEach((el) => {
        el.hidden = allowed;
    });
}

function collectNav(form) {
    return sanitizeNav(
        [...form.querySelectorAll('[data-nav-permission]:checked')].map((input) => input.value)
    );
}

function syncNavOptionStyles(form) {
    form.querySelectorAll('[data-nav-permission-options] .source-option').forEach((option) => {
        const input = option.querySelector('[data-nav-permission]');
        option.classList.toggle('is-selected', Boolean(input?.checked));
    });
}

function validateAdminForm(form, { requirePassword = false } = {}) {
    let valid = true;
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

    form.querySelectorAll('input[required]').forEach((field) => {
        const value = String(field.value || '').trim();
        const typeOk = field.type !== 'email' || field.checkValidity();
        if (!value || !typeOk) {
            field.classList.add('form-error');
            valid = false;
        }
    });

    form.querySelectorAll('[data-form-select][data-required]').forEach((select) => {
        const hidden = select.querySelector('[data-form-select-value]');
        const trigger = select.querySelector('[data-form-select-trigger]');
        if (hidden && !String(hidden.value || '').trim()) {
            trigger?.classList.add('form-error');
            valid = false;
        }
    });

    const password = form.querySelector('[name="password"]')?.value || '';
    const confirm = form.querySelector('[name="password_confirmation"]')?.value || '';
    if (requirePassword && !password) {
        form.querySelector('[name="password"]')?.classList.add('form-error');
        valid = false;
    }
    if (password || confirm) {
        if (password !== confirm) {
            form.querySelector('[name="password_confirmation"]')?.classList.add('form-error');
            valid = false;
            showToast('兩次密碼不一致', 'error');
        }
    }

    const nav = collectNav(form);
    if (!nav.length) {
        form.querySelectorAll('[data-nav-permission-options] .source-option').forEach((option) => {
            option.classList.add('form-error');
        });
        valid = false;
    }

    return valid;
}

function collectAdminPayload(form, existing = {}) {
    return {
        id: existing.id || '',
        name: form.querySelector('[name="name"]')?.value.trim() || '',
        email: form.querySelector('[name="email"]')?.value.trim() || '',
        status: form.querySelector('[name="status"]')?.value || 'active',
        created_at: form.querySelector('[name="created_at"]')?.value || existing.created_at || formatCreatedAt(),
        nav: collectNav(form),
    };
}

function refreshRolePreview() {
    if (typeof app().applyPreviewRole === 'function' && typeof app().getPreviewRole === 'function') {
        app().applyPreviewRole(app().getPreviewRole());
    }
}

async function previewAdminNav(admin, homeUrl) {
    if (!admin?.id) {
        return;
    }
    if (typeof app().previewSysadmin === 'function') {
        app().previewSysadmin(admin.id, { applyNow: false });
    } else {
        localStorage.setItem(PREVIEW_KEY, admin.id);
        localStorage.setItem('upas-preview-role', 'sysadmin');
        localStorage.setItem('upas-preview-role-mode', 'full');
    }
    showToast(`已切換為「${admin.name}」的選單預覽`);
    window.setTimeout(() => {
        window.location.href = homeUrl || './';
    }, 450);
}

function bindAdminList(root) {
    const maps = catalogMaps();
    hydrateAdminRows(root);

    const search = root.querySelector('[data-admin-search]');
    const searchClear = search?.closest('label')?.querySelector('[data-search-clear]');
    const statusFilter = root.querySelector('[data-admin-filter="status"] [data-form-select-value]');

    const render = () => {
        const query = String(search?.value || '').trim().toLowerCase();
        const status = String(statusFilter?.value || '');
        const rows = [...root.querySelectorAll('[data-admin-row]')];
        let visible = 0;

        rows.forEach((row) => {
            const matchesQuery = !query || String(row.dataset.search || '').toLowerCase().includes(query);
            const matchesStatus = !status || row.dataset.status === status;
            const show = matchesQuery && matchesStatus;
            row.hidden = !show;
            if (show) {
                visible += 1;
            }
        });

        const empty = root.querySelector('[data-admin-empty]');
        if (empty) {
            empty.hidden = visible > 0;
        }

        syncAdminStats(root, rows);
        if (searchClear) {
            searchClear.hidden = !query;
        }
    };

    search?.addEventListener('input', render);
    search?.addEventListener('search', render);
    searchClear?.addEventListener('click', () => {
        if (search) {
            search.value = '';
        }
        render();
        search?.focus();
    });

    statusFilter?.addEventListener('change', render);

    root.addEventListener('click', async (event) => {
        const deleteBtn = event.target.closest('[data-admin-delete]');
        if (deleteBtn) {
            event.preventDefault();
            event.stopPropagation();
            const row = deleteBtn.closest('[data-admin-row]');
            const admin = findAdmin(row?.dataset.adminId || '');
            const confirmed = await showConfirm({
                title: '刪除系統管理員',
                message: `確定刪除「${admin?.name || admin?.id || '此帳號'}」？此操作無法復原。`,
                confirmLabel: '刪除',
                cancelLabel: '取消',
                danger: true,
            });
            if (!confirmed || !admin) {
                return;
            }
            markAdminDeleted(admin.id);
            row?.remove();
            render();
            refreshRolePreview();
            showToast('已刪除系統管理員');
            return;
        }

        const previewBtn = event.target.closest('[data-admin-preview]');
        if (previewBtn) {
            event.preventDefault();
            event.stopPropagation();
            const row = previewBtn.closest('[data-admin-row]');
            const admin = findAdmin(row?.dataset.adminId || '');
            await previewAdminNav(admin, root.dataset.homeUrl || './');
            return;
        }

        const editLink = event.target.closest('[data-admin-edit-link]');
        if (editLink) {
            return;
        }

        const row = event.target.closest('[data-admin-row]');
        if (!row || row.hasAttribute('data-admin-row-template')) {
            return;
        }
        if (row.dataset.editHref) {
            window.location.href = row.dataset.editHref;
        }
    });

    render();
}

function bindAdminCreateForm(form) {
    const listUrl = form.dataset.listUrl || '/admins/';
    const maps = catalogMaps();
    const pill = document.querySelector('[data-admin-status-pill]');

    syncNavOptionStyles(form);

    form.querySelector('[name="status"]')?.addEventListener('change', () => {
        const value = form.querySelector('[name="status"]')?.value || '';
        if (pill) {
            pill.className = `status-pill status-${value}`;
            pill.textContent = maps.statuses[value] || value || '—';
        }
    });

    form.querySelectorAll('[data-nav-permission]').forEach((input) => {
        input.addEventListener('change', () => syncNavOptionStyles(form));
    });

    form.querySelector('[name="name"]')?.addEventListener('input', (event) => {
        const heading = document.querySelector('[data-admin-heading]');
        if (heading) {
            heading.textContent = event.target.value.trim() || '新增系統管理員';
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!validateAdminForm(form, { requirePassword: true })) {
            const firstError = form.querySelector('.form-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (!form.querySelector('[name="password_confirmation"]')?.classList.contains('form-error')
                || form.querySelector('[name="password"]')?.value === form.querySelector('[name="password_confirmation"]')?.value) {
                showToast('請先補齊必填欄位與選單權限', 'error');
            }
            return;
        }

        const saved = {
            ...collectAdminPayload(form),
            id: generateNextAdminId(),
        };

        upsertStoredAdmin(saved);
        localStorage.setItem(PREVIEW_KEY, saved.id);
        showToast(`已建立系統管理員 ${saved.id}`);
        window.setTimeout(() => {
            window.location.href = listUrl;
        }, 500);
    });
}

function bindAdminEditForm(form) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || '';
    const admin = findAdmin(id);
    const maps = catalogMaps();
    const toolbar = document.querySelector('[data-admin-edit-toolbar]');
    const missing = document.querySelector('[data-admin-missing]');
    const crumb = document.querySelector('[data-admin-crumb]');
    const listUrl = form.dataset.listUrl || '/admins/';

    if (!admin) {
        form.hidden = true;
        if (toolbar) toolbar.hidden = true;
        if (missing) missing.hidden = false;
        if (crumb) crumb.textContent = '編輯系統管理員';
        return;
    }

    form.querySelector('[name="id"]').value = admin.id || '';
    form.querySelector('[name="created_at"]').value = admin.created_at || '';
    form.querySelector('[name="name"]').value = admin.name || '';
    form.querySelector('[name="email"]').value = admin.email || '';

    const created = form.querySelector('[data-admin-created]');
    if (created) {
        created.value = admin.created_at || '—';
    }
    const idReadonly = form.querySelector('[data-admin-id-readonly]');
    if (idReadonly) {
        idReadonly.value = admin.id || '—';
    }
    const memberIdLabel = document.querySelector('[data-admin-member-id]');
    if (memberIdLabel) {
        memberIdLabel.textContent = admin.id || '—';
    }

    setFormSelectByValue(form.querySelector('[name="status"]')?.closest('[data-form-select]'), admin.status || 'active');

    const selectedNav = new Set(sanitizeNav(admin.nav));
    form.querySelectorAll('[data-nav-permission]').forEach((input) => {
        input.checked = selectedNav.has(input.value);
    });
    syncNavOptionStyles(form);

    const heading = document.querySelector('[data-admin-heading]');
    const pill = document.querySelector('[data-admin-status-pill]');
    if (heading) heading.textContent = admin.name || '系統管理員';
    if (pill) {
        pill.className = `status-pill status-${admin.status || ''}`;
        pill.textContent = maps.statuses[admin.status] || admin.status || '—';
    }
    if (crumb) {
        crumb.textContent = admin.name || admin.id || '編輯系統管理員';
    }

    form.querySelector('[name="status"]')?.addEventListener('change', () => {
        const value = form.querySelector('[name="status"]')?.value || '';
        if (pill) {
            pill.className = `status-pill status-${value}`;
            pill.textContent = maps.statuses[value] || value || '—';
        }
    });

    form.querySelectorAll('[data-nav-permission]').forEach((input) => {
        input.addEventListener('change', () => syncNavOptionStyles(form));
    });

    form.querySelector('[name="name"]')?.addEventListener('input', (event) => {
        const name = event.target.value.trim() || admin.name || '系統管理員';
        if (heading) heading.textContent = name;
        if (crumb) crumb.textContent = name;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!validateAdminForm(form, { requirePassword: false })) {
            const firstError = form.querySelector('.form-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (!form.querySelector('[name="password_confirmation"]')?.classList.contains('form-error')
                || form.querySelector('[name="password"]')?.value === form.querySelector('[name="password_confirmation"]')?.value) {
                showToast('請先補齊必填欄位與選單權限', 'error');
            }
            return;
        }

        const saved = collectAdminPayload(form, admin);
        saved.id = admin.id;
        upsertStoredAdmin(saved);
        localStorage.setItem(PREVIEW_KEY, saved.id);
        showToast('已儲存系統管理員');
        window.setTimeout(() => {
            window.location.href = listUrl;
        }, 450);
    });
}

syncAdminGuard();
document.addEventListener('upas:rolechange', syncAdminGuard);

document.querySelectorAll('[data-admin-list]').forEach(bindAdminList);
document.querySelectorAll('[data-admin-create-form]').forEach(bindAdminCreateForm);
document.querySelectorAll('[data-admin-edit-form]').forEach(bindAdminEditForm);
