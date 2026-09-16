const STORAGE_KEY = 'upas-partners';
const DELETED_KEY = 'upas-partners-deleted';

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
        console.warn('Unable to parse partner catalog', error);
        return null;
    }
}

function readStoredPartners() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function upsertStoredPartner(partner) {
    const next = readStoredPartners().filter((item) => item.id !== partner.id);
    next.push(partner);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function todayStamp() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
}

function generateNextMemberId() {
    const prefix = `P${todayStamp()}`;
    const maps = catalogMaps();
    const ids = [
        ...(maps.partners || []).map((item) => item.id),
        ...readStoredPartners().map((item) => item.id),
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

function formatAppliedAt(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

function isPartnerDeleted(id) {
    return readDeletedIds().includes(String(id || ''));
}

function markPartnerDeleted(id) {
    const key = String(id || '');
    if (!key) {
        return;
    }

    const deleted = readDeletedIds().filter((item) => item !== key);
    deleted.push(key);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(readStoredPartners().filter((item) => item.id !== key))
    );
}

async function confirmDeletePartner(partner) {
    const company = partner?.company || partner?.id || '此夥伴';
    return showConfirm({
        title: '刪除夥伴',
        message: `確定刪除「${company}」？此操作無法復原。<br>若該夥伴仍有相關商機，請先轉移商機或變更原廠所屬業務，避免商機歸屬異常。`,
        confirmLabel: '刪除',
        cancelLabel: '取消',
        danger: true,
    });
}

function catalogMaps() {
    const meta = readJson('partner-catalog-data') || {};
    return {
        partners: meta.partners || [],
        countries: meta.countries || {},
        statuses: meta.statuses || {},
        levels: meta.levels || {},
        identities: meta.identities || {},
        identityFilters: meta.identityFilters || [],
        editUrl: meta.editUrl || '/profile/edit/',
    };
}

function isDealerIdentity(identity) {
    return identity === 'dealer_tw' || identity === 'dealer_overseas';
}

function identityFilterMatch(filterValue, identity, maps) {
    if (!filterValue) {
        return true;
    }

    const groups = maps.identityFilters || [];
    const group = groups.find((item) => item.value === filterValue);
    if (group && Array.isArray(group.identities)) {
        return group.identities.includes(identity);
    }

    return identity === filterValue;
}

function levelDisplay(partner, maps) {
    const identity = partner.identity || '';
    const level = partner.level || '';
    if (partner.status === 'approved' && isDealerIdentity(identity) && level) {
        return {
            value: level,
            label: maps.levels[level] || level,
        };
    }
    return { value: '', label: '' };
}

function oemSalesListDisplay(partner, maps = catalogMaps()) {
    const requested = String(partner.oem_sales || '').trim();
    const boundId = String(partner.oem_sales_id || '').trim();
    const identity = partner.identity || '';

    if (partner.status === 'approved' && isDealerIdentity(identity) && boundId) {
        const bound = (maps.partners || []).find((item) => item.id === boundId);
        return bound?.name || requested || boundId;
    }

    if (requested) {
        return `申請：${requested}`;
    }

    return '—';
}

function identityDisplay(partner, maps) {
    const identityLabel = maps.identities?.[partner.identity] || '';
    if (!identityLabel) {
        return '—';
    }
    const level = levelDisplay(partner, maps);
    return level.label ? `${identityLabel}/${level.label}` : identityLabel;
}

function findPartner(id) {
    if (!id || isPartnerDeleted(id)) {
        return null;
    }

    const { partners } = catalogMaps();
    const stored = readStoredPartners().find((item) => item.id === id);
    const seed = partners.find((item) => item.id === id);
    if (!seed && !stored) {
        return null;
    }
    return { ...(seed || {}), ...(stored || {}) };
}

function searchText(partner, countryLabel = '', maps = {}) {
    return [
        partner.id,
        partner.company,
        partner.tax_id,
        countryLabel,
        partner.oem_sales,
        partner.name,
        partner.email,
        partner.phone,
        partner.job_title,
        identityDisplay(partner, maps),
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

function applyPartnerToRow(row, partner, maps) {
    if (!partner) {
        return;
    }

    const countryLabel = maps.countries[partner.country] || partner.country || '—';
    const statusLabel = maps.statuses[partner.status] || partner.status || '—';

    row.dataset.status = partner.status || '';
    row.dataset.country = partner.country || '';
    row.dataset.identity = partner.identity || '';
    row.dataset.level = partner.level || '';
    row.dataset.appliedAt = partner.applied_at || '';
    row.dataset.search = searchText(partner, countryLabel, maps);

    const setText = (selector, value) => {
        const el = row.querySelector(selector);
        if (el) {
            el.textContent = value || '—';
        }
    };

    setText('[data-partner-company]', partner.company);
    setText('[data-partner-member-id]', partner.id);
    setText('[data-partner-identity]', identityDisplay(partner, maps));
    setText('[data-partner-oem-sales]', oemSalesListDisplay(partner, maps));
    setText('[data-partner-name]', partner.name);
    setText('[data-partner-title]', partner.job_title);
    setText('[data-partner-email]', partner.email);
    setText('[data-partner-phone]', partner.phone);

    const pill = row.querySelector('[data-partner-status]');
    if (pill) {
        pill.className = `status-pill status-${partner.status || ''}`;
        pill.textContent = statusLabel;
    }
}

function createPartnerRow(root, partner, maps) {
    const template = root.querySelector('[data-partner-row-template]');
    const list = template?.parentElement;
    if (!template || !list) {
        return null;
    }

    const row = template.cloneNode(true);
    row.removeAttribute('data-partner-row-template');
    row.removeAttribute('hidden');
    row.setAttribute('data-partner-row', '');
    row.dataset.partnerId = partner.id || '';

    const editBase = root.dataset.editUrl || maps.editUrl || '/profile/edit/';
    const editHref = `${editBase}${editBase.includes('?') ? '&' : '?'}id=${encodeURIComponent(partner.id || '')}`;
    row.dataset.editHref = editHref;

    const editLink = row.querySelector('[data-partner-edit-link], a.icon-action');
    if (editLink) {
        editLink.href = editHref;
        editLink.setAttribute('aria-label', `編輯 ${partner.company || partner.id || ''}`);
    }

    const deleteBtn = row.querySelector('[data-partner-delete]');
    if (deleteBtn) {
        deleteBtn.setAttribute('aria-label', `刪除 ${partner.company || partner.id || ''}`);
    }

    applyPartnerToRow(row, partner, maps);
    list.insertBefore(row, template);
    refreshIcons(row);
    if (typeof app().applyPreviewRole === 'function' && typeof app().getPreviewRole === 'function') {
        app().applyPreviewRole(app().getPreviewRole());
    }
    return row;
}

function sortPartnerRowsNewestFirst(root) {
    const template = root.querySelector('[data-partner-row-template]');
    const list = template?.parentElement;
    if (!list) {
        return;
    }

    const rows = [...list.querySelectorAll('[data-partner-row]')];
    rows.sort((a, b) => {
        const dateCmp = String(b.dataset.appliedAt || '').localeCompare(String(a.dataset.appliedAt || ''));
        if (dateCmp !== 0) {
            return dateCmp;
        }
        return String(b.dataset.partnerId || '').localeCompare(String(a.dataset.partnerId || ''));
    });
    rows.forEach((row) => list.insertBefore(row, template));
}

function hydratePartnerRows(root) {
    const maps = catalogMaps();
    const stored = readStoredPartners();
    const deleted = new Set(readDeletedIds());

    root.querySelectorAll('[data-partner-row]').forEach((row) => {
        if (deleted.has(String(row.dataset.partnerId || ''))) {
            row.remove();
        }
    });

    // Ensure seed rows carry applied_at for sorting.
    root.querySelectorAll('[data-partner-row]').forEach((row) => {
        const partner = findPartner(row.dataset.partnerId || '');
        if (partner) {
            applyPartnerToRow(row, partner, maps);
        }
    });

    stored.forEach((partner) => {
        if (deleted.has(String(partner.id || ''))) {
            return;
        }
        const merged = findPartner(partner.id);
        if (!merged) {
            return;
        }
        let row = root.querySelector(`[data-partner-row][data-partner-id="${CSS.escape(partner.id)}"]`);
        if (!row) {
            createPartnerRow(root, merged, maps);
        } else {
            applyPartnerToRow(row, merged, maps);
        }
    });

    sortPartnerRowsNewestFirst(root);
}

function syncPartnerStats(root, rows) {
    const counts = {
        all: rows.length,
        reviewing: 0,
        approved: 0,
        rejected: 0,
    };

    rows.forEach((row) => {
        const status = row.dataset.status;
        if (Object.prototype.hasOwnProperty.call(counts, status)) {
            counts[status] += 1;
        }
    });

    root.querySelectorAll('[data-partner-stat]').forEach((button) => {
        const key = button.dataset.partnerStat;
        const countEl = button.querySelector('[data-partner-stat-count]');
        if (countEl && Object.prototype.hasOwnProperty.call(counts, key)) {
            countEl.textContent = String(counts[key]);
        }
    });
}

function getPartnerPreviewHost() {
    return document.querySelector('[data-partner-preview]');
}

function closePartnerPreview() {
    const host = getPartnerPreviewHost();
    if (!host) {
        return;
    }
    host.classList.remove('is-open');
    window.setTimeout(() => {
        host.hidden = true;
    }, 200);
}

function openPartnerPreview(partnerId) {
    const host = getPartnerPreviewHost();
    const partner = findPartner(partnerId);
    if (!host || !partner) {
        return;
    }

    const maps = catalogMaps();
    const countryLabel = maps.countries[partner.country] || partner.country || '—';
    const statusLabel = maps.statuses[partner.status] || partner.status || '—';
    const editUrl = `${maps.editUrl}${maps.editUrl.includes('?') ? '&' : '?'}id=${encodeURIComponent(partner.id)}`;

    const setText = (selector, value) => {
        const el = host.querySelector(selector);
        if (el) {
            el.textContent = value || '—';
        }
    };

    setText('[data-partner-preview-company]', partner.company);
    setText('[data-partner-preview-id]', partner.id);
    setText('[data-partner-preview-identity]', identityDisplay(partner, maps));
    setText('[data-partner-preview-applied]', partner.applied_at);
    setText('[data-partner-preview-tax-id]', partner.tax_id);
    setText('[data-partner-preview-country]', countryLabel);
    setText('[data-partner-preview-oem-sales]', oemSalesListDisplay(partner, maps));
    setText('[data-partner-preview-name]', partner.name);
    setText('[data-partner-preview-title]', partner.job_title);
    setText('[data-partner-preview-email]', partner.email);
    setText('[data-partner-preview-phone]', partner.phone);

    const statusEl = host.querySelector('[data-partner-preview-status]');
    if (statusEl) {
        statusEl.className = `status-pill status-${partner.status || ''}`;
        statusEl.textContent = statusLabel;
    }

    const editLink = host.querySelector('[data-partner-preview-edit]');
    if (editLink) {
        editLink.href = editUrl;
    }

    host.hidden = false;
    requestAnimationFrame(() => {
        host.classList.add('is-open');
        refreshIcons(host);
        host.querySelector('button[data-partner-preview-dismiss]')?.focus();
    });
}

function bindPartnerPreview() {
    const host = getPartnerPreviewHost();
    if (!host || host.dataset.bound === '1') {
        return;
    }
    host.dataset.bound = '1';

    host.addEventListener('click', (event) => {
        if (event.target.closest('[data-partner-preview-dismiss]')) {
            closePartnerPreview();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !host.hidden) {
            closePartnerPreview();
        }
    });
}

function bindPartnerList(root) {
    if (!root) {
        return;
    }

    const pageSize = Number(root.dataset.pageSize || 8);
    hydratePartnerRows(root);
    bindPartnerPreview();
    const rows = [...root.querySelectorAll('[data-partner-row]')];
    const empty = root.querySelector('[data-partner-empty]');
    const summary = root.querySelector('[data-partner-summary]');
    const pagination = root.querySelector('[data-partner-pagination]');
    const search = root.querySelector('[data-partner-search]');
    const searchClear = search?.closest('label')?.querySelector('[data-search-clear]');
    const maps = catalogMaps();
    const filters = {
        status: '',
        identity: '',
    };
    let page = 1;

    syncPartnerStats(root, rows);

    function matchedRows() {
        const query = (search?.value || '').trim().toLowerCase();

        return rows.filter((row) => {
            if (!row.isConnected) {
                return false;
            }
            const statusOk = !filters.status || row.dataset.status === filters.status;
            const identityOk = identityFilterMatch(filters.identity, row.dataset.identity || '', maps);
            const haystack = (row.dataset.search || row.textContent || '').toLowerCase();
            const searchOk = !query || haystack.includes(query);
            return statusOk && identityOk && searchOk;
        });
    }

    function renderPagination(current, pages) {
        if (!pagination) {
            return;
        }

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
                    page = target;
                    render();
                });
            }
            pagination.appendChild(btn);
        };

        appendBtn({
            icon: 'chevron-left',
            target: current - 1,
            disabled: current <= 1,
            aria: '上一頁',
        });

        for (let index = 1; index <= pages; index += 1) {
            appendBtn({
                label: String(index),
                target: index,
                active: index === current,
            });
        }

        appendBtn({
            icon: 'chevron-right',
            target: current + 1,
            disabled: current >= pages,
            last: true,
            aria: '下一頁',
        });

        refreshIcons(pagination);
    }

    function render() {
        const matched = matchedRows();
        const total = matched.length;
        const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
        if (page > pages) {
            page = pages;
        }

        const start = total === 0 ? 0 : (page - 1) * pageSize;
        const end = start + pageSize;

        rows.forEach((row) => {
            row.hidden = true;
        });
        matched.forEach((row, index) => {
            row.hidden = !(index >= start && index < end);
        });

        if (empty) {
            empty.hidden = total > 0;
        }

        if (summary) {
            const from = total === 0 ? 0 : start + 1;
            const to = Math.min(end, total);
            summary.textContent = `Showing ${from}-${to} of ${total} results`;
        }

        renderPagination(page, pages);
    }

    root.querySelectorAll('[data-partner-filter]').forEach((select) => {
        const key = select.dataset.partnerFilter;
        const hidden = select.querySelector('[data-form-select-value]');
        filters[key] = hidden?.value || '';
        hidden?.addEventListener('change', () => {
            filters[key] = hidden.value || '';
            page = 1;
            render();
        });
    });

    if (search) {
        const syncClear = () => {
            if (searchClear) {
                searchClear.hidden = search.value.length === 0;
            }
        };

        search.addEventListener('input', () => {
            syncClear();
            page = 1;
            render();
        });
        search.addEventListener('search', () => {
            syncClear();
            page = 1;
            render();
        });
        searchClear?.addEventListener('click', () => {
            search.value = '';
            search.dispatchEvent(new Event('input', { bubbles: true }));
            search.focus();
        });
        syncClear();
    }

    root.querySelector('[data-partner-export]')?.addEventListener('click', () => {
        showToast('已開始匯出 Excel（示意）');
    });

    root.addEventListener('click', async (event) => {
        const deleteBtn = event.target.closest('[data-partner-delete]');
        if (deleteBtn && root.contains(deleteBtn)) {
            event.preventDefault();
            event.stopPropagation();
            const row = deleteBtn.closest('[data-partner-row]');
            const id = row?.dataset.partnerId || '';
            const partner = findPartner(id) || {
                id,
                company: row?.querySelector('[data-partner-company]')?.textContent || id,
            };
            const ok = await confirmDeletePartner(partner);
            if (!ok) {
                return;
            }
            markPartnerDeleted(id);
            row?.remove();
            syncPartnerStats(root, rows.filter((item) => item.isConnected));
            render();
            showToast('已刪除夥伴');
            return;
        }

        if (event.target.closest('[data-partner-actions]')) {
            return;
        }

        const row = event.target.closest('[data-partner-row]');
        if (!row || !root.contains(row)) {
            return;
        }
        openPartnerPreview(row.dataset.partnerId || '');
    });

    render();
}

