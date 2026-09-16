/* ---------- 商機中心：暫存／送出／審核／列表動作 ---------- */

const app = () => window.upasApp || {};

const OPPORTUNITY_DRAFTS_KEY = 'upas-opportunity-drafts';
const OPPORTUNITY_STORE_KEY = 'upas-opportunity-store';

const DEFAULT_STATUS_LABELS = {
    draft: '暫存',
    approved: '已核准',
    reviewing: '審核中',
    rejected: '退回補件',
    expiring: '即將到期',
    expired: '已到期',
    cancelled: '已取消',
    completed: '已結案',
    invalid: '已失效',
};

const DEFAULT_STATUS_ICONS = {
    draft: 'file-pen-line',
    approved: 'check-circle',
    reviewing: 'clock',
    rejected: 'file-warning',
    expiring: 'alert-circle',
    expired: 'circle-x',
    cancelled: 'ban',
    completed: 'circle-check',
    invalid: 'circle-off',
};

const DEFAULT_DEALER_LABELS = {
    oem: '原廠業務',
    tw: '台灣經銷商',
    overseas: '海外經銷商',
};

const RENEWAL_DAYS = 90;

function showAppToast(message, tone = 'default') {
    let host = document.querySelector('[data-app-toast-host]');
    if (!host) {
        host = document.createElement('div');
        host.className = 'app-toast-host';
        host.setAttribute('data-app-toast-host', '');
        document.body.appendChild(host);
    }

    const toast = document.createElement('div');
    toast.className = `app-toast app-toast--${tone}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    host.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('is-visible');
    });

    window.setTimeout(() => {
        toast.classList.remove('is-visible');
        window.setTimeout(() => toast.remove(), 280);
    }, 2600);
}

function parseJsonScript(id, fallback = {}) {
    const el = document.getElementById(id);
    if (!el) {
        return fallback;
    }

    try {
        return JSON.parse(el.textContent) || fallback;
    } catch (error) {
        return fallback;
    }
}

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function formatDateTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatAmount(value) {
    const amount = Number(value || 0);
    if (!amount) {
        return '-';
    }

    return `$${amount.toLocaleString('en-US')}`;
}

function addDaysIso(days, from = new Date()) {
    const date = new Date(from);
    date.setDate(date.getDate() + days);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return new Date();
    }

    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function protectionForStatus(status, protection) {
    if (status === 'completed') {
        return '-';
    }

    const value = protection == null ? '' : String(protection).trim();
    return value === '' ? '-' : value;
}

function readJsonMap(key) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function writeJsonMap(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function readOpportunityDrafts() {
    return readJsonMap(OPPORTUNITY_DRAFTS_KEY);
}

function writeOpportunityDrafts(drafts) {
    writeJsonMap(OPPORTUNITY_DRAFTS_KEY, drafts);
}

function getOpportunityDraft(id) {
    return id ? readOpportunityDrafts()[id] || null : null;
}

function upsertOpportunityDraft(draft) {
    const drafts = readOpportunityDrafts();
    drafts[draft.id] = draft;
    writeOpportunityDrafts(drafts);
    return draft;
}

function removeOpportunityDraft(id) {
    if (!id) {
        return;
    }

    const drafts = readOpportunityDrafts();
    if (!(id in drafts)) {
        return;
    }

    delete drafts[id];
    writeOpportunityDrafts(drafts);
}

function createOpportunityDraftId() {
    const stamp = new Date();
    const y = String(stamp.getFullYear()).slice(-2);
    const m = String(stamp.getMonth() + 1).padStart(2, '0');
    const d = String(stamp.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `DRAFT-${y}${m}${d}${rand}`;
}

function createOpportunityId() {
    const stamp = new Date();
    const y = String(stamp.getFullYear()).slice(-2);
    const m = String(stamp.getMonth() + 1).padStart(2, '0');
    const d = String(stamp.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `N${y}${m}${d}${rand}`;
}

function readOpportunityStore() {
    return readJsonMap(OPPORTUNITY_STORE_KEY);
}

function writeOpportunityStore(store) {
    writeJsonMap(OPPORTUNITY_STORE_KEY, store);
}

function getSeedCatalog() {
    return parseJsonScript('opportunity-catalog-data', {});
}

function getListMeta() {
    return parseJsonScript('opportunity-list-meta', {
        reviewUrl: '/opportunities/review/',
        createUrl: '/opportunities/create/',
        renewUrl: '/opportunities/renew/',
        partner: {},
        statusLabels: DEFAULT_STATUS_LABELS,
        statusIcons: DEFAULT_STATUS_ICONS,
        dealerLabels: DEFAULT_DEALER_LABELS,
    });
}

function getDealerLabels() {
    const meta = getListMeta();
    return meta.dealerLabels || DEFAULT_DEALER_LABELS;
}

function getDealerLabel(value) {
    const labels = getDealerLabels();
    return labels[value] || labels.tw || '台灣經銷商';
}

function getRowCustomerName(row) {
    return row.querySelector('[data-opp-customer]')?.textContent?.trim() || '';
}

function setRowDealerUi(row, dealer) {
    const key = dealer || 'tw';
    row.dataset.dealer = key;
    const dealerEl = row.querySelector('[data-opp-dealer]');
    if (dealerEl) {
        dealerEl.textContent = getDealerLabel(key);
    }
}

function opportunitySearchText(id, customer, dealer) {
    return `${id} ${customer || ''} ${getDealerLabel(dealer)}`;
}

function getStatusLabels() {
    const fromScript = parseJsonScript('opportunity-status-labels', null);
    if (fromScript && Object.keys(fromScript).length) {
        return fromScript;
    }

    const meta = getListMeta();
    return meta.statusLabels || DEFAULT_STATUS_LABELS;
}

function getStatusIcons() {
    const meta = getListMeta();
    return meta.statusIcons || DEFAULT_STATUS_ICONS;
}

function getStatusLabel(status) {
    return getStatusLabels()[status] || DEFAULT_STATUS_LABELS[status] || status;
}

function isPendingRenewal(record) {
    return record?.renewal?.status === 'pending';
}

function isRejectedRenewal(record) {
    return Boolean(record?.renewal) && record?.status === 'rejected';
}

function isRenewalReview(record) {
    return Boolean(record?.renewal) && (record?.status === 'reviewing' || record?.status === 'rejected');
}

function canApplyRenewal(record) {
    if (!record) {
        return false;
    }

    if (record.status === 'approved' || record.status === 'expiring') {
        return true;
    }

    return isRejectedRenewal(record);
}

function renewalPageUrl(id, meta = getListMeta()) {
    const renewUrl = meta.renewUrl || '/opportunities/renew/';
    return `${renewUrl}?id=${encodeURIComponent(id)}`;
}

function getOpportunityById(id) {
    if (!id) {
        return null;
    }

    const seed = getSeedCatalog()[id] || null;
    const stored = readOpportunityStore()[id] || null;

    if (!seed && !stored) {
        return null;
    }

    return {
        ...(seed || {}),
        ...(stored || {}),
        review: stored?.review !== undefined ? stored.review : seed?.review ?? null,
        form: stored?.form || seed?.form || null,
        renewal: stored?.renewal !== undefined ? stored.renewal : seed?.renewal ?? null,
    };
}

function upsertOpportunity(record) {
    if (!record?.id) {
        return null;
    }

    const store = readOpportunityStore();
    store[record.id] = {
        ...(store[record.id] || {}),
        ...record,
        updatedAt: new Date().toISOString(),
    };
    writeOpportunityStore(store);
    return store[record.id];
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
        labelEl.textContent = value || labelEl.textContent;
        labelEl.classList.toggle('is-placeholder', !value);
    }
}

function clearFormSelect(select, placeholder) {
    if (!select) {
        return;
    }

    const hidden = select.querySelector('[data-form-select-value]');
    const labelEl = select.querySelector('[data-form-select-label]');
    const trigger = select.querySelector('[data-form-select-trigger]');
    const menu = select._formMenu || select.querySelector('[data-form-select-menu]');

    if (hidden) {
        hidden.value = '';
    }
    if (labelEl) {
        labelEl.textContent = placeholder || '請選擇';
        labelEl.classList.add('is-placeholder');
    }
    if (trigger) {
        trigger.classList.remove('form-error');
    }
    if (menu) {
        menu.querySelectorAll('[data-form-select-option]').forEach((item) => {
            item.classList.remove('is-selected');
        });
    }
}

function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) {
        return '';
    }
    if (size < 1024) {
        return `${size} B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileUploadRoot(scope = document) {
    return scope.querySelector('[data-file-upload]');
}

function readAttachmentFromUpload(scope = document) {
    const root = getFileUploadRoot(scope);
    if (!root) {
        return null;
    }

    const name = root.querySelector('[data-file-name]')?.value || '';
    if (!name) {
        return null;
    }

    const size = Number(root.querySelector('[data-file-size]')?.value || 0);
    const type = root.querySelector('[data-file-type]')?.value || '';

    return {
        name,
        size,
        type,
        sizeLabel: formatFileSize(size),
        url: '#',
    };
}

function setFileUploadValue(attachment, scope = document) {
    const root = getFileUploadRoot(scope);
    if (!root) {
        return;
    }

    const dropzone = root.querySelector('[data-file-trigger]');
    const item = root.querySelector('[data-file-item]');
    const nameInput = root.querySelector('[data-file-name]');
    const sizeInput = root.querySelector('[data-file-size]');
    const typeInput = root.querySelector('[data-file-type]');
    const nameEl = root.querySelector('[data-file-item-name]');
    const metaEl = root.querySelector('[data-file-item-meta]');
    const fileInput = root.querySelector('[data-file-input]');

    if (!attachment || !attachment.name) {
        if (nameInput) nameInput.value = '';
        if (sizeInput) sizeInput.value = '';
        if (typeInput) typeInput.value = '';
        if (fileInput) fileInput.value = '';
        if (dropzone) dropzone.hidden = false;
        if (item) item.hidden = true;
        return;
    }

    if (nameInput) nameInput.value = attachment.name;
    if (sizeInput) sizeInput.value = String(attachment.size || '');
    if (typeInput) typeInput.value = attachment.type || '';
    if (nameEl) nameEl.textContent = attachment.name;
    if (metaEl) {
        metaEl.textContent = attachment.sizeLabel || formatFileSize(attachment.size) || attachment.type || '已選擇檔案';
    }
    if (dropzone) dropzone.hidden = true;
    if (item) item.hidden = false;

    if (typeof app().refreshIcons === 'function') {
        app().refreshIcons(root);
    }
}

function bindFileUpload(scope = document) {
    const root = getFileUploadRoot(scope);
    if (!root || root.dataset.bound === 'true') {
        return;
    }

    const fileInput = root.querySelector('[data-file-input]');
    const trigger = root.querySelector('[data-file-trigger]');
    const removeBtn = root.querySelector('[data-file-remove]');
    if (!fileInput || !trigger) {
        return;
    }

    root.dataset.bound = 'true';
    const maxBytes = 2 * 1024 * 1024;

    const applyFile = (file) => {
        if (!file) {
            return;
        }

        if (file.size > maxBytes) {
            showAppToast('檔案超過 2MB，請重新選擇', 'error');
            fileInput.value = '';
            return;
        }

        setFileUploadValue({
            name: file.name,
            size: file.size,
            type: file.type || '',
            sizeLabel: formatFileSize(file.size),
            url: '#',
        }, root);
    };

    trigger.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        applyFile(fileInput.files?.[0] || null);
    });

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
        const file = event.dataTransfer?.files?.[0];
        if (file) {
            applyFile(file);
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            setFileUploadValue(null, root);
        });
    }
}