function validatePartnerForm(form) {
    let valid = true;
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

    const status = form.querySelector('[name="status"]')?.value || '';
    const identity = form.querySelector('[name="identity"]:checked')?.value || '';
    const isCreateForm = form.matches('[data-partner-create-form]');
    const requiresApprovalFields = status === 'approved';
    const requiresIdentity = requiresApprovalFields || isCreateForm;

    form.querySelectorAll('input[required], textarea[required]').forEach((field) => {
        if (field.disabled || field.closest('[hidden]')) {
            return;
        }
        const value = String(field.value || '').trim();
        const typeOk = field.type !== 'email' || field.checkValidity();
        if (!value || !typeOk) {
            field.classList.add('form-error');
            valid = false;
        }
    });

    form.querySelectorAll('[data-form-select][data-required]').forEach((select) => {
        if (select.closest('[hidden]')) {
            return;
        }
        const hidden = select.querySelector('[data-form-select-value]');
        const trigger = select.querySelector('[data-form-select-trigger]');
        if (hidden && !String(hidden.value || '').trim()) {
            trigger?.classList.add('form-error');
            valid = false;
        }
    });

    if (requiresIdentity) {
        if (!identity) {
            form.querySelectorAll('[data-identity-input]').forEach((input) => {
                input.closest('.source-option')?.classList.add('form-error');
            });
            valid = false;
        }

        if (requiresApprovalFields && isDealerIdentity(identity)) {
            const levelSelect = form.querySelector('[data-partner-level-select]');
            const salesSelect = form.querySelector('[data-partner-oem-sales-select]');
            if (!form.querySelector('[name="level"]')?.value) {
                levelSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
                valid = false;
            }
            if (!form.querySelector('[name="oem_sales_id"]')?.value) {
                salesSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
                valid = false;
            }
        }

        if (requiresApprovalFields && identity === 'oem_sales' && !form.querySelector('[name="manager_id"]')?.value) {
            form.querySelector('[data-partner-manager-select]')
                ?.querySelector('[data-form-select-trigger]')
                ?.classList.add('form-error');
            valid = false;
        }
    }

    return valid;
}