function collectOpportunityFormData(form) {
    const data = {
        source: '',
        oem_sales: '',
        customer_relation: '',
        competitors: '',
        products: [],
        units: [],
        fields: {},
        attachment: null,
    };

    const sourceInput = form.querySelector('[data-source-input]:checked');
    data.source = sourceInput ? sourceInput.value : '';

    form.querySelectorAll('input[name], textarea[name]').forEach((field) => {
        const name = field.name;
        if (
            !name
            || name === 'source'
            || name === 'products[]'
            || name === 'units[]'
            || name === 'customer_relation'
            || name === 'attachment_name'
            || name === 'attachment_size'
            || name === 'attachment_type'
        ) {
            return;
        }

        if (field.classList.contains('is-readonly') || field.type === 'file') {
            return;
        }

        data.fields[name] = field.value;
        if (name === 'oem_sales') {
            data.oem_sales = field.value;
        }
        if (name === 'competitors') {
            data.competitors = field.value;
        }
    });

    const relation = form.querySelector('[name="customer_relation"]');
    data.customer_relation = relation ? relation.value : '';

    form.querySelectorAll('[data-product-row]').forEach((row) => {
        const product = row.querySelector('[name="products[]"]');
        const units = row.querySelector('[name="units[]"]');
        data.products.push(product ? product.value : '');
        data.units.push(units ? units.value : '0-499');
    });

    data.attachment = readAttachmentFromUpload(form);

    return data;
}

function applyOpportunityFormData(form, payload) {
    if (!form || !payload) {
        return;
    }

    const data = payload.data || payload;

    if (data.source) {
        const sourceInput = form.querySelector(`[data-source-input][value="${CSS.escape(data.source)}"]`);
        if (sourceInput) {
            sourceInput.checked = true;
            sourceInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    Object.entries(data.fields || {}).forEach(([name, value]) => {
        const field = form.querySelector(`[name="${CSS.escape(name)}"]`);
        if (field && !field.classList.contains('is-readonly')) {
            field.value = value ?? '';
        }
    });

    const relationSelect = form.querySelector('[name="customer_relation"]')?.closest('[data-form-select]');
    if (relationSelect) {
        setFormSelectByValue(relationSelect, data.customer_relation || '');
    }

    const productRows = app().productRows;
    const productRowTemplate = app().productRowTemplate;
    if (productRows && productRowTemplate) {
        const products = Array.isArray(data.products) && data.products.length ? data.products : [''];
        const units = Array.isArray(data.units) ? data.units : [];

        if (typeof app().closeFormSelects === 'function') {
            app().closeFormSelects();
        }

        productRows.innerHTML = '';
        products.forEach((product, index) => {
            const fragment = productRowTemplate.content.cloneNode(true);
            const row = fragment.querySelector('[data-product-row]');
            productRows.appendChild(fragment);
            if (!row) {
                return;
            }

            if (typeof app().bindFormSelects === 'function') {
                app().bindFormSelects(row);
            }
            const productSelect = row.querySelector('[name="products[]"]')?.closest('[data-form-select]');
            const unitsSelect = row.querySelector('[name="units[]"]')?.closest('[data-form-select]');
            setFormSelectByValue(productSelect, product || '');
            setFormSelectByValue(unitsSelect, units[index] || '0-499');
            if (typeof app().refreshIcons === 'function') {
                app().refreshIcons(row);
            }
        });

        if (typeof app().syncProductRowRemoveButtons === 'function') {
            app().syncProductRowRemoveButtons();
        }
    }

    setFileUploadValue(data.attachment || payload.attachment || null, form);
}

function validateOpportunityForm(form) {
    let valid = true;
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

    form.querySelectorAll('input[required], textarea[required]').forEach((field) => {
        if (field.classList.contains('is-readonly')) {
            return;
        }

        if (!String(field.value || '').trim()) {
            field.classList.add('form-error');
            valid = false;
        }
    });

    form.querySelectorAll('[data-form-select][data-required]').forEach((select) => {
        const hidden = select.querySelector('[data-form-select-value]');
        const trigger = select.querySelector('[data-form-select-trigger]');
        if (hidden && !String(hidden.value || '').trim()) {
            if (trigger) {
                trigger.classList.add('form-error');
            }
            valid = false;
        }
    });

    return valid;
}

function focusFirstOpportunityError(form) {
    const firstError = form.querySelector('.form-error');
    if (!firstError) {
        return;
    }

    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof firstError.focus === 'function') {
        firstError.focus({ preventScroll: true });
    }
}

function draftListLabel(draft) {
    const customer = draft?.data?.fields?.customer_company;
    if (customer && String(customer).trim()) {
        return String(customer).trim();
    }

    return '（暫存）尚未填寫完整';
}

function formDataToRecord(formData, options = {}) {
    const meta = getListMeta();
    const partner = meta.partner || {};
    const fields = formData.fields || {};
    const products = (formData.products || []).filter(Boolean);
    const customer = String(fields.customer_company || '').trim() || '未命名客戶';
    const productLine = products.join('、') || '—';
    const id = options.id || createOpportunityId();
    const status = options.status || 'reviewing';

    return {
        id,
        status,
        statusLabel: getStatusLabel(status),
        title: `${customer} | 商機報備`,
        dealerName: partner.company || '經銷商',
        submittedAt: options.submittedAt || formatDateTime(),
        customer_company: customer,
        tax_id: fields.tax_id || '—',
        amount: options.amount || '-',
        amountValue: Number(options.amountValue || 0),
        close_date: fields.decision_date || fields.complete_date || '—',
        product_line: productLine,
        requirement: formData.competitors || `產品：${productLine}`,
        attachment: formData.attachment || options.attachment || null,
        booking_code: options.booking_code || id,
        dealer: options.dealer || 'tw',
        protection: options.protection || '-',
        review: options.review !== undefined ? options.review : null,
        form: formData,
        local: true,
    };
}

function catalogFormFallback(record) {
    if (record?.form) {
        return {
            ...record.form,
            attachment: record.form.attachment || record.attachment || null,
        };
    }

    const productLine = record?.product_line ? String(record.product_line).split('、').map((s) => s.trim()).filter(Boolean) : [''];

    return {
        source: 'self',
        oem_sales: '',
        customer_relation: '',
        competitors: record?.requirement || '',
        products: productLine.length ? productLine : [''],
        units: productLine.map(() => '0-499'),
        attachment: record?.attachment || null,
        fields: {
            oem_sales: '',
            customer_company: record?.customer_company || '',
            customer_address: '',
            contact_name: '',
            contact_title: '',
            contact_phone: '',
            contact_email: '',
            keyman_name: '',
            keyman_phone: '',
            keyman_email: '',
            poc_date: '',
            decision_date: record?.close_date ? String(record.close_date).replace(/\s+/g, '') : '',
            delivery_date: '',
            complete_date: '',
        },
    };
}

/* ---------- 列表更多選單 ---------- */

function closeRowMoreMenus(except) {
    document.querySelectorAll('[data-row-more].is-open').forEach((wrap) => {
        if (except && wrap === except) {
            return;
        }

        wrap.classList.remove('is-open');
        const trigger = wrap.querySelector('[data-row-more-trigger]');
        const menu = wrap._moreMenu || wrap.querySelector('[data-row-more-menu]');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
        if (menu) {
            menu.classList.remove('is-open');
            menu.hidden = true;
            menu.style.removeProperty('top');
            menu.style.removeProperty('left');
            menu.style.removeProperty('right');
            menu.style.removeProperty('width');
            menu.style.removeProperty('min-width');
            menu.style.removeProperty('position');
            if (menu._moreOwner) {
                menu._moreOwner.appendChild(menu);
            }
        }
    });
}

window.closeRowMoreMenusImpl = closeRowMoreMenus;

function positionRowMoreMenu(trigger, menu) {
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    menu.style.position = 'fixed';
    menu.style.width = 'max-content';
    menu.style.minWidth = '11rem';
    menu.style.left = 'auto';
    menu.style.right = `${Math.round(viewportWidth - rect.right)}px`;
    menu.style.top = '0px';

    const menuWidth = menu.getBoundingClientRect().width || 176;
    const menuHeight = menu.getBoundingClientRect().height || 160;
    let top = rect.bottom + gap;

    if (top + menuHeight > viewportHeight - 12) {
        top = Math.max(12, rect.top - menuHeight - gap);
    }

    if (rect.right - menuWidth < 12) {
        menu.style.right = 'auto';
        menu.style.left = '12px';
    }

    menu.style.top = `${Math.round(top)}px`;
}

function getRowMoreActions(status) {
    const canCreate = typeof app().roleCan === 'function' ? app().roleCan('opportunity.create') : false;
    const canActions = typeof app().roleCan === 'function' ? app().roleCan('opportunity.actions') : false;
    // 續期／取消：有建立權限的一般使用者也可；結案：僅總管理者 + 已到期
    const canManageOwn = canCreate || canActions;

    // 四個動作固定顯示；不可用時 gray 禁用（進入詳情／編輯由列上鉛筆負責）
    return [
        {
            action: 'delete-draft',
            label: '刪除',
            icon: 'trash-2',
            danger: true,
            enabled: status === 'draft' && canCreate,
        },
        {
            action: 'renew',
            label: '申請續期',
            icon: 'refresh-cw',
            enabled: (status === 'approved' || status === 'expiring') && canManageOwn,
        },
        {
            action: 'close',
            label: '結案',
            icon: 'circle-check',
            enabled: status === 'expired' && canActions,
        },
        {
            action: 'cancel',
            label: '取消商機',
            icon: 'ban',
            danger: true,
            enabled: ['approved', 'expiring', 'reviewing', 'rejected'].includes(status) && canManageOwn,
        },
    ];
}

function buildRowMoreMenuHtml(status) {
    return getRowMoreActions(status).map((item) => {
        const disabled = !item.enabled;
        return `
        <button
            type="button"
            class="row-more-item ${item.danger && !disabled ? 'is-danger' : ''}${disabled ? ' is-disabled' : ''}"
            role="menuitem"
            data-row-more-action="${item.action}"
            ${disabled ? 'disabled aria-disabled="true"' : ''}
        >
            <i data-lucide="${item.icon}" class="w-3.5 h-3.5 shrink-0"></i>
            <span>${item.label}</span>
        </button>
    `;
    }).join('');
}

function handleRowMoreAction(row, action) {
    const id = row.dataset.oppId;
    const meta = getListMeta();
    const reviewUrl = meta.reviewUrl || '/opportunities/review/';
    const createUrl = meta.createUrl || '/opportunities/create/';

    if (action === 'view' || action === 'review') {
        window.location.href = `${reviewUrl}?id=${encodeURIComponent(id)}`;
        return;
    }

    if (action === 'edit-draft') {
        window.location.href = `${createUrl}?draft=${encodeURIComponent(id)}`;
        return;
    }

    if (action === 'resubmit') {
        const record = getOpportunityById(id);
        if (isRejectedRenewal(record)) {
            window.location.href = renewalPageUrl(id, meta);
            return;
        }
        window.location.href = `${createUrl}?id=${encodeURIComponent(id)}`;
        return;
    }

    if (action === 'delete-draft') {
        if (!window.confirm(`確定刪除暫存 ${id}？`)) {
            return;
        }
        removeOpportunityDraft(id);
        row.remove();
        if (typeof app().applyOpportunityFilters === 'function') {
            app().applyOpportunityFilters();
        }
        showAppToast('已刪除暫存檔', 'success');
        return;
    }

    if (action === 'renew') {
        const renewUrl = meta.renewUrl || '/opportunities/renew/';
        window.location.href = `${renewUrl}?id=${encodeURIComponent(id)}`;
        return;
    }

    if (action === 'close') {
        const canClose = typeof app().roleCan === 'function' && app().roleCan('opportunity.actions');
        if (!canClose || row.dataset.status !== 'expired') {
            showAppToast('僅總管理者可對已到期商機結案', 'error');
            return;
        }
        const record = getOpportunityById(id) || {
            id,
            customer_company: getRowCustomerName(row) || id,
            amount: '-',
            amountValue: Number(row.dataset.amount || 0),
            dealer: row.dataset.dealer || 'tw',
        };
        upsertOpportunity({
            ...record,
            status: 'completed',
            statusLabel: getStatusLabel('completed'),
            protection: '-',
        });
        syncOpportunityListUi();
        showAppToast('已結案，不再保留保護期', 'success');
        return;
    }

    if (action === 'cancel') {
        if (!window.confirm(`確定取消商機 ${id}？`)) {
            return;
        }
        const record = getOpportunityById(id) || {
            id,
            customer_company: getRowCustomerName(row) || id,
            amount: '-',
            amountValue: Number(row.dataset.amount || 0),
            dealer: row.dataset.dealer || 'tw',
        };
        upsertOpportunity({
            ...record,
            status: 'cancelled',
            statusLabel: getStatusLabel('cancelled'),
        });
        syncOpportunityListUi();
        showAppToast('商機已取消', 'success');
    }
}

function bindRowMore(wrap) {
    if (!wrap || wrap.dataset.bound === 'true') {
        return;
    }

    const trigger = wrap.querySelector('[data-row-more-trigger]');
    const menu = wrap.querySelector('[data-row-more-menu]');
    if (!trigger || !menu) {
        return;
    }

    wrap.dataset.bound = 'true';
    menu._moreOwner = wrap;
    wrap._moreMenu = menu;

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const willOpen = !wrap.classList.contains('is-open');
        closeRowMoreMenus();
        if (typeof app().closeStatusSelects === 'function') {
            app().closeStatusSelects();
        }
        if (typeof app().closeFilterDropdown === 'function') {
            app().closeFilterDropdown();
        }
        if (typeof app().closeFormSelects === 'function') {
            app().closeFormSelects();
        }

        if (!willOpen) {
            return;
        }

        const row = wrap.closest('[data-opp-row]');
        menu.innerHTML = buildRowMoreMenuHtml(row?.dataset.status || '');
        document.body.appendChild(menu);
        menu.hidden = false;
        menu.classList.add('is-open');
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        if (typeof app().refreshIcons === 'function') {
            app().refreshIcons(menu);
        }
        positionRowMoreMenu(trigger, menu);
    });

    menu.addEventListener('click', (event) => {
        event.stopPropagation();
        const button = event.target.closest('[data-row-more-action]');
        if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') {
            return;
        }

        const row = wrap.closest('[data-opp-row]');
        closeRowMoreMenus();
        if (row) {
            handleRowMoreAction(row, button.dataset.rowMoreAction);
        }
    });
}

function bindAllRowMoreMenus(scope = document) {
    scope.querySelectorAll('[data-row-more]').forEach(bindRowMore);
}

function updateRowActions(row) {
    const id = row.dataset.oppId;
    const status = row.dataset.status;
    const meta = getListMeta();
    const actions = row.querySelector('[data-opp-actions]');
    if (!actions || !id) {
        return;
    }

    const canCreate = typeof app().roleCan === 'function' && app().roleCan('opportunity.create');
    const canReview = typeof app().roleCan === 'function' && app().roleCan('opportunity.review');
    const reviewUrl = `${meta.reviewUrl || '/opportunities/review/'}?id=${encodeURIComponent(id)}`;
    const createUrl = `${meta.createUrl || '/opportunities/create/'}`;
    const more = actions.querySelector('[data-row-more]');

    actions.classList.add('justify-end');

    // remove legacy buttons
    actions.querySelectorAll('[data-opp-primary-action], [data-opp-review-action]').forEach((el) => el.remove());

    let editBtn = actions.querySelector('[data-opp-edit-action]');
    if (!editBtn) {
        editBtn = document.createElement('a');
        editBtn.className = 'icon-action';
        editBtn.setAttribute('data-opp-edit-action', '');
        editBtn.innerHTML = '<i data-lucide="square-pen" class="w-4 h-4"></i>';
        actions.insertBefore(editBtn, more || null);
    }

    if (status === 'draft') {
        editBtn.href = `${createUrl}?draft=${encodeURIComponent(id)}`;
        editBtn.setAttribute('data-requires', 'opportunity.create');
        editBtn.setAttribute('aria-label', `繼續編輯 ${id}`);
        editBtn.title = '繼續編輯暫存檔';
        editBtn.hidden = !canCreate;
        editBtn.classList.toggle('is-role-hidden', !canCreate);
    } else if (status === 'rejected') {
        const record = getOpportunityById(id);
        editBtn.href = isRejectedRenewal(record)
            ? renewalPageUrl(id, meta)
            : `${createUrl}?id=${encodeURIComponent(id)}`;
        editBtn.removeAttribute('data-requires');
        editBtn.setAttribute('aria-label', `補件編輯 ${id}`);
        editBtn.title = isRejectedRenewal(record) ? '補件編輯續期申請' : '補件編輯';
        editBtn.hidden = !canCreate;
        editBtn.classList.toggle('is-role-hidden', !canCreate);
    } else {
        editBtn.href = reviewUrl;
        editBtn.removeAttribute('data-requires');
        editBtn.setAttribute('aria-label', `編輯 ${id}`);
        editBtn.title = status === 'reviewing' && canReview ? '檢視／審核商機' : '編輯商機';
        editBtn.hidden = false;
        editBtn.classList.remove('is-role-hidden');
    }

    editBtn.innerHTML = '<i data-lucide="square-pen" class="w-4 h-4"></i>';

    if (editBtn && more) {
        actions.insertBefore(editBtn, more);
    }

    if (typeof app().refreshIcons === 'function') {
        app().refreshIcons(actions);
    }
}

function updateRowPrimaryAction(row) {
    updateRowActions(row);
}