function syncIdentityOptionStyles(form) {
    form.querySelectorAll('[data-identity-options] .source-option').forEach((option) => {
        const input = option.querySelector('[data-identity-input]');
        option.classList.toggle('is-selected', Boolean(input?.checked));
    });
}

function syncPartnerReviewFields(form) {
    const identity = form.querySelector('[name="identity"]:checked')?.value || '';
    const status = form.querySelector('[name="status"]')?.value || '';
    const isDealer = isDealerIdentity(identity);
    const isOemSales = identity === 'oem_sales';
    const isOem = identity === 'oem_sales' || identity === 'oem_manager';

    const levelField = form.querySelector('[data-partner-level-field]');
    const salesField = form.querySelector('[data-partner-oem-sales-field]');
    const managerField = form.querySelector('[data-partner-manager-field]');
    const oemNote = form.querySelector('[data-partner-oem-company-note]');
    const identityRequired = form.querySelector('[data-partner-identity-required]');

    if (levelField) levelField.hidden = !isDealer;
    if (salesField) salesField.hidden = !isDealer;
    if (managerField) managerField.hidden = !isOemSales;
    if (oemNote) oemNote.hidden = !isOem;
    if (identityRequired) {
        identityRequired.hidden = !(status === 'approved' || form.matches('[data-partner-create-form]'));
    }

    if (!isDealer) {
        setFormSelectByValue(form.querySelector('[data-partner-level-select]'), '');
        setFormSelectByValue(form.querySelector('[data-partner-oem-sales-select]'), '');
    }
    if (!isOemSales) {
        setFormSelectByValue(form.querySelector('[data-partner-manager-select]'), '');
    }

    syncIdentityOptionStyles(form);
    syncTaxIdHint(form);
}