function setRowStatusUi(row, status, label) {
    row.dataset.status = status;
    const select = row.querySelector('[data-status-select]');
    const trigger = select?.querySelector('[data-status-trigger]');
    const labelEl = select?.querySelector('[data-status-label]');
    const iconEl = select?.querySelector('[data-status-icon]');
    const icons = getStatusIcons();

    if (trigger) {
        trigger.className = `status-trigger status-${status}`;
    }
    if (labelEl) {
        labelEl.textContent = label || getStatusLabel(status);
    }
    if (iconEl) {
        const nextIcon = document.createElement('i');
        nextIcon.setAttribute('data-lucide', icons[status] || 'circle');
        nextIcon.className = 'status-trigger-icon';
        nextIcon.setAttribute('data-status-icon', '');
        iconEl.replaceWith(nextIcon);
    }

    if (select?.querySelector('[data-status-menu]')) {
        select.querySelectorAll('[data-status-option]').forEach((option) => {
            const selected = option.dataset.value === status;
            option.classList.toggle('is-selected', selected);
            option.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
    }

    updateRowPrimaryAction(row);
    if (typeof app().refreshIcons === 'function') {
        app().refreshIcons(row);
    }
}

function persistOpportunityRowStatus(row, status, label) {
    const id = row.dataset.oppId;
    if (!id || status === 'draft') {
        return;
    }

    const existing = getOpportunityById(id) || {
        id,
        customer_company: getRowCustomerName(row) || id,
        amount: '-',
        amountValue: Number(row.dataset.amount || 0),
        dealer: row.dataset.dealer || 'tw',
        protection: row.querySelector('[data-opp-protection]')?.textContent?.trim() || '-',
    };
    const protection = protectionForStatus(status, existing.protection);

    upsertOpportunity({
        ...existing,
        status,
        statusLabel: label || getStatusLabel(status),
        protection,
    });

    const protectionEl = row.querySelector('[data-opp-protection]');
    if (protectionEl) {
        protectionEl.textContent = protection;
    }

    row.dataset.status = status;
    updateRowPrimaryAction(row);
}

window.persistOpportunityRowStatus = persistOpportunityRowStatus;

function ensureRowMoreShell(row) {
    const actions = row.querySelector('[data-opp-actions]');
    if (!actions) {
        return;
    }

    if (!actions.querySelector('[data-row-more]')) {
        const wrap = document.createElement('div');
        wrap.className = 'row-more';
        wrap.setAttribute('data-row-more', '');
        wrap.innerHTML = `
            <button type="button" class="icon-action" data-row-more-trigger aria-haspopup="menu" aria-expanded="false" aria-label="更多">
                <i data-lucide="more-vertical" class="w-4 h-4"></i>
            </button>
            <div class="row-more-menu" data-row-more-menu hidden role="menu"></div>
        `;
        actions.appendChild(wrap);
    }

    bindRowMore(actions.querySelector('[data-row-more]'));
}

function buildOpportunityListRow(record) {
    const meta = getListMeta();
    const icons = getStatusIcons();
    const status = record.status || 'reviewing';
    const label = record.statusLabel || getStatusLabel(status);
    const row = document.createElement('div');
    row.className = 'px-4 py-2 bg-white border-b border-gray1 inline-flex w-full items-center';
    row.dataset.oppRow = '';
    row.dataset.oppId = record.id;
    row.dataset.dealer = record.dealer || 'tw';
    row.dataset.amount = String(record.amountValue || 0);
    row.dataset.status = status;
    row.dataset.search = opportunitySearchText(record.id, record.customer_company, record.dealer);
    row.dataset.localRecord = 'true';

    const reviewUrl = `${meta.reviewUrl || '/opportunities/review/'}?id=${encodeURIComponent(record.id)}`;
    const sampleMenu = document.querySelector('[data-opp-row] [data-status-menu]');
    const menuHtml = sampleMenu ? sampleMenu.outerHTML : '';

    row.innerHTML = `
        <div class="w-36 text-eb2 text-gray5 uppercase">${record.id}</div>
        <div class="flex-1 text-cb3 text-gray5" data-opp-customer></div>
        <div class="w-32 shrink-0 text-cb3 text-gray5" data-opp-dealer>${getDealerLabel(record.dealer)}</div>
        <div class="w-40 shrink-0 flex items-center">
            <div class="status-select" data-status-select>
                <button type="button" class="status-trigger status-${status}" data-status-trigger aria-haspopup="listbox" aria-expanded="false">
                    <span class="status-trigger-main">
                        <i data-lucide="${icons[status] || 'circle'}" class="status-trigger-icon" data-status-icon></i>
                        <span class="truncate" data-status-label>${label}</span>
                    </span>
                    <i data-lucide="chevron-down" class="status-trigger-caret"></i>
                </button>
                ${menuHtml}
            </div>
        </div>
        <div class="w-28 shrink-0 text-eb3 text-gray5 uppercase" data-opp-protection>${protectionForStatus(status, record.protection)}</div>
        <div class="w-32 shrink-0 inline-flex items-center justify-end gap-1" data-opp-actions>
            <a href="${status === 'rejected' ? (isRejectedRenewal(record) ? renewalPageUrl(record.id, meta) : `${meta.createUrl || '/opportunities/create/'}?id=${encodeURIComponent(record.id)}`) : reviewUrl}" class="icon-action" data-opp-edit-action aria-label="編輯 ${record.id}" title="${status === 'reviewing' ? '檢視／審核商機' : '編輯商機'}">
                <i data-lucide="square-pen" class="w-4 h-4"></i>
            </a>
            <div class="row-more" data-row-more>
                <button type="button" class="icon-action" data-row-more-trigger aria-haspopup="menu" aria-expanded="false" aria-label="更多 ${record.id}">
                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                </button>
                <div class="row-more-menu" data-row-more-menu hidden role="menu"></div>
            </div>
        </div>
    `;

    const customerEl = row.querySelector('[data-opp-customer]');
    if (customerEl) {
        customerEl.textContent = record.customer_company || record.id;
    }

    const select = row.querySelector('[data-status-select]');
    const menu = row.querySelector('[data-status-menu]');
    const trigger = row.querySelector('[data-status-trigger]');
    if (select && menu && trigger && !select.dataset.statusId) {
        // Bind like initial status selects
        const index = `local-${record.id}`;
        select.dataset.statusId = index;
        menu.dataset.owner = index;
        menu._statusOwner = select;
        select._statusMenu = menu;
        menu.hidden = true;
        menu.classList.remove('is-open');

        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (select.classList.contains('is-readonly')) {
                return;
            }
            const willOpen = !select.classList.contains('is-open');
            if (typeof app().closeStatusSelects === 'function') {
                app().closeStatusSelects();
            }
            closeRowMoreMenus();
            if (!willOpen) {
                return;
            }
            document.body.appendChild(menu);
            menu.hidden = false;
            menu.classList.add('is-open');
            select.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            const rect = trigger.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = `${Math.round(rect.bottom + 6)}px`;
            menu.style.left = `${Math.round(rect.left)}px`;
            if (typeof app().refreshIcons === 'function') {
                app().refreshIcons(menu);
            }
        });

        menu.addEventListener('click', (event) => event.stopPropagation());
        menu.querySelectorAll('[data-status-option]').forEach((option) => {
            option.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                setRowStatusUi(row, option.dataset.value, option.dataset.label);
                persistOpportunityRowStatus(row, option.dataset.value, option.dataset.label);
                if (typeof app().closeStatusSelects === 'function') {
                    app().closeStatusSelects();
                }
            });
        });
    }

    return row;
}

function buildDraftOpportunityRow(draft) {
    const meta = getListMeta();
    const createUrl = `${meta.createUrl || '/opportunities/create/'}?draft=${encodeURIComponent(draft.id)}`;
    const label = draftListLabel(draft);
    const row = document.createElement('div');
    row.className = 'px-4 py-2 bg-white border-b border-gray1 inline-flex w-full items-center';
    row.dataset.oppRow = '';
    row.dataset.oppId = draft.id;
    row.dataset.dealer = 'tw';
    row.dataset.amount = '0';
    row.dataset.status = 'draft';
    row.dataset.search = opportunitySearchText(draft.id, label, 'tw');
    row.dataset.localDraft = 'true';

    row.innerHTML = `
        <div class="w-36 text-eb2 text-gray5 uppercase">${draft.id}</div>
        <div class="flex-1 text-cb3 text-gray5" data-opp-customer></div>
        <div class="w-32 shrink-0 text-cb3 text-gray5" data-opp-dealer>${getDealerLabel('tw')}</div>
        <div class="w-40 shrink-0 flex items-center">
            <div class="status-select is-readonly" data-status-select>
                <button type="button" class="status-trigger status-draft" data-status-trigger aria-haspopup="listbox" aria-expanded="false" aria-disabled="true">
                    <span class="status-trigger-main">
                        <i data-lucide="file-pen-line" class="status-trigger-icon" data-status-icon></i>
                        <span class="truncate" data-status-label>暫存</span>
                    </span>
                    <i data-lucide="chevron-down" class="status-trigger-caret"></i>
                </button>
            </div>
        </div>
        <div class="w-28 shrink-0 text-eb3 text-gray5 uppercase" data-opp-protection>-</div>
        <div class="w-32 shrink-0 inline-flex items-center justify-end gap-1" data-opp-actions>
            <a href="${createUrl}" class="icon-action" data-requires="opportunity.create" data-opp-edit-action aria-label="繼續編輯 ${draft.id}" title="繼續編輯暫存檔">
                <i data-lucide="square-pen" class="w-4 h-4"></i>
            </a>
            <div class="row-more" data-row-more>
                <button type="button" class="icon-action" data-row-more-trigger aria-haspopup="menu" aria-expanded="false" aria-label="更多 ${draft.id}">
                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                </button>
                <div class="row-more-menu" data-row-more-menu hidden role="menu"></div>
            </div>
        </div>
    `;

    const customerEl = row.querySelector('[data-opp-customer]');
    if (customerEl) {
        customerEl.textContent = label;
    }
    return row;
}

function syncOpportunityListUi() {
    const list = document.querySelector('[data-opp-row]')?.parentElement;
    if (!list) {
        return;
    }

    const drafts = readOpportunityDrafts();
    const store = readOpportunityStore();
    const seed = getSeedCatalog();

    list.querySelectorAll('[data-opp-row]').forEach((row) => {
        if (!row.dataset.oppId) {
            const idCell = row.children[0];
            if (idCell) {
                row.dataset.oppId = idCell.textContent.trim();
            }
        }

        const id = row.dataset.oppId;
        if (!id) {
            return;
        }

        const record = store[id] || seed[id];
        if (record && row.dataset.status !== 'draft') {
            const customerEl = row.querySelector('[data-opp-customer]');
            if (customerEl && record.customer_company) {
                customerEl.textContent = record.customer_company;
            }
            row.dataset.amount = String(record.amountValue || 0);
            setRowDealerUi(row, record.dealer || row.dataset.dealer || 'tw');
            row.dataset.search = opportunitySearchText(id, record.customer_company, row.dataset.dealer);
            const protection = row.querySelector('[data-opp-protection]');
            if (protection) {
                protection.textContent = protectionForStatus(record.status || row.dataset.status, record.protection);
            }
            setRowStatusUi(row, record.status || row.dataset.status, record.statusLabel);
        }

        if (row.dataset.status === 'draft' && drafts[id]) {
            const customerEl = row.querySelector('[data-opp-customer]');
            const label = draftListLabel(drafts[id]);
            if (customerEl) {
                customerEl.textContent = label;
            }
            row.dataset.search = opportunitySearchText(id, label, row.dataset.dealer || 'tw');
        }

        ensureRowMoreShell(row);
        updateRowPrimaryAction(row);
    });

    Object.keys(drafts).forEach((id) => {
        if (list.querySelector(`[data-opp-row][data-opp-id="${CSS.escape(id)}"]`)) {
            return;
        }
        const empty = list.querySelector('[data-filter-empty]');
        const row = buildDraftOpportunityRow(drafts[id]);
        if (empty) {
            list.insertBefore(row, empty);
        } else {
            list.prepend(row);
        }
        ensureRowMoreShell(row);
        updateRowPrimaryAction(row);
        if (typeof app().refreshIcons === 'function') {
            app().refreshIcons(row);
        }
    });

    Object.keys(store).forEach((id) => {
        if (list.querySelector(`[data-opp-row][data-opp-id="${CSS.escape(id)}"]`)) {
            return;
        }
        if (store[id].status === 'draft') {
            return;
        }
        const empty = list.querySelector('[data-filter-empty]');
        const row = buildOpportunityListRow(store[id]);
        if (empty) {
            list.insertBefore(row, empty);
        } else {
            list.prepend(row);
        }
        ensureRowMoreShell(row);
        updateRowPrimaryAction(row);
        if (typeof app().refreshIcons === 'function') {
            app().refreshIcons(row);
        }
    });

    bindAllRowMoreMenus(list);

    if (typeof app().applyPreviewRole === 'function') {
        // only re-apply capability visibility without recursion loops
        document.querySelectorAll('[data-requires]').forEach((element) => {
            const allowed = app().roleCan(element.dataset.requires);
            element.hidden = !allowed;
            element.classList.toggle('is-role-hidden', !allowed);
        });
        document.querySelectorAll('[data-status-select]').forEach((select) => {
            const canEdit = app().roleCan('opportunity.status.edit');
            const isDraft = select.closest('[data-opp-row]')?.dataset.status === 'draft';
            select.classList.toggle('is-readonly', !canEdit || isDraft);
        });
    }

    if (typeof app().applyOpportunityFilters === 'function') {
        app().applyOpportunityFilters();
    }
}

window.syncOpportunityListUi = syncOpportunityListUi;

/* ---------- 審核頁 ---------- */

function setReviewField(name, value) {
    const field = document.querySelector(`[data-review-field="${name}"]`);
    if (!field) {
        return;
    }
    field.value = value && String(value).trim() !== '' ? value : '—';
}

function renderReviewProductRows(formData) {
    const host = document.querySelector('[data-review-product-rows]');
    if (!host) {
        return;
    }

    const products = Array.isArray(formData?.products) && formData.products.length
        ? formData.products
        : ['—'];
    const units = Array.isArray(formData?.units) ? formData.units : [];

    host.innerHTML = products.map((product, index) => `
        <div class="self-stretch inline-flex items-center gap-3" data-review-product-row>
            <input type="text" class="form-input flex-1 min-w-0 is-readonly" data-review-product value="${String(product || '—').replace(/"/g, '&quot;')}" readonly tabindex="-1">
            <input type="text" class="form-input w-48 shrink-0 is-readonly" data-review-units value="${String(units[index] || '—').replace(/"/g, '&quot;')}" readonly tabindex="-1">
        </div>
    `).join('');
}