function syncTaxIdHint(form) {
    const hint = form.querySelector('[data-partner-tax-hint]');
    if (!hint) {
        return;
    }

    const identity = form.querySelector('[name="identity"]:checked')?.value || '';
    const taxId = form.querySelector('[name="tax_id"]')?.value.trim() || '';
    const currentId = form.querySelector('[name="id"]')?.value || '';
    if (!isDealerIdentity(identity) || !taxId) {
        hint.hidden = true;
        return;
    }

    const maps = catalogMaps();
    const stored = readStoredPartners();
    const deleted = new Set(readDeletedIds());
    const byId = new Map();

    maps.partners.forEach((item) => {
        if (!deleted.has(String(item.id))) {
            byId.set(item.id, item);
        }
    });
    stored.forEach((item) => {
        if (!deleted.has(String(item.id))) {
            byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
        }
    });

    const duplicated = [...byId.values()].some((item) => (
        item.id !== currentId
        && String(item.tax_id || '').trim() === taxId
        && item.status === 'approved'
    ));
    hint.hidden = !duplicated;
}

function bindPartnerEditForm(form) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || '';
    const partner = findPartner(id);
    const maps = catalogMaps();
    const toolbar = document.querySelector('[data-partner-edit-toolbar]');
    const missing = document.querySelector('[data-partner-missing]');
    const crumb = document.querySelector('[data-partner-crumb]');
    const listUrl = form.dataset.listUrl || '/profile/';

    if (!partner) {
        form.hidden = true;
        if (toolbar) toolbar.hidden = true;
        if (missing) missing.hidden = false;
        if (crumb) crumb.textContent = '編輯夥伴資料';
        return;
    }

    const statusLabel = maps.statuses[partner.status] || partner.status || '—';

    form.querySelector('[name="id"]').value = partner.id || '';
    form.querySelector('[name="applied_at"]').value = partner.applied_at || '';
    form.querySelector('[name="oem_sales"]').value = partner.oem_sales || '';

    const requestedWrap = form.querySelector('[data-partner-oem-sales-requested]');
    const requestedName = form.querySelector('[data-partner-oem-sales-requested-name]');
    if (requestedName) {
        requestedName.textContent = partner.oem_sales || '';
    }
    if (requestedWrap) {
        requestedWrap.hidden = !String(partner.oem_sales || '').trim();
    }
    form.querySelector('[name="company"]').value = partner.company || '';
    form.querySelector('[name="tax_id"]').value = partner.tax_id || '';
    form.querySelector('[name="name"]').value = partner.name || '';
    form.querySelector('[name="email"]').value = partner.email || '';
    form.querySelector('[name="phone"]').value = partner.phone || '';
    form.querySelector('[name="job_title"]').value = partner.job_title || '';

    const applied = form.querySelector('[data-partner-applied]');
    if (applied) {
        applied.value = partner.applied_at || '—';
    }

    const idReadonly = form.querySelector('[data-partner-id-readonly]');
    if (idReadonly) {
        idReadonly.value = partner.id || '—';
    }

    const memberIdLabel = document.querySelector('[data-partner-member-id]');
    if (memberIdLabel) {
        memberIdLabel.textContent = partner.id || '—';
    }

    setFormSelectByValue(form.querySelector('[name="status"]')?.closest('[data-form-select]'), partner.status || '');
    setFormSelectByValue(form.querySelector('[name="country"]')?.closest('[data-form-select]'), partner.country || '');
    setFormSelectByValue(form.querySelector('[data-partner-level-select]'), partner.level || '');
    setFormSelectByValue(form.querySelector('[data-partner-oem-sales-select]'), partner.oem_sales_id || '');
    setFormSelectByValue(form.querySelector('[data-partner-manager-select]'), partner.manager_id || '');

    const identityInput = form.querySelector(`[data-identity-input][value="${CSS.escape(partner.identity || '')}"]`);
    if (identityInput) {
        identityInput.checked = true;
    } else {
        form.querySelectorAll('[data-identity-input]').forEach((input) => {
            input.checked = false;
        });
    }

    const headingCompany = document.querySelector('[data-partner-heading]');
    const pill = document.querySelector('[data-partner-status-pill]');
    if (headingCompany) headingCompany.textContent = partner.company || partner.name || '夥伴資料';
    if (pill) {
        pill.className = `status-pill status-${partner.status || ''}`;
        pill.textContent = statusLabel;
    }
    if (crumb) {
        crumb.textContent = partner.company || partner.name || partner.id || '編輯夥伴資料';
    }

    syncPartnerReviewFields(form);

    const statusHidden = form.querySelector('[name="status"]');
    statusHidden?.addEventListener('change', () => {
        const value = statusHidden.value || '';
        if (pill) {
            pill.className = `status-pill status-${value}`;
            pill.textContent = maps.statuses[value] || value || '—';
        }
        syncPartnerReviewFields(form);
    });

    form.querySelectorAll('[data-identity-input]').forEach((input) => {
        input.addEventListener('change', () => {
            syncPartnerReviewFields(form);
        });
    });

    form.querySelector('[name="tax_id"]')?.addEventListener('input', () => {
        syncTaxIdHint(form);
    });

    const companyInput = form.querySelector('[name="company"]');
    companyInput?.addEventListener('input', () => {
        const company = companyInput.value.trim() || partner.company || partner.name || '夥伴資料';
        if (headingCompany) headingCompany.textContent = company;
        if (crumb) crumb.textContent = company;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        syncPartnerReviewFields(form);
        if (!validatePartnerForm(form)) {
            const firstError = form.querySelector('.form-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof firstError?.focus === 'function') {
                firstError.focus({ preventScroll: true });
            }
            showToast('請先補齊必填欄位', 'error');
            return;
        }

        const identity = form.querySelector('[name="identity"]:checked')?.value || '';
        const oemSalesId = form.querySelector('[name="oem_sales_id"]')?.value || '';
        const requestedOemSales = partner.oem_sales || form.querySelector('[name="oem_sales"]')?.value.trim() || '';

        const saved = {
            ...partner,
            id: form.querySelector('[name="id"]')?.value || partner.id,
            identity,
            level: isDealerIdentity(identity) ? (form.querySelector('[name="level"]')?.value || '') : '',
            oem_sales_id: isDealerIdentity(identity) ? oemSalesId : '',
            oem_sales: requestedOemSales,
            manager_id: identity === 'oem_sales' ? (form.querySelector('[name="manager_id"]')?.value || '') : '',
            company: form.querySelector('[name="company"]')?.value.trim() || '',
            tax_id: form.querySelector('[name="tax_id"]')?.value.trim() || '',
            country: form.querySelector('[name="country"]')?.value || '',
            name: form.querySelector('[name="name"]')?.value.trim() || '',
            email: form.querySelector('[name="email"]')?.value.trim() || '',
            phone: form.querySelector('[name="phone"]')?.value.trim() || '',
            job_title: form.querySelector('[name="job_title"]')?.value.trim() || '',
            status: form.querySelector('[name="status"]')?.value || partner.status,
            applied_at: form.querySelector('[name="applied_at"]')?.value || partner.applied_at || '',
        };

        const taxHint = form.querySelector('[data-partner-tax-hint]');
        if (taxHint && !taxHint.hidden) {
            showToast('此統編已有其他帳號，已儲存（僅提醒）');
        } else {
            showToast('已儲存夥伴資料');
        }

        upsertStoredPartner(saved);
        window.setTimeout(() => {
            window.location.href = listUrl;
        }, 450);
    });
}

function collectPartnerPayload(form, { requireIdentity = false } = {}) {
    const identity = form.querySelector('[name="identity"]:checked')?.value || '';
    const oemSalesId = form.querySelector('[name="oem_sales_id"]')?.value || '';
    const requestedOemSales = form.querySelector('[name="oem_sales"]')?.value.trim() || '';

    return {
        identity: requireIdentity || identity ? identity : '',
        level: isDealerIdentity(identity) ? (form.querySelector('[name="level"]')?.value || '') : '',
        oem_sales_id: isDealerIdentity(identity) ? oemSalesId : '',
        oem_sales: requestedOemSales,
        manager_id: identity === 'oem_sales' ? (form.querySelector('[name="manager_id"]')?.value || '') : '',
        company: form.querySelector('[name="company"]')?.value.trim() || '',
        tax_id: form.querySelector('[name="tax_id"]')?.value.trim() || '',
        country: form.querySelector('[name="country"]')?.value || '',
        name: form.querySelector('[name="name"]')?.value.trim() || '',
        email: form.querySelector('[name="email"]')?.value.trim() || '',
        phone: form.querySelector('[name="phone"]')?.value.trim() || '',
        job_title: form.querySelector('[name="job_title"]')?.value.trim() || '',
        status: form.querySelector('[name="status"]')?.value || 'reviewing',
        applied_at: form.querySelector('[name="applied_at"]')?.value || formatAppliedAt(),
    };
}