function renderReviewPage(record) {
    const page = document.querySelector('[data-review-page]');
    if (!page || !record) {
        return;
    }

    const setText = (selector, value) => {
        const el = page.querySelector(selector) || document.querySelector(selector);
        if (el) {
            el.textContent = value ?? '—';
        }
    };

    const formData = catalogFormFallback(record);
    const fields = formData.fields || {};
    const sourceLabels = parseJsonScript('opportunity-source-labels', {
        self: '自行開發',
        oem: '原廠派發',
    });
    const relationLabels = parseJsonScript('opportunity-relation-labels', {
        first: '第一次接洽',
        repeat: '多次接洽(未成交)',
        other: '其他',
    });

    setText('[data-review-id]', record.id);
    setText('[data-review-id-crumb]', record.id);
    setText('[data-review-title]', fields.customer_company || record.customer_company || record.title || record.id);

    const pill = page.querySelector('[data-review-status-pill]');
    if (pill) {
        pill.className = `status-pill status-${record.status}`;
        pill.textContent = record.statusLabel || getStatusLabel(record.status);
    }

    const renewalBlock = page.querySelector('[data-review-renewal]');
    if (renewalBlock) {
        const renewal = record.renewal;
        renewalBlock.hidden = !renewal;
        if (renewal) {
            setText('[data-review-renewal-days]', `${renewal.days || RENEWAL_DAYS} 天`);
            setText('[data-review-renewal-old]', renewal.oldProtection || record.protection || '—');
            setText('[data-review-renewal-new]', renewal.newProtection || '—');
            setText('[data-review-renewal-reason]', renewal.reason || '—');
            setText('[data-review-renewal-file]', renewal.attachment?.name || '未上傳');
        }
    }

    const crumbKind = document.querySelector('[data-review-crumb-kind]');
    if (crumbKind) {
        crumbKind.textContent = isRenewalReview(record) ? '續期審核' : '商機審核';
    }

    const asideTitle = page.querySelector('[data-review-aside-title]');
    if (asideTitle) {
        asideTitle.textContent = isPendingRenewal(record) ? '續期審核處理' : '審核處理';
    }

    setReviewField('source', sourceLabels[formData.source] || formData.source || '—');
    setReviewField('oem_sales', fields.oem_sales || formData.oem_sales || '—');
    setReviewField(
        'reporter_dealer',
        `${page.dataset.partnerCompany || '經銷商'}／${page.dataset.partnerContact || ''}`
    );
    setReviewField('reporter_phone', page.dataset.partnerPhone || '—');
    setReviewField('customer_company', fields.customer_company || record.customer_company || '—');
    setReviewField('customer_address', fields.customer_address || '—');
    setReviewField('contact_name', fields.contact_name || '—');
    setReviewField('contact_title', fields.contact_title || '—');
    setReviewField('contact_phone', fields.contact_phone || '—');
    setReviewField('contact_email', fields.contact_email || '—');
    setReviewField(
        'customer_relation',
        relationLabels[formData.customer_relation] || formData.customer_relation || '—'
    );
    setReviewField('keyman_name', fields.keyman_name || '—');
    setReviewField('keyman_phone', fields.keyman_phone || '—');
    setReviewField('keyman_email', fields.keyman_email || '—');
    setReviewField('poc_date', fields.poc_date || '—');
    setReviewField('decision_date', fields.decision_date || '—');
    setReviewField('delivery_date', fields.delivery_date || '—');
    setReviewField('complete_date', fields.complete_date || '—');
    setReviewField('competitors', formData.competitors || '');

    renderReviewProductRows(formData);

    const attachment = formData.attachment || record.attachment || null;
    const attachmentWrap = page.querySelector('[data-review-attachment]');
    const attachmentEmpty = page.querySelector('[data-review-attachment-empty]');
    const attachmentName = page.querySelector('[data-review-attachment-name]');
    const attachmentMeta = page.querySelector('[data-review-attachment-meta]');
    const attachmentLink = page.querySelector('[data-review-attachment-link]');
    if (attachment && attachment.name) {
        if (attachmentWrap) {
            attachmentWrap.hidden = false;
        }
        if (attachmentEmpty) {
            attachmentEmpty.hidden = true;
        }
        if (attachmentName) {
            attachmentName.textContent = attachment.name;
        }
        if (attachmentMeta) {
            attachmentMeta.textContent = attachment.sizeLabel || formatFileSize(attachment.size) || attachment.type || '已上傳檔案';
        }
        if (attachmentLink) {
            attachmentLink.href = attachment.url || '#';
        }
    } else {
        if (attachmentWrap) {
            attachmentWrap.hidden = true;
        }
        if (attachmentEmpty) {
            attachmentEmpty.hidden = false;
        }
    }

    const form = page.querySelector('[data-review-form]');
    const hint = page.querySelector('[data-review-hint]');
    const summary = page.querySelector('[data-review-summary]');
    const actions = page.querySelector('[data-review-actions]');
    const resubmitLink = page.querySelector('[data-review-resubmit-link]');
    const editBtn = page.querySelector('[data-review-edit-btn]');
    const cancelEditBtn = page.querySelector('[data-review-cancel-edit]');
    const cancelLink = page.querySelector('[data-review-cancel]');
    const canReview = typeof app().roleCan === 'function' && app().roleCan('opportunity.review');
    const isReviewing = record.status === 'reviewing';
    const hasReview = Boolean(record.review);
    const allowAdminEdit = canReview && !['draft', 'completed'].includes(record.status);
    const isEditing = allowAdminEdit && page.dataset.reviewEditing === '1' && !isReviewing;
    // 審核中：空白表單；已審核：結果卡；按「修改審核」後才展開表單
    const showForm = allowAdminEdit && (isReviewing || isEditing);
    const showSummary = !showForm;
    const dash = (value) => {
        const text = value == null ? '' : String(value).trim();
        return text === '' ? '-' : text;
    };

    if (form) {
        form.hidden = false;
    }

    if (summary) {
        summary.hidden = !showSummary;
    }

    if (showSummary) {
        if (isReviewing) {
            setText('[data-review-summary-title]', record.statusLabel || getStatusLabel(record.status) || '審核中');
            setText('[data-review-done-result]', '-');
            setText('[data-review-done-status]', dash(record.statusLabel || getStatusLabel(record.status)));
            setText('[data-review-done-sales]', '-');
            setText('[data-review-done-note]', '-');
        } else {
            setText('[data-review-summary-title]', hasReview ? '已完成審核' : (record.statusLabel || getStatusLabel(record.status) || '-'));
            setText('[data-review-done-result]', dash(record.review?.resultLabel));
            setText('[data-review-done-status]', dash(record.statusLabel || getStatusLabel(record.status)));
            setText('[data-review-done-sales]', dash(record.review?.salesLabel));
            setText('[data-review-done-note]', dash(record.review?.note));
        }
    }

    if (hint) {
        hint.hidden = !showForm;
        if (showForm) {
            if (isPendingRenewal(record)) {
                hint.textContent = '此為續期申請，僅總管理者可操作。審核通過後保護期才會延長 90 天。';
            } else if (isEditing) {
                hint.textContent = '修改後送出，會依新的審核結果更新案件狀態。';
            } else {
                hint.textContent = '僅總管理者可操作。選擇審核結果後會更新商機狀態；指派原廠業務後，該筆會出現在對應業務帳號。';
            }
        }
    }

    page.querySelectorAll('[data-review-result-field], [data-review-sales-field], [data-review-note-field]').forEach((el) => {
        el.hidden = !showForm;
    });

    if (showForm && form) {
        const resultSelect = form.querySelector('[name="review_result"]')?.closest('[data-form-select]');
        const salesSelect = form.querySelector('[name="assigned_sales"]')?.closest('[data-form-select]');
        const note = form.querySelector('[data-review-note]');

        if (isEditing && hasReview) {
            if (record.review?.result) {
                setFormSelectByValue(resultSelect, record.review.result);
            }
            if (record.review?.sales) {
                setFormSelectByValue(salesSelect, record.review.sales);
            }
            if (note) {
                note.value = record.review?.note || '';
            }
        } else {
            clearFormSelect(resultSelect, '請選擇審核結果');
            clearFormSelect(salesSelect, '請選擇派發業務');
            if (note) {
                note.value = '';
            }
        }
    }

    if (actions) {
        const submitBtn = actions.querySelector('[data-review-submit]') || actions.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.hidden = !showForm;
            submitBtn.textContent = isEditing ? '更新審核結果' : '送出審核結果';
        }
    }

    if (editBtn) {
        editBtn.hidden = !(allowAdminEdit && hasReview && !isReviewing && !isEditing);
    }

    if (cancelEditBtn) {
        cancelEditBtn.hidden = !isEditing;
    }

    if (cancelLink) {
        cancelLink.hidden = isEditing;
    }

    if (resubmitLink) {
        // 總管理者用「修改審核」；一般使用者才顯示「前往補件編輯」
        const canResubmit = record.status === 'rejected'
            && typeof app().roleCan === 'function'
            && app().roleCan('opportunity.create')
            && !canReview
            && !isEditing;
        resubmitLink.hidden = !canResubmit;
        if (isRejectedRenewal(record)) {
            resubmitLink.href = `${page.dataset.renewUrl || '/opportunities/renew/'}?id=${encodeURIComponent(record.id)}`;
            resubmitLink.textContent = '前往續期補件';
        } else {
            resubmitLink.href = `${page.dataset.createUrl || '/opportunities/create/'}?id=${encodeURIComponent(record.id)}`;
            resubmitLink.textContent = '前往補件編輯';
        }
    }

    if (typeof app().refreshIcons === 'function') {
        app().refreshIcons(page);
    }
}

window.syncOpportunityReviewUi = function syncOpportunityReviewUi() {
    const page = document.querySelector('[data-review-page]');
    if (page) {
        const id = getQueryParam('id');
        const record = getOpportunityById(id);
        if (record) {
            renderReviewPage(record);
        }
    }

    // 補件／暫存頁：角色切換時重算「修改審核」顯示
    const createForm = document.querySelector('[data-opportunity-form]');
    if (createForm) {
        const recordId = getQueryParam('id') || '';
        const record = recordId ? getOpportunityById(recordId) : null;
        if (record?.status === 'rejected' && record.review) {
            showCreateReviewResult(record.review, record.status, recordId);
        } else {
            const editReviewLink = document.querySelector('[data-create-edit-review]');
            if (editReviewLink) {
                editReviewLink.hidden = true;
            }
        }
    }
};

function initReviewPage() {
    const page = document.querySelector('[data-review-page]');
    if (!page) {
        return;
    }

    const id = getQueryParam('id');
    const record = getOpportunityById(id);
    if (!record) {
        showAppToast('找不到此商機資料', 'error');
        window.setTimeout(() => {
            window.location.href = page.dataset.listUrl || '/opportunities/';
        }, 700);
        return;
    }

    // 從補件頁「修改審核」帶入時，直接展開編輯表單
    if (
        getQueryParam('edit') === '1'
        && record.review
        && record.status !== 'reviewing'
        && !['draft', 'completed'].includes(record.status)
        && typeof app().roleCan === 'function'
        && app().roleCan('opportunity.review')
    ) {
        page.dataset.reviewEditing = '1';
    }

    renderReviewPage(record);

    const form = page.querySelector('[data-review-form]');
    if (!form) {
        return;
    }

    page.querySelector('[data-review-edit-btn]')?.addEventListener('click', () => {
        page.dataset.reviewEditing = '1';
        renderReviewPage(getOpportunityById(id) || record);
    });

    page.querySelector('[data-review-cancel-edit]')?.addEventListener('click', () => {
        delete page.dataset.reviewEditing;
        renderReviewPage(getOpportunityById(id) || record);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const current = getOpportunityById(id) || record;

        if (typeof app().roleCan === 'function' && !app().roleCan('opportunity.review')) {
            showAppToast('目前角色無法送出審核', 'error');
            return;
        }

        if (['draft', 'completed'].includes(current.status)) {
            showAppToast('此商機狀態目前無法變更審核結果', 'error');
            return;
        }

        // 已審核案件需先按「修改審核」才可送出
        if (current.status !== 'reviewing' && page.dataset.reviewEditing !== '1') {
            showAppToast('請先點選修改審核', 'error');
            return;
        }

        form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

        const resultSelect = form.querySelector('[name="review_result"]')?.closest('[data-form-select]');
        const salesSelect = form.querySelector('[name="assigned_sales"]')?.closest('[data-form-select]');
        const note = form.querySelector('[name="review_note"]');

        const resultValue = resultSelect?.querySelector('[data-form-select-value]')?.value || '';
        const salesValue = salesSelect?.querySelector('[data-form-select-value]')?.value || '';

        let valid = true;
        if (!resultValue) {
            resultSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
            valid = false;
        }
        if (!salesValue) {
            salesSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
            valid = false;
        }

        if (!valid) {
            showAppToast('請完成必填的審核欄位', 'error');
            focusFirstOpportunityError(form);
            return;
        }

        const resultOption = (resultSelect?._formMenu || resultSelect?.querySelector('[data-form-select-menu]'))
            ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(resultValue)}"]`);
        const salesOption = (salesSelect?._formMenu || salesSelect?.querySelector('[data-form-select-menu]'))
            ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(salesValue)}"]`);

        const nextStatus = resultOption?.dataset.status || 'approved';
        const nextStatusLabel = resultOption?.dataset.statusLabel || getStatusLabel(nextStatus);
        const resultLabel = resultOption?.dataset.label || resultValue;
        const salesLabel = salesOption?.dataset.label || salesValue;

        const pendingRenewal = isPendingRenewal(current) ? current.renewal : null;
        let nextProtection = current.protection;
        let nextRenewal = current.renewal || null;

        if (pendingRenewal) {
            if (nextStatus === 'approved') {
                nextProtection = pendingRenewal.newProtection
                    || addDaysIso(RENEWAL_DAYS, parseIsoDate(pendingRenewal.oldProtection || current.protection));
                nextRenewal = { ...pendingRenewal, status: 'approved' };
            } else {
                nextProtection = pendingRenewal.oldProtection || current.protection;
                nextRenewal = { ...pendingRenewal, status: nextStatus === 'rejected' ? 'rejected' : 'closed' };
            }
        } else if (nextStatus === 'approved') {
            nextProtection = current.protection !== '-' ? current.protection : addDaysIso(RENEWAL_DAYS);
        }

        const wasReviewed = Boolean(current.review) && current.status !== 'reviewing';
        const updated = upsertOpportunity({
            ...current,
            status: nextStatus,
            statusLabel: nextStatusLabel,
            protection: protectionForStatus(nextStatus, nextProtection),
            renewal: nextRenewal,
            review: {
                result: resultValue,
                resultLabel,
                sales: salesValue,
                salesLabel,
                note: String(note?.value || '').trim(),
                reviewedAt: formatDateTime(),
            },
        });

        delete page.dataset.reviewEditing;
        showAppToast(wasReviewed ? `已更新審核：${resultLabel}` : `已送出審核：${resultLabel}`, 'success');
        window.setTimeout(() => {
            window.location.href = page.dataset.listUrl || '/opportunities/';
        }, 550);

        return updated;
    });
}

/* ---------- 新增／補件表單 ---------- */

function showCreateReviewResult(review, status, recordId = '') {
    const panel = document.querySelector('[data-create-review-result]');
    const divider = document.querySelector('[data-create-review-divider]');
    const editPanel = document.querySelector('[data-create-review-edit]');
    const editReviewBtn = document.querySelector('[data-create-edit-review]');
    const updateReviewBtn = document.querySelector('[data-create-update-review]');
    const cancelEditBtn = document.querySelector('[data-create-cancel-edit-review]');
    const submitBtn = document.querySelector('[data-create-submit-label]');
    const saveDraftBtn = document.querySelector('[data-save-draft]');
    const cancelLink = document.querySelector('[data-create-cancel]');
    const asideHint = document.querySelector('[data-create-aside-hint]');
    const form = document.querySelector('[data-opportunity-form]');
    const isEditing = form?.dataset.createReviewEditing === '1';

    if (!panel) {
        return;
    }

    if (!review) {
        panel.hidden = true;
        if (divider) {
            divider.hidden = true;
        }
        if (editPanel) {
            editPanel.hidden = true;
        }
        if (editReviewBtn) {
            editReviewBtn.hidden = true;
        }
        if (updateReviewBtn) {
            updateReviewBtn.hidden = true;
        }
        if (cancelEditBtn) {
            cancelEditBtn.hidden = true;
        }
        return;
    }

    if (divider) {
        divider.hidden = false;
    }

    const setText = (selector, value) => {
        const el = panel.querySelector(selector);
        if (el) {
            el.textContent = value || '-';
        }
    };

    setText('[data-create-review-result-label]', review.resultLabel);
    setText('[data-create-review-status-label]', getStatusLabel(status));
    setText('[data-create-review-sales-label]', review.salesLabel);
    setText('[data-create-review-note]', review.note || '-');

    const hint = panel.querySelector('[data-create-review-resubmit-hint]');
    const canReview = typeof app().roleCan === 'function' && app().roleCan('opportunity.review');
    const id = recordId || getQueryParam('id') || '';
    const showEditReview = Boolean(canReview && id && review && status === 'rejected');

    if (isEditing && showEditReview) {
        panel.hidden = true;
        if (hint) {
            hint.hidden = true;
        }
        if (editPanel) {
            editPanel.hidden = false;
        }
        if (asideHint) {
            asideHint.hidden = true;
        }
        if (submitBtn) {
            submitBtn.hidden = true;
        }
        if (saveDraftBtn) {
            saveDraftBtn.hidden = true;
        }
        if (editReviewBtn) {
            editReviewBtn.hidden = true;
        }
        if (updateReviewBtn) {
            updateReviewBtn.hidden = false;
        }
        if (cancelEditBtn) {
            cancelEditBtn.hidden = false;
        }
        if (cancelLink) {
            cancelLink.hidden = true;
        }

        const resultSelect = document.querySelector('[data-create-review-result-select]');
        const salesSelect = document.querySelector('[data-create-review-sales-select]');
        const noteInput = document.querySelector('[data-create-review-note-input]');
        if (typeof app().bindFormSelects === 'function') {
            app().bindFormSelects(editPanel);
        }
        if (review.result) {
            setFormSelectByValue(resultSelect, review.result);
        }
        if (review.sales) {
            setFormSelectByValue(salesSelect, review.sales);
        }
        if (noteInput) {
            noteInput.value = review.note || '';
        }
        if (typeof app().refreshIcons === 'function') {
            app().refreshIcons(editPanel);
        }
        return;
    }

    panel.hidden = false;
    if (hint) {
        hint.hidden = status !== 'rejected';
    }
    if (editPanel) {
        editPanel.hidden = true;
    }
    if (asideHint) {
        asideHint.hidden = false;
    }
    if (submitBtn) {
        submitBtn.hidden = false;
    }
    if (saveDraftBtn) {
        saveDraftBtn.hidden = status === 'rejected';
    }
    if (updateReviewBtn) {
        updateReviewBtn.hidden = true;
    }
    if (cancelEditBtn) {
        cancelEditBtn.hidden = true;
    }
    if (cancelLink) {
        cancelLink.hidden = false;
    }
    if (editReviewBtn) {
        editReviewBtn.hidden = !showEditReview;
    }
}

function applyCreateReviewUpdate(recordId) {
    const form = document.querySelector('[data-opportunity-form]');
    const editPanel = document.querySelector('[data-create-review-edit]');
    const current = getOpportunityById(recordId);
    if (!form || !editPanel || !current) {
        return;
    }

    if (typeof app().roleCan === 'function' && !app().roleCan('opportunity.review')) {
        showAppToast('目前角色無法修改審核', 'error');
        return;
    }

    editPanel.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

    const resultSelect = editPanel.querySelector('[data-create-review-result-select]');
    const salesSelect = editPanel.querySelector('[data-create-review-sales-select]');
    const note = editPanel.querySelector('[data-create-review-note-input]');
    const resultValue = resultSelect?.querySelector('[data-form-select-value]')?.value || '';
    const salesValue = salesSelect?.querySelector('[data-form-select-value]')?.value || '';

    let valid = true;
    if (!resultValue) {
        resultSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
        valid = false;
    }
    if (!salesValue) {
        salesSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
        valid = false;
    }
    if (!valid) {
        showAppToast('請完成必填的審核欄位', 'error');
        return;
    }

    const resultOption = (resultSelect?._formMenu || resultSelect?.querySelector('[data-form-select-menu]'))
        ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(resultValue)}"]`);
    const salesOption = (salesSelect?._formMenu || salesSelect?.querySelector('[data-form-select-menu]'))
        ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(salesValue)}"]`);

    const nextStatus = resultOption?.dataset.status || 'approved';
    const nextStatusLabel = resultOption?.dataset.statusLabel || getStatusLabel(nextStatus);
    const resultLabel = resultOption?.dataset.label || resultValue;
    const salesLabel = salesOption?.dataset.label || salesValue;

    let nextProtection = current.protection;
    if (nextStatus === 'approved') {
        nextProtection = current.protection !== '-' ? current.protection : addDaysIso(RENEWAL_DAYS);
    }

    upsertOpportunity({
        ...current,
        status: nextStatus,
        statusLabel: nextStatusLabel,
        protection: protectionForStatus(nextStatus, nextProtection),
        review: {
            result: resultValue,
            resultLabel,
            sales: salesValue,
            salesLabel,
            note: String(note?.value || '').trim(),
            reviewedAt: formatDateTime(),
        },
    });

    delete form.dataset.createReviewEditing;
    showAppToast(`已更新審核：${resultLabel}`, 'success');
    window.setTimeout(() => {
        window.location.href = form.dataset.listUrl || '/opportunities/';
    }, 550);
}