function bindPartnerCreateForm(form) {
    const listUrl = form.dataset.listUrl || '/profile/';
    const maps = catalogMaps();
    const pill = document.querySelector('[data-partner-status-pill]');

    syncPartnerReviewFields(form);

    form.querySelector('[name="status"]')?.addEventListener('change', () => {
        const value = form.querySelector('[name="status"]')?.value || '';
        if (pill) {
            pill.className = `status-pill status-${value}`;
            pill.textContent = maps.statuses[value] || value || '—';
        }
        syncPartnerReviewFields(form);
    });

    form.querySelectorAll('[data-identity-input]').forEach((input) => {
        input.addEventListener('change', () => syncPartnerReviewFields(form));
    });

    form.querySelector('[name="tax_id"]')?.addEventListener('input', () => syncTaxIdHint(form));

    form.querySelector('[name="company"]')?.addEventListener('input', (event) => {
        const heading = document.querySelector('[data-partner-heading]');
        if (heading) {
            heading.textContent = event.target.value.trim() || '新增帳號';
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        syncPartnerReviewFields(form);
        if (!validatePartnerForm(form)) {
            const firstError = form.querySelector('.form-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('請先補齊必填欄位', 'error');
            return;
        }

        const payload = collectPartnerPayload(form, { requireIdentity: true });
        const saved = {
            ...payload,
            id: generateNextMemberId(),
        };

        upsertStoredPartner(saved);
        const taxHint = form.querySelector('[data-partner-tax-hint]');
        showToast(taxHint && !taxHint.hidden ? `已建立帳號 ${saved.id}（統編提醒）` : `已建立帳號 ${saved.id}`);
        window.setTimeout(() => {
            window.location.href = listUrl;
        }, 500);
    });
}

function bindPartnerRegisterForm(form) {
    const success = document.querySelector('[data-partner-register-success]');
    const actions = document.querySelector('[data-partner-register-actions]');
    const loginLink = document.querySelector('[data-partner-register-login-link]');
    const idLabel = document.querySelector('[data-partner-register-id]');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
        let valid = true;

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
        if (password && password !== confirm) {
            form.querySelector('[name="password_confirmation"]')?.classList.add('form-error');
            valid = false;
            showToast('兩次密碼不一致', 'error');
        }

        const privacy = form.querySelector('[name="privacy"]');
        if (privacy && !privacy.checked) {
            privacy.classList.add('form-error');
            valid = false;
        }

        if (!valid) {
            const firstError = form.querySelector('.form-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (password === confirm) {
                showToast('請先補齊必填欄位', 'error');
            }
            return;
        }

        const saved = {
            id: generateNextMemberId(),
            identity: '',
            level: '',
            oem_sales: form.querySelector('[name="oem_sales"]')?.value.trim() || '',
            oem_sales_id: '',
            manager_id: '',
            company: form.querySelector('[name="company"]')?.value.trim() || '',
            tax_id: form.querySelector('[name="tax_id"]')?.value.trim() || '',
            country: form.querySelector('[name="country"]')?.value || 'tw',
            name: form.querySelector('[name="name"]')?.value.trim() || '',
            email: form.querySelector('[name="email"]')?.value.trim() || '',
            phone: form.querySelector('[name="phone"]')?.value.trim() || '',
            job_title: form.querySelector('[name="job_title"]')?.value.trim() || '',
            status: 'reviewing',
            applied_at: formatAppliedAt(),
        };

        upsertStoredPartner(saved);

        form.querySelectorAll('input, button, .form-select-trigger').forEach((el) => {
            if (el.closest('[data-partner-register-success]')) {
                return;
            }
            if (el instanceof HTMLElement && el.tagName !== 'A') {
                el.setAttribute('disabled', 'disabled');
            }
        });

        if (idLabel) idLabel.textContent = saved.id;
        if (actions) actions.hidden = true;
        if (loginLink) loginLink.hidden = true;
        if (success) success.hidden = false;
        showToast(`申請已送出，編號 ${saved.id}`);
        success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

document.querySelectorAll('[data-partner-list]').forEach(bindPartnerList);
document.querySelectorAll('[data-partner-edit-form]').forEach(bindPartnerEditForm);
document.querySelectorAll('[data-partner-create-form]').forEach(bindPartnerCreateForm);
document.querySelectorAll('[data-partner-register-form]').forEach(bindPartnerRegisterForm);