function initOpportunityForm() {
    const opportunityForm = document.querySelector('[data-opportunity-form]');
    if (!opportunityForm) {
        return;
    }

    bindFileUpload(opportunityForm);

    let activeDraftId = getQueryParam('draft') || '';
    let activeRecordId = getQueryParam('id') || '';
    const breadcrumbTitleEl = document.querySelector('nav [data-page-title]');
    const headingEl = document.querySelector('[data-page-heading]');
    const asideTitle = document.querySelector('[data-create-aside-title]');
    const asideHint = document.querySelector('[data-create-aside-hint]');
    const saveDraftBtn = opportunityForm.querySelector('[data-save-draft]');
    const submitLabel = opportunityForm.querySelector('[data-create-submit-label]');

    function syncTitles(mode, id) {
        if (mode === 'draft') {
            if (breadcrumbTitleEl) {
                breadcrumbTitleEl.textContent = '編輯暫存商機';
            }
            if (headingEl) {
                headingEl.textContent = `${id} · 編輯暫存商機`;
            }
            if (asideTitle) {
                asideTitle.textContent = '送出與暫存';
            }
            if (asideHint) {
                asideHint.textContent = '確認送出後即進入「審核中」，便無法再修改。送出前請確認資料完整，或可先儲存暫存檔。';
            }
            const editReviewBtn = document.querySelector('[data-create-edit-review]');
            if (editReviewBtn) {
                editReviewBtn.hidden = true;
            }
            const editPanel = document.querySelector('[data-create-review-edit]');
            if (editPanel) {
                editPanel.hidden = true;
            }
            document.querySelector('[data-create-update-review]')?.setAttribute('hidden', '');
            document.querySelector('[data-create-cancel-edit-review]')?.setAttribute('hidden', '');
            return;
        }

        if (mode === 'resubmit') {
            if (breadcrumbTitleEl) {
                breadcrumbTitleEl.textContent = '補件編輯';
            }
            if (headingEl) {
                headingEl.textContent = `${id} · 補件編輯`;
            }
            if (asideTitle) {
                asideTitle.textContent = '退回補件';
            }
            if (asideHint) {
                asideHint.textContent = '請依審核備註修正資料後再次確認送出，送出後會回到「審核中」。';
            }
            if (submitLabel) {
                submitLabel.textContent = '再次送出';
            }
            if (saveDraftBtn) {
                saveDraftBtn.hidden = true;
            }
        }
    }

    if (activeDraftId) {
        const existing = getOpportunityDraft(activeDraftId);
        if (existing) {
            applyOpportunityFormData(opportunityForm, existing);
        }
        syncTitles('draft', activeDraftId);
    } else if (activeRecordId) {
        const record = getOpportunityById(activeRecordId);
        if (!record) {
            showAppToast('找不到此商機，無法補件', 'error');
            window.setTimeout(() => {
                window.location.href = opportunityForm.dataset.listUrl || '/opportunities/';
            }, 700);
            return;
        }

        if (isRejectedRenewal(record)) {
            window.location.href = `${opportunityForm.dataset.renewUrl || '/opportunities/renew/'}?id=${encodeURIComponent(activeRecordId)}`;
            return;
        }

        if (record.status !== 'rejected') {
            showAppToast('僅退回補件的商機可由此編輯', 'error');
            const reviewUrl = opportunityForm.dataset.reviewUrl || '/opportunities/review/';
            window.setTimeout(() => {
                window.location.href = `${reviewUrl}?id=${encodeURIComponent(activeRecordId)}`;
            }, 600);
            return;
        }

        applyOpportunityFormData(opportunityForm, catalogFormFallback(record));
        showCreateReviewResult(record.review, record.status, activeRecordId);
        syncTitles('resubmit', activeRecordId);

        const editReviewBtn = document.querySelector('[data-create-edit-review]');
        const updateReviewBtn = document.querySelector('[data-create-update-review]');
        const cancelEditReviewBtn = document.querySelector('[data-create-cancel-edit-review]');

        editReviewBtn?.addEventListener('click', () => {
            opportunityForm.dataset.createReviewEditing = '1';
            const latest = getOpportunityById(activeRecordId);
            showCreateReviewResult(latest?.review, latest?.status || 'rejected', activeRecordId);
        });

        cancelEditReviewBtn?.addEventListener('click', () => {
            delete opportunityForm.dataset.createReviewEditing;
            const latest = getOpportunityById(activeRecordId);
            showCreateReviewResult(latest?.review, latest?.status || 'rejected', activeRecordId);
        });

        updateReviewBtn?.addEventListener('click', () => {
            applyCreateReviewUpdate(activeRecordId);
        });
    } else {
        const editReviewBtn = document.querySelector('[data-create-edit-review]');
        if (editReviewBtn) {
            editReviewBtn.hidden = true;
        }
        const editPanel = document.querySelector('[data-create-review-edit]');
        if (editPanel) {
            editPanel.hidden = true;
        }
        document.querySelector('[data-create-update-review]')?.setAttribute('hidden', '');
        document.querySelector('[data-create-cancel-edit-review]')?.setAttribute('hidden', '');
    }

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => {
            const data = collectOpportunityFormData(opportunityForm);
            if (!activeDraftId) {
                activeDraftId = createOpportunityDraftId();
            }

            upsertOpportunityDraft({
                id: activeDraftId,
                status: 'draft',
                updatedAt: new Date().toISOString(),
                data,
            });

            const url = new URL(window.location.href);
            url.searchParams.delete('id');
            url.searchParams.set('draft', activeDraftId);
            window.history.replaceState({}, '', url);
            activeRecordId = '';

            syncTitles('draft', activeDraftId);
            showAppToast('已儲存暫存檔，可稍後再繼續編輯', 'success');
        });
    }

    opportunityForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (opportunityForm.dataset.createReviewEditing === '1') {
            return;
        }

        if (!validateOpportunityForm(opportunityForm)) {
            focusFirstOpportunityError(opportunityForm);
            showAppToast('請先完成必填欄位', 'error');
            return;
        }

        const data = collectOpportunityFormData(opportunityForm);
        const existing = activeRecordId ? getOpportunityById(activeRecordId) : null;
        const record = formDataToRecord(data, {
            id: activeRecordId || undefined,
            status: 'reviewing',
            amount: existing?.amount || '-',
            amountValue: existing?.amountValue || 0,
            dealer: existing?.dealer || 'tw',
            protection: existing?.protection || '-',
            booking_code: existing?.booking_code || activeRecordId || undefined,
            review: existing?.review || null,
        });

        upsertOpportunity(record);

        if (activeDraftId) {
            removeOpportunityDraft(activeDraftId);
        }

        showAppToast(activeRecordId ? '已再次送出，商機回到審核中' : '已送出，商機進入審核中', 'success');
        window.setTimeout(() => {
            window.location.href = opportunityForm.dataset.listUrl
                || opportunityForm.dataset.cancelUrl
                || '/opportunities/';
        }, 500);
    });
}

/* ---------- 續期申請 ---------- */

function initRenewPage() {
    const page = document.querySelector('[data-renew-page]');
    if (!page) {
        return;
    }

    const listUrl = page.dataset.listUrl || '/opportunities/';
    const id = getQueryParam('id');
    const record = getOpportunityById(id);

    if (!canApplyRenewal(record)) {
        showAppToast('此商機目前無法申請續期', 'error');
        window.setTimeout(() => {
            window.location.href = listUrl;
        }, 700);
        return;
    }

    const form = page.querySelector('[data-renew-form]');
    const newProtectionInput = page.querySelector('[data-renew-new-protection]');
    const reasonInput = page.querySelector('[data-renew-reason]');
    const nextBtn = page.querySelector('[data-renew-next]');
    const backBtn = page.querySelector('[data-renew-back]');
    const submitBtn = page.querySelector('[data-renew-submit]');
    const cancelLink = page.querySelector('[data-renew-cancel]');
    const oldProtection = record.renewal?.oldProtection
        || (record.protection && record.protection !== '-' ? record.protection : addDaysIso(0));

    const setText = (selector, value) => {
        const el = page.querySelector(selector);
        if (el) {
            el.textContent = value ?? '—';
        }
    };

    setText('[data-renew-id]', record.id);
    setText('[data-renew-title]', record.title || record.customer_company || record.id);
    setText('[data-renew-old-protection]', oldProtection);

    const pill = page.querySelector('[data-renew-status-pill]');
    if (pill) {
        pill.className = `status-pill status-${record.status}`;
        pill.textContent = record.statusLabel || getStatusLabel(record.status);
    }

    const oldProtectionEl = page.querySelector('[data-renew-old-protection]');
    if (oldProtectionEl) {
        oldProtectionEl.classList.toggle('text-brand2', record.status === 'expiring');
        oldProtectionEl.classList.toggle('text-gray5', record.status !== 'expiring');
    }

    if (reasonInput && record.renewal?.reason && isRejectedRenewal(record)) {
        reasonInput.value = record.renewal.reason;
    }

    bindFileUpload(form);

    function selectedDays() {
        return RENEWAL_DAYS;
    }

    function selectedDaysLabel() {
        return `${RENEWAL_DAYS} 天`;
    }

    function updateNewProtection() {
        const next = addDaysIso(selectedDays(), parseIsoDate(oldProtection));
        if (newProtectionInput) {
            newProtectionInput.value = next;
        }
        return next;
    }

    updateNewProtection();

    function setStep(step) {
        page.querySelectorAll('[data-renew-step]').forEach((el) => {
            const index = Number(el.dataset.renewStep);
            el.classList.toggle('is-active', index === step);
            el.classList.toggle('is-done', index < step);
        });
        page.querySelectorAll('[data-renew-step-panel]').forEach((panel) => {
            panel.hidden = Number(panel.dataset.renewStepPanel) !== step;
        });
        if (nextBtn) {
            nextBtn.hidden = step !== 1;
        }
        if (backBtn) {
            backBtn.hidden = step !== 2;
        }
        if (submitBtn) {
            submitBtn.hidden = step !== 2;
        }
        if (cancelLink) {
            cancelLink.hidden = step !== 1;
        }
    }

    function validateStepOne() {
        form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));
        const reason = String(reasonInput?.value || '').trim();

        if (!reason) {
            reasonInput?.classList.add('form-error');
            showAppToast('請先完成必填欄位', 'error');
            focusFirstOpportunityError(form);
            return false;
        }

        return true;
    }

    function fillConfirm() {
        const attachment = readAttachmentFromUpload(form);
        setText('[data-renew-confirm-days]', selectedDaysLabel());
        setText('[data-renew-confirm-protection]', updateNewProtection());
        setText('[data-renew-confirm-reason]', String(reasonInput?.value || '').trim() || '—');
        setText('[data-renew-confirm-file]', attachment?.name || '未上傳');
    }

    nextBtn?.addEventListener('click', () => {
        if (!validateStepOne()) {
            return;
        }
        fillConfirm();
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    backBtn?.addEventListener('click', () => {
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!validateStepOne()) {
            setStep(1);
            return;
        }

        const nextProtection = updateNewProtection();
        upsertOpportunity({
            ...record,
            protection: oldProtection,
            status: 'reviewing',
            statusLabel: getStatusLabel('reviewing'),
            review: null,
            renewal: {
                days: selectedDays(),
                oldProtection,
                newProtection: nextProtection,
                previousStatus: record.renewal?.previousStatus || record.status,
                reason: String(reasonInput?.value || '').trim(),
                attachment: readAttachmentFromUpload(form),
                submittedAt: formatDateTime(),
                status: 'pending',
            },
        });

        showAppToast('已送出續期申請，進入審核中', 'success');
        window.setTimeout(() => {
            window.location.href = listUrl;
        }, 550);
    });
}

document.querySelectorAll('[data-opp-row]').forEach((row) => {
    if (!row.dataset.oppId) {
        const idCell = row.children[0];
        if (idCell) {
            row.dataset.oppId = idCell.textContent.trim();
        }
    }
});

syncOpportunityListUi();
initReviewPage();
initOpportunityForm();
initRenewPage();
