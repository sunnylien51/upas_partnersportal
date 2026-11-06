/* ---------- 商機中心：暫存／送出／審核／列表動作 ---------- */

import { downloadXlsx } from './xlsx-download.js';

const app = () => window.upasApp || {};

const OPPORTUNITY_DRAFTS_KEY = 'upas-opportunity-drafts';
const OPPORTUNITY_STORE_KEY = 'upas-opportunity-store';

const DEFAULT_STATUS_LABELS = {
    draft: '暫存',
    approved: '已核准',
    reviewing: '審核中',
    renewing: '續期審核中',
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
    renewing: 'refresh-cw',
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
const SUBMIT_REVIEW_NOTICE = '原廠將於3天內於系統內通知審核結果，請登入系統查看。';

function showSubmitReviewNotice(title = '已送出，商機進入審核中') {
    try {
        const result = showAppConfirm({
            title,
            message: SUBMIT_REVIEW_NOTICE,
            confirmLabel: '確定',
            hideCancel: true,
        });
        if (result && typeof result.then === 'function') {
            return result.catch(() => {
                window.alert(SUBMIT_REVIEW_NOTICE);
            });
        }
    } catch (error) {
        window.alert(SUBMIT_REVIEW_NOTICE);
        return Promise.resolve();
    }

    window.alert(SUBMIT_REVIEW_NOTICE);
    return Promise.resolve();
}

function showAppToast(message, tone = 'default') {
    if (typeof app().showAppToast === 'function') {
        app().showAppToast(message, tone);
        return;
    }

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

function showAppConfirm(options = {}) {
    if (typeof app().showAppConfirm === 'function') {
        return app().showAppConfirm(options);
    }

    return Promise.resolve(window.confirm(options.message || options.title || '確認操作？'));
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

function opportunityCreatedAt(record, fallbackRecord = null) {
    const raw = String(
        record?.createdAt
        || record?.submittedAt
        || record?.created_at
        || fallbackRecord?.createdAt
        || fallbackRecord?.submittedAt
        || fallbackRecord?.created_at
        || ''
    ).trim();
    if (!raw || raw === '—') {
        return '';
    }
    const slashDate = raw.match(/^(\d{4}\/\d{2}\/\d{2})(?:[ T](\d{2}:\d{2}))?/);
    if (slashDate) {
        return slashDate[2] ? `${slashDate[1]} ${slashDate[2]}` : slashDate[1];
    }
    const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/);
    if (isoDate) {
        const dateText = `${isoDate[1]}/${isoDate[2]}/${isoDate[3]}`;
        return isoDate[4] ? `${dateText} ${isoDate[4]}` : dateText;
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
        return raw;
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setRowCreatedUi(row, record, fallbackRecord = null) {
    const createdEl = row.querySelector('[data-opp-created]');
    if (!createdEl) {
        return;
    }
    const text = opportunityCreatedAt(record, fallbackRecord);
    if (text) {
        createdEl.textContent = text;
    }
}

function formatAmount(value) {
    const amount = Number(value || 0);
    if (!amount) {
        return '-';
    }

    return `$${amount.toLocaleString('en-US')}`;
}

function formatDateTime(date = new Date()) {
    const stamp = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(stamp.getTime())) {
        return '';
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${stamp.getFullYear()}/${pad(stamp.getMonth() + 1)}/${pad(stamp.getDate())} ${pad(stamp.getHours())}:${pad(stamp.getMinutes())}`;
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

/** 商機編號共用：開頭字母 + YYMMDD */
function opportunityIdDatePrefix(letter, date = new Date()) {
    const y = String(date.getFullYear()).slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${letter}${y}${m}${d}`;
}

function collectKnownOpportunityIds() {
    const ids = new Set();
    Object.keys(getSeedCatalog() || {}).forEach((id) => ids.add(id));
    Object.keys(readOpportunityStore() || {}).forEach((id) => ids.add(id));
    Object.keys(readOpportunityDrafts() || {}).forEach((id) => ids.add(id));
    return ids;
}

/** 暫存編號：D + YYMMDD + 當日流水號(3位) */
function createOpportunityDraftId(date = new Date()) {
    const prefix = opportunityIdDatePrefix('D', date);
    const next = maxSequenceForPrefix(prefix, collectKnownOpportunityIds()) + 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
}

function maxSequenceForPrefix(prefix, knownIds) {
    let max = 0;
    const pattern = new RegExp(`^${prefix}(\\d{3})$`);
    knownIds.forEach((id) => {
        const match = String(id).match(pattern);
        if (match) {
            max = Math.max(max, Number(match[1]));
        }
    });
    return max;
}

/** 商機編號：N + YYMMDD + 當日流水號(3位)，送出報備時產生 */
function createOpportunityId(date = new Date()) {
    const prefix = opportunityIdDatePrefix('N', date);
    const next = maxSequenceForPrefix(prefix, collectKnownOpportunityIds()) + 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
}

function opportunityIdSortValue(id) {
    const text = String(id || '');
    const official = text.match(/^N(\d+)/i);
    if (official) {
        return Number(official[1]);
    }
    const draft = text.match(/^(?:DRAFT-|D)(\d+)/i);
    if (draft) {
        return Number(draft[1]);
    }
    return 0;
}

function sortOpportunityListRows(list) {
    if (!list) {
        return;
    }

    const empty = list.querySelector('[data-filter-empty]');
    const rows = [...list.querySelectorAll('[data-opp-row]')];
    rows.sort((a, b) => {
        const byId = opportunityIdSortValue(b.dataset.oppId) - opportunityIdSortValue(a.dataset.oppId);
        if (byId !== 0) {
            return byId;
        }
        return String(b.dataset.oppId || '').localeCompare(String(a.dataset.oppId || ''), 'en');
    });
    rows.forEach((row) => {
        if (empty) {
            list.insertBefore(row, empty);
        } else {
            list.appendChild(row);
        }
    });
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
    const label = getDealerLabel(key);
    const dealerEl = row.querySelector('[data-opp-dealer]');
    if (dealerEl) {
        dealerEl.textContent = label;
    }
}

function createdFilterDate(record, fallbackRecord = null) {
    const text = opportunityCreatedAt(record, fallbackRecord);
    const match = text.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function setRowQueryMeta(row, record, fallbackRecord = null) {
    const createdBy = String(record?.created_by || row.dataset.createdBy || '').trim();
    const partner = createdBy && createdBy !== 'admin' ? getPartnersById().get(createdBy) : null;
    row.dataset.country = String(partner?.country || '').trim();
    row.dataset.oppDate = createdFilterDate(record, fallbackRecord);
}

function opportunitySearchText(id, customer, dealer, salesName = '', reporter = '') {
    return `${id} ${customer || ''} ${getDealerLabel(dealer)} ${reporter || ''} ${salesName || ''}`.trim();
}

function opportunityReporterName(record) {
    const createdBy = String(record?.created_by || '').trim();
    if (!createdBy) {
        return '';
    }
    if (createdBy === 'admin') {
        return '總管理者';
    }

    const partner = getPartnersById().get(createdBy);
    if (!partner) {
        return createdBy;
    }

    return String(partner.name || '').trim() || createdBy;
}

// 搜尋仍含公司名；列表顯示用 opportunityReporterLine
function opportunityReporterLabel(record) {
    const createdBy = String(record?.created_by || '').trim();
    const name = opportunityReporterName(record);
    if (!createdBy || createdBy === 'admin') {
        return name;
    }

    const company = String(getPartnersById().get(createdBy)?.company || '').trim();
    const identity = opportunityReporterIdentity(record);
    const base = company && name ? `${company}／${name}` : (name || company);
    return [base, identity].filter(Boolean).join(' ');
}

function opportunityReporterIdentity(record) {
    const createdBy = String(record?.created_by || '').trim();
    if (!createdBy || createdBy === 'admin') {
        return '';
    }

    const partner = getPartnersById().get(createdBy);
    if (!partner) {
        return '';
    }

    const meta = getListMeta();
    const identity = String(partner.identity || '').trim();
    const identityLabel = String(meta.identityLabels?.[identity] || '').trim();
    if (!identityLabel) {
        return '';
    }

    const level = String(partner.level || '').trim();
    const isDealer = identity === 'dealer_tw' || identity === 'dealer_overseas';
    const levelLabel = partner.status === 'approved' && isDealer && level
        ? String(meta.levelLabels?.[level] || level).trim()
        : '';
    return levelLabel ? `${identityLabel}/${levelLabel}` : identityLabel;
}

function opportunityReporterLine(record) {
    const name = opportunityReporterName(record);
    const identity = opportunityReporterIdentity(record);
    if (name && identity) {
        return `${name} / ${identity}`;
    }
    return name || identity || '';
}

function setRowReporterUi(row, record) {
    const reporterEl = row.querySelector('[data-opp-reporter]');
    if (!reporterEl) {
        return;
    }

    const source = {
        ...(record || {}),
        created_by: String(record?.created_by || row.dataset.createdBy || '').trim(),
    };
    const name = opportunityReporterName(source);
    const identity = opportunityReporterIdentity(source);
    const line = name && identity ? `${name} / ${identity}` : (name || identity || '—');
    const nameEl = reporterEl.querySelector('[data-opp-reporter-name]');
    const identityEl = reporterEl.querySelector('[data-opp-reporter-identity]');

    if (!nameEl) {
        reporterEl.textContent = line;
        reporterEl.title = line === '—' ? '' : line;
        return;
    }

    nameEl.textContent = name || '—';
    if (identityEl) {
        identityEl.textContent = identity;
        identityEl.hidden = !identity;
    }
    reporterEl.title = name || identity ? line : '';
}

const UNASSIGNED_SALES_LABEL = '待指派';

// 承接業務以商機的 oem_sales_id 為準；未指派的送審商機顯示「待指派」
function opportunitySalesName(record) {
    if (!record) {
        return '';
    }

    const salesId = String(record.oem_sales_id || '').trim();
    if (salesId) {
        const name = String(getPartnersById().get(salesId)?.name || '').trim();
        return name || String(record.review?.salesLabel || '').trim() || salesId;
    }

    return record.status === 'draft' ? '' : UNASSIGNED_SALES_LABEL;
}

function ensureSalesFilterOption(name) {
    const select = document.querySelector('[data-opp-sales-filter]');
    if (!select || !name) {
        return;
    }

    const menu = select._formMenu || select.querySelector('[data-form-select-menu]');
    if (!menu || menu.querySelector(`[data-form-select-option][data-value="${CSS.escape(name)}"]`)) {
        return;
    }

    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'form-select-option';
    option.setAttribute('role', 'option');
    option.setAttribute('data-form-select-option', '');
    option.dataset.value = name;
    option.dataset.label = name;
    option.textContent = name;
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
    menu.appendChild(option);
}

function setRowSalesUi(row, record) {
    const name = opportunitySalesName(record);
    row.dataset.salesName = name;
    ensureSalesFilterOption(name);

    const salesEl = row.querySelector('[data-opp-sales]');
    if (!salesEl) {
        return;
    }

    salesEl.textContent = name || '—';
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
    return record?.renewal?.status === 'pending' || record?.status === 'renewing';
}

function isRejectedRenewal(record) {
    return Boolean(record?.renewal) && record?.status === 'rejected';
}

function isRenewalReview(record) {
    return Boolean(record?.renewal) && (record?.status === 'renewing' || record?.status === 'rejected');
}

function isReviewQueueStatus(status) {
    return status === 'reviewing' || status === 'renewing';
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

/* ---------- 商機可見範圍（清單／明細／搜尋／統計／匯出同一套） ---------- */

const PARTNERS_STORAGE_KEY = 'upas-partners';
const PARTNERS_DELETED_KEY = 'upas-partners-deleted';

function getPreviewActor() {
    if (typeof app().getPreviewActor === 'function') {
        return app().getPreviewActor();
    }
    return {
        roleKey: 'admin',
        label: '總管理者',
        identity: 'admin',
        partnerId: '',
    };
}

function previewActorKey(actor = getPreviewActor()) {
    const partnerId = String(actor?.partnerId || '').trim();
    if (partnerId) {
        return partnerId;
    }

    return (actor?.identity || actor?.roleKey) === 'admin' ? 'admin' : '';
}

function isDraftCreator(record, actor = getPreviewActor()) {
    const createdBy = String(record?.created_by || '').trim();
    const myId = previewActorKey(actor);
    if (createdBy) {
        return createdBy === myId;
    }

    // 舊暫存可能沒寫 created_by；僅總管自己存的才看得到
    return (actor?.identity || '') === 'admin';
}

function isDealerIdentity(identity) {
    return identity === 'dealer_tw' || identity === 'dealer_overseas';
}

function getPartnersById() {
    const seed = parseJsonScript('partners-seed-data', []);
    const byId = new Map();
    const deleted = new Set();

    try {
        const rawDeleted = localStorage.getItem(PARTNERS_DELETED_KEY);
        const parsedDeleted = rawDeleted ? JSON.parse(rawDeleted) : [];
        if (Array.isArray(parsedDeleted)) {
            parsedDeleted.forEach((id) => deleted.add(String(id)));
        }
    } catch (error) {
        /* ignore */
    }

    (Array.isArray(seed) ? seed : []).forEach((item) => {
        if (item?.id && !deleted.has(String(item.id))) {
            byId.set(String(item.id), item);
        }
    });

    try {
        const raw = localStorage.getItem(PARTNERS_STORAGE_KEY);
        const stored = raw ? JSON.parse(raw) : [];
        if (Array.isArray(stored)) {
            stored.forEach((item) => {
                if (!item?.id || deleted.has(String(item.id))) {
                    return;
                }
                byId.set(String(item.id), { ...(byId.get(String(item.id)) || {}), ...item });
            });
        }
    } catch (error) {
        /* ignore */
    }

    return byId;
}

function canViewOpportunity(record, actor = getPreviewActor(), partnersById = getPartnersById()) {
    if (!record) {
        return false;
    }

    // 暫存只留在新增者帳號；送出審核後才依身分權限可見
    if (record.status === 'draft') {
        return isDraftCreator(record, actor);
    }

    const identity = actor?.identity || 'admin';
    if (identity === 'admin') {
        return true;
    }

    const myId = previewActorKey(actor);
    if (!myId) {
        return false;
    }

    const createdBy = String(record.created_by || '').trim();
    const oemSalesId = String(record.oem_sales_id || '').trim();

    if (isDealerIdentity(identity)) {
        return createdBy === myId;
    }

    // 經銷與業務不綁定；內部人員只看自己新增的，或商機承接業務是自己的
    if (identity === 'oem_sales') {
        return oemSalesId === myId || createdBy === myId;
    }

    if (identity === 'oem_manager') {
        if (createdBy === myId || oemSalesId === myId) {
            return true;
        }

        const reports = [...partnersById.values()].filter((partner) => (
            partner.identity === 'oem_sales'
            && String(partner.manager_id || '') === myId
            && partner.status === 'approved'
        ));

        return reports.some((sales) => canViewOpportunity(
            record,
            { identity: 'oem_sales', partnerId: sales.id },
            partnersById
        ));
    }

    if (identity === 'oem_director') {
        if (createdBy === myId || oemSalesId === myId) {
            return true;
        }

        const reportManagers = [...partnersById.values()].filter((partner) => (
            partner.identity === 'oem_manager'
            && String(partner.manager_id || '') === myId
            && partner.status === 'approved'
        ));

        return reportManagers.some((manager) => canViewOpportunity(
            record,
            { identity: 'oem_manager', partnerId: manager.id },
            partnersById
        ));
    }

    return false;
}

function resolveListRecord(row) {
    const id = row.dataset.oppId || '';
    if (!id) {
        return null;
    }

    if (row.dataset.status === 'draft') {
        const draft = getOpportunityDraft(id);
        return {
            id,
            status: 'draft',
            statusLabel: '暫存',
            customer_company: draftListLabel(draft) || getRowCustomerName(row),
            dealer: row.dataset.dealer || draft?.dealer || 'tw',
            protection: '-',
            amountValue: 0,
            created_by: draft?.created_by || row.dataset.createdBy || '',
            oem_sales_id: draft?.oem_sales_id || row.dataset.oemSalesId || '',
            createdAt: draft?.createdAt || row.querySelector('[data-opp-created]')?.textContent?.trim() || '',
            submittedAt: draft?.createdAt || '',
        };
    }

    const record = getOpportunityById(id);
    if (record) {
        return record;
    }

    return {
        id,
        status: row.dataset.status || '',
        customer_company: getRowCustomerName(row),
        dealer: row.dataset.dealer || 'tw',
        protection: row.querySelector('[data-opp-protection]')?.textContent?.trim() || '-',
        amountValue: Number(row.dataset.amount || 0),
        created_by: row.dataset.createdBy || '',
        oem_sales_id: row.dataset.oemSalesId || '',
        submittedAt: row.querySelector('[data-opp-created]')?.textContent?.trim() || '',
    };
}

function collectVisibleOpportunityRecords({ respectFilters = true } = {}) {
    const rows = document.querySelectorAll('[data-opp-row]');
    const actor = getPreviewActor();
    const partnersById = getPartnersById();
    const records = [];

    rows.forEach((row) => {
        const record = resolveListRecord(row);
        if (!record || !canViewOpportunity(record, actor, partnersById)) {
            return;
        }
        if (respectFilters && row.hidden) {
            return;
        }
        records.push(record);
    });

    return records;
}

function syncOpportunityVisibility() {
    const rows = document.querySelectorAll('[data-opp-row]');
    if (!rows.length) {
        return;
    }

    const actor = getPreviewActor();
    const partnersById = getPartnersById();

    rows.forEach((row) => {
        const record = resolveListRecord(row);
        const allowed = canViewOpportunity(record, actor, partnersById);
        row.dataset.visibilityAllowed = allowed ? '1' : '0';
        if (record?.created_by) {
            row.dataset.createdBy = record.created_by;
        }
        if (record?.oem_sales_id) {
            row.dataset.oemSalesId = record.oem_sales_id;
        }
    });
}

function syncOpportunityStats() {
    const cards = document.querySelectorAll('[data-opp-stat]');
    if (!cards.length) {
        return;
    }

    const actor = getPreviewActor();
    const partnersById = getPartnersById();
    const counts = {
        active: 0,
        reviewing: 0,
        draft: 0,
        expiring: 0,
    };

    document.querySelectorAll('[data-opp-row]').forEach((row) => {
        const record = resolveListRecord(row);
        if (!canViewOpportunity(record, actor, partnersById)) {
            return;
        }
        const status = record?.status || row.dataset.status || '';
        if (status === 'approved' || isReviewQueueStatus(status) || status === 'expiring') {
            counts.active += 1;
        }
        if (isReviewQueueStatus(status)) {
            counts.reviewing += 1;
        }
        if (status === 'draft') {
            counts.draft += 1;
        }
        if (status === 'expiring') {
            counts.expiring += 1;
        }
    });

    cards.forEach((card) => {
        const key = card.dataset.oppStat;
        const valueEl = card.querySelector('[data-opp-stat-count]');
        if (valueEl && key in counts) {
            valueEl.textContent = String(counts[key]);
        }
    });
}

function isOemStaffIdentity(identity) {
    return identity === 'oem_director' || identity === 'oem_sales' || identity === 'oem_manager';
}

// 經銷新增的商機一律待總管指派；內部人員預設自己承接
function defaultOemSalesIdForActor(actor = getPreviewActor()) {
    const myId = String(actor.partnerId || '').trim();
    return myId && isOemStaffIdentity(actor.identity) ? myId : '';
}

// 表單不再選 oem_sales_id：經銷維持既有／空；內部人員沿用既有或預設自己
function resolveFormOemSalesId(formData, existing, actor = getPreviewActor()) {
    const existingId = String(existing?.oem_sales_id || '').trim();
    if (isDealerIdentity(actor.identity)) {
        return existingId;
    }
    return existingId || defaultOemSalesIdForActor(actor);
}

function opportunityRequestedSalesName(record) {
    if (!record) {
        return '';
    }
    const form = record.form || {};
    return String(form.oem_sales || form.fields?.oem_sales || '').trim();
}

function partnerNameById(id) {
    const key = String(id || '').trim();
    if (!key) {
        return '';
    }
    return String(getPartnersById().get(key)?.name || '').trim();
}

// 新增／暫存／補件：一律顯示文字欄；assignedId 未給時套預設姓名，null 只在角色切換時補空欄
function syncOpportunityOemSalesField(form, assignedId) {
    const section = form?.querySelector('[data-opp-oem-section]');
    const input = form?.querySelector('[name="oem_sales"], [data-opp-oem-sales-input]');
    if (!section || !input) {
        return;
    }

    section.hidden = false;
    if (assignedId === null) {
        if (!String(input.value || '').trim() && isOemStaffIdentity(getPreviewActor().identity)) {
            input.value = partnerNameById(previewActorKey()) || '';
        }
        return;
    }

    if (assignedId !== undefined) {
        if (!String(input.value || '').trim()) {
            input.value = partnerNameById(assignedId) || '';
        }
        return;
    }

    const actor = getPreviewActor();
    input.value = isOemStaffIdentity(actor.identity)
        ? (partnerNameById(previewActorKey(actor)) || '')
        : '';
}

function denyOpportunityAccess(listUrl) {
    showAppToast('找不到此商機資料', 'error');
    window.setTimeout(() => {
        window.location.href = listUrl || '/opportunities/';
    }, 700);
}

const OPPORTUNITY_SOURCE_LABELS = {
    self: '自行開發',
    oem: '原廠派發',
};

const OPPORTUNITY_RELATION_LABELS = {
    first: '第一次接洽',
    repeat: '多次接洽(未成交)',
    other: '其他',
};

function exportText(value) {
    return String(value ?? '').trim();
}

function recordForExport(record) {
    if (!record || record.form || record.status !== 'draft') {
        return record;
    }
    const draft = getOpportunityDraft(record.id);
    if (!draft?.data) {
        return record;
    }
    return { ...record, form: draft.data };
}

function exportReporterCompany(record) {
    const createdBy = exportText(record?.created_by);
    if (!createdBy) {
        return '';
    }
    if (createdBy === 'admin') {
        return '總管理者';
    }
    const partner = getPartnersById().get(createdBy);
    if (!partner) {
        return opportunityReporterName(record);
    }
    const company = exportText(partner.company);
    const name = exportText(partner.name);
    return company && name ? `${company}／${name}` : (name || company);
}

function exportProductLines(formData) {
    const products = Array.isArray(formData?.products) ? formData.products : [];
    const units = Array.isArray(formData?.units) ? formData.units : [];
    return products.map((product, index) => {
        const name = exportText(product);
        const unit = exportText(units[index]);
        if (!name && !unit) {
            return '';
        }
        return unit ? `${name} / ${unit}` : name;
    }).filter(Boolean).join('；');
}

function opportunityExportCells(record) {
    const source = recordForExport(record);
    const formData = catalogFormFallback(source);
    const fields = formData.fields || {};
    const field = (key) => exportText(fields[key]);
    const partner = getPartnersById().get(exportText(source.created_by));
    const attachment = formData.attachment || source.attachment || null;
    const review = source.review || {};
    const renewal = source.renewal || {};

    return [
        exportText(source.id),
        source.statusLabel || getStatusLabel(source.status) || exportText(source.status),
        OPPORTUNITY_SOURCE_LABELS[formData.source] || exportText(formData.source),
        field('oem_sales') || exportText(formData.oem_sales),
        exportReporterCompany(source),
        opportunityReporterIdentity(source),
        exportText(partner?.phone),
        field('customer_company') || exportText(source.customer_company),
        field('customer_address'),
        field('contact_name'),
        field('contact_title'),
        field('contact_phone'),
        field('contact_email'),
        OPPORTUNITY_RELATION_LABELS[formData.customer_relation] || exportText(formData.customer_relation),
        field('keyman_name'),
        field('keyman_phone'),
        field('keyman_email'),
        exportProductLines(formData),
        field('poc_date'),
        field('decision_date'),
        field('delivery_date'),
        field('complete_date'),
        exportText(formData.competitors),
        exportText(attachment?.name),
        opportunitySalesName(source),
        protectionForStatus(source.status, source.protection),
        opportunityCreatedAt(source),
        exportText(review.resultLabel),
        exportText(review.note),
        exportText(review.reviewedAt),
        renewal.days ? String(renewal.days) : '',
        exportText(renewal.oldProtection),
        exportText(renewal.newProtection),
        exportText(renewal.reason),
        exportText(renewal.attachment?.name),
    ];
}

function exportVisibleOpportunities() {
    if (typeof app().roleCan === 'function' && !app().roleCan('opportunity.export')) {
        showAppToast('目前身分權限無法匯出', 'error');
        return;
    }

    const records = collectVisibleOpportunityRecords({ respectFilters: false });
    if (!records.length) {
        showAppToast('目前沒有可匯出的商機', 'error');
        return;
    }

    const headers = [
        '編號',
        '狀態',
        '商機來源',
        '原廠負責業務',
        '報備者經銷商／業務',
        '身份',
        '報備者聯絡電話',
        '客戶公司名稱',
        '客戶公司地址',
        '客戶主要聯絡人／承辦人',
        '客戶主要聯絡人 職稱／部門',
        '客戶主要聯絡人電話',
        '客戶主要聯絡人信箱',
        '客戶關係',
        'Key Man',
        'Key Man 聯絡電話',
        'Key Man 聯絡 Email',
        '專案產品／U數',
        '預計 POC 日',
        '預計決策日',
        '預計交貨日',
        '預計完成日',
        '備註',
        '附件',
        '承接業務',
        '保護到期日',
        '建立時間',
        '審核結果',
        '審核備註',
        '審核時間',
        '續期天數',
        '原保護到期日',
        '新保護到期日',
        '續期原因',
        '續期附件',
    ];
    const rows = [headers, ...records.map((record) => opportunityExportCells(record))];
    const stamp = new Date().toISOString().slice(0, 10);
    downloadXlsx(`opportunities-${stamp}.xlsx`, '商機', rows);
    showAppToast(`已匯出 ${records.length} 筆商機`, 'success');
}

function bindOpportunityExport() {
    const btn = document.querySelector('[data-opportunity-export]');
    if (!btn || btn.dataset.boundExport === '1') {
        return;
    }
    btn.dataset.boundExport = '1';
    btn.addEventListener('click', () => exportVisibleOpportunities());
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
        data.units.push(units ? units.value : '50-300U');
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
            setFormSelectByValue(unitsSelect, units[index] || '50-300U');
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

function isOpportunityFieldHidden(el) {
    if (!el) {
        return true;
    }

    if (el.closest('[data-create-review-edit], [data-create-review-result]')) {
        return true;
    }

    let node = el;
    while (node && node !== document.documentElement) {
        if (node.hasAttribute?.('hidden')) {
            return true;
        }

        if (node.nodeType === 1) {
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return true;
            }
        }

        node = node.parentElement;
    }

    return false;
}

function opportunityFieldLabel(el) {
    const root = el.closest('.form-field')
        || el.closest('[data-product-row]')
        || el.closest('label')
        || el;
    const label = root.querySelector('.form-label');
    if (label) {
        return String(label.innerText || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    }
    if (el.closest('[data-product-row]')) {
        return '專案產品／U數';
    }
    return '';
}

function validateOpportunityForm(form) {
    const missing = [];
    form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

    const addMissing = (el) => {
        const label = opportunityFieldLabel(el);
        if (label && !missing.includes(label)) {
            missing.push(label);
        }
    };

    form.querySelectorAll('input[required], textarea[required]').forEach((field) => {
        if (field.classList.contains('is-readonly') || field.type === 'hidden' || isOpportunityFieldHidden(field)) {
            return;
        }

        if (!String(field.value || '').trim()) {
            field.classList.add('form-error');
            addMissing(field);
        }
    });

    form.querySelectorAll('[data-form-select][data-required]').forEach((select) => {
        if (isOpportunityFieldHidden(select) || select.closest('[data-create-review-edit]')) {
            return;
        }

        const hidden = select.querySelector('[data-form-select-value]');
        const trigger = select.querySelector('[data-form-select-trigger]');
        if (hidden && !String(hidden.value || '').trim()) {
            if (trigger) {
                trigger.classList.add('form-error');
            }
            addMissing(select);
        }
    });

    form._opportunityMissing = missing;
    return missing.length === 0;
}

function focusFirstOpportunityError(form) {
    const firstError = [...form.querySelectorAll('.form-error')].find((el) => !isOpportunityFieldHidden(el));
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
    const actor = getPreviewActor();
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
        created_by: options.created_by || previewActorKey(actor),
        oem_sales_id: options.oem_sales_id !== undefined ? options.oem_sales_id : defaultOemSalesIdForActor(actor),
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
        units: productLine.map(() => '50-300U'),
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

function canCloseOpportunity() {
    return typeof app().roleCan === 'function' && app().roleCan('opportunity.close');
}

function getRowMoreActions(status) {
    const canCreate = typeof app().roleCan === 'function' ? app().roleCan('opportunity.create') : false;
    const canActions = typeof app().roleCan === 'function' ? app().roleCan('opportunity.actions') : false;
    // 續期／取消：有建立權限的一般使用者也可；結案：僅總管理者可見
    const canManageOwn = canCreate || canActions;
    const canClose = canCloseOpportunity();

    const actions = [
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
    ];

    if (canClose) {
        actions.push({
            action: 'close',
            label: '結案',
            icon: 'circle-check',
            enabled: status === 'expired',
        });
    }

    actions.push({
        action: 'cancel',
        label: '取消商機',
        icon: 'ban',
        danger: true,
            enabled: ['approved', 'expiring', 'reviewing', 'renewing', 'rejected'].includes(status) && canManageOwn,
    });

    return actions;
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

async function handleRowMoreAction(row, action) {
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
        const ok = await showAppConfirm({
            title: '刪除',
            message: `確定刪除暫存 ${id}？此操作無法復原。`,
            confirmLabel: '刪除',
            cancelLabel: '取消',
            danger: true,
        });
        if (!ok) {
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
        const canClose = canCloseOpportunity();
        if (!canClose || row.dataset.status !== 'expired') {
            showAppToast('僅總管理者可對已到期商機結案', 'error');
            return;
        }
        const ok = await showAppConfirm({
            title: '結案確認',
            message: `確定將商機 ${id} 結案？結案後將不再保留保護到期日。`,
            confirmLabel: '確認結案',
            cancelLabel: '取消',
        });
        if (!ok) {
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
        showAppToast('已結案，不再保留保護到期日', 'success');
        return;
    }

    if (action === 'cancel') {
        const ok = await showAppConfirm({
            title: '取消商機',
            message: `確定取消商機 ${id}？`,
            confirmLabel: '確認取消',
            cancelLabel: '返回',
            danger: true,
        });
        if (!ok) {
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
        editBtn.title = isReviewQueueStatus(status) && canReview
            ? (status === 'renewing' ? '檢視／審核續期' : '檢視／審核商機')
            : '編輯商機';
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
    const pill = row.querySelector('[data-opp-status]');
    if (pill) {
        pill.className = `status-pill status-${status}`;
        // 以 status 對應文案為準，避免 store 裡殘留舊的 statusLabel
        pill.textContent = getStatusLabel(status) || label || status;
    }
    updateRowPrimaryAction(row);
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
    const status = record.status || 'reviewing';
    const label = record.statusLabel || getStatusLabel(status);
    const row = document.createElement('div');
    row.className = 'list-row opp-list-cols py-2';
    row.dataset.oppRow = '';
    row.dataset.oppId = record.id;
    row.dataset.dealer = record.dealer || 'tw';
    row.dataset.amount = String(record.amountValue || 0);
    row.dataset.status = status;
    row.dataset.search = opportunitySearchText(record.id, record.customer_company, record.dealer, opportunitySalesName(record), opportunityReporterLabel(record));
    row.dataset.createdBy = record.created_by || '';
    row.dataset.oemSalesId = record.oem_sales_id || '';
    row.dataset.localRecord = 'true';
    setRowQueryMeta(row, record);

    const reviewUrl = `${meta.reviewUrl || '/opportunities/review/'}?id=${encodeURIComponent(record.id)}`;

    row.innerHTML = `
        <div class="min-w-0 truncate text-eb2 text-gray5 uppercase">${record.id}</div>
        <div class="min-w-0 truncate text-cb3 text-gray5" data-opp-customer></div>
        <div class="min-w-0" data-opp-reporter>
            <p class="truncate text-cb3 text-gray5" data-opp-reporter-name>—</p>
            <p class="truncate text-[12px] font-medium tracking-[0.04em] text-gray3" data-opp-reporter-identity hidden></p>
        </div>
        <div class="min-w-0 truncate text-cb3 text-gray5" data-opp-sales>—</div>
        <div class="min-w-0">
            <span class="status-pill" data-opp-status></span>
        </div>
        <div class="min-w-0 whitespace-nowrap text-eb3 text-gray5 uppercase" data-opp-protection>${protectionForStatus(status, record.protection)}</div>
        <div class="min-w-0 whitespace-nowrap text-eb3 text-gray5" data-opp-created>—</div>
        <div class="min-w-0 inline-flex items-center justify-end gap-1" data-opp-actions>
            <a href="${status === 'rejected' ? (isRejectedRenewal(record) ? renewalPageUrl(record.id, meta) : `${meta.createUrl || '/opportunities/create/'}?id=${encodeURIComponent(record.id)}`) : reviewUrl}" class="icon-action" data-opp-edit-action aria-label="編輯 ${record.id}" title="${isReviewQueueStatus(status) ? (status === 'renewing' ? '檢視／審核續期' : '檢視／審核商機') : '編輯商機'}">
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
    setRowSalesUi(row, record);
    setRowReporterUi(row, record);
    setRowCreatedUi(row, record);
    setRowStatusUi(row, status, label);

    return row;
}

function buildDraftOpportunityRow(draft) {
    const meta = getListMeta();
    const createUrl = `${meta.createUrl || '/opportunities/create/'}?draft=${encodeURIComponent(draft.id)}`;
    const label = draftListLabel(draft);
    const row = document.createElement('div');
    row.className = 'list-row opp-list-cols py-2';
    row.dataset.oppRow = '';
    row.dataset.oppId = draft.id;
    row.dataset.dealer = draft.dealer || 'tw';
    row.dataset.amount = '0';
    row.dataset.status = 'draft';
    row.dataset.search = opportunitySearchText(draft.id, label, draft.dealer || 'tw', opportunitySalesName(draft), opportunityReporterLabel(draft));
    row.dataset.createdBy = draft.created_by || '';
    row.dataset.oemSalesId = draft.oem_sales_id || '';
    row.dataset.localDraft = 'true';
    setRowQueryMeta(row, draft);

    row.innerHTML = `
        <div class="min-w-0 truncate text-eb2 text-gray5 uppercase">${draft.id}</div>
        <div class="min-w-0 truncate text-cb3 text-gray5" data-opp-customer></div>
        <div class="min-w-0" data-opp-reporter>
            <p class="truncate text-cb3 text-gray5" data-opp-reporter-name>—</p>
            <p class="truncate text-[12px] font-medium tracking-[0.04em] text-gray3" data-opp-reporter-identity hidden></p>
        </div>
        <div class="min-w-0 truncate text-cb3 text-gray5" data-opp-sales>—</div>
        <div class="min-w-0">
            <span class="status-pill status-draft" data-opp-status>暫存</span>
        </div>
        <div class="min-w-0 whitespace-nowrap text-eb3 text-gray5 uppercase" data-opp-protection>-</div>
        <div class="min-w-0 whitespace-nowrap text-eb3 text-gray5" data-opp-created>—</div>
        <div class="min-w-0 inline-flex items-center justify-end gap-1" data-opp-actions>
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
    setRowSalesUi(row, draft);
    setRowReporterUi(row, draft);
    setRowCreatedUi(row, draft);
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
            setRowReporterUi(row, record);
            row.dataset.search = opportunitySearchText(id, record.customer_company, row.dataset.dealer, opportunitySalesName(record), opportunityReporterLabel(record));
            const protection = row.querySelector('[data-opp-protection]');
            if (protection) {
                protection.textContent = protectionForStatus(record.status || row.dataset.status, record.protection);
            }
            setRowStatusUi(row, record.status || row.dataset.status, record.statusLabel);
            setRowSalesUi(row, record);
            setRowCreatedUi(row, record, seed[id]);
            setRowQueryMeta(row, record, seed[id]);
        }

        if (row.dataset.status === 'draft' && drafts[id]) {
            const customerEl = row.querySelector('[data-opp-customer]');
            const label = draftListLabel(drafts[id]);
            if (customerEl) {
                customerEl.textContent = label;
            }
            row.dataset.search = opportunitySearchText(id, label, row.dataset.dealer || 'tw', opportunitySalesName(drafts[id]), opportunityReporterLabel(drafts[id]));
            setRowSalesUi(row, drafts[id]);
            setRowReporterUi(row, drafts[id]);
            setRowCreatedUi(row, drafts[id]);
            setRowQueryMeta(row, drafts[id]);
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

    sortOpportunityListRows(list);
    bindAllRowMoreMenus(list);
    bindOpportunityExport();
    syncOpportunityVisibility();
    syncOpportunityStats();

    if (typeof app().applyPreviewRole === 'function') {
        // only re-apply capability visibility without recursion loops
        document.querySelectorAll('[data-requires]').forEach((element) => {
            const allowed = app().roleCan(element.dataset.requires);
            element.hidden = !allowed;
            element.classList.toggle('is-role-hidden', !allowed);
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
        <div class="self-stretch flex flex-col md:flex-row md:items-center gap-3" data-review-product-row>
            <input type="text" class="form-input w-full min-w-0 md:flex-1 is-readonly" data-review-product value="${String(product || '—').replace(/"/g, '&quot;')}" readonly tabindex="-1">
            <input type="text" class="form-input w-full md:w-48 shrink-0 is-readonly" data-review-units value="${String(units[index] || '—').replace(/"/g, '&quot;')}" readonly tabindex="-1">
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
        pill.textContent = getStatusLabel(record.status) || record.statusLabel || record.status;
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
    setReviewField('oem_sales', (() => {
        const assigned = opportunitySalesName(record);
        if (assigned && assigned !== UNASSIGNED_SALES_LABEL) {
            return assigned;
        }
        return opportunityRequestedSalesName(record) || assigned || '—';
    })());
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
    const isReviewing = isReviewQueueStatus(record.status);
    const hasReview = Boolean(record.review);
    const allowAdminEdit = canReview && !['draft', 'completed'].includes(record.status);
    const isEditing = allowAdminEdit && page.dataset.reviewEditing === '1' && !isReviewing;
    // 審核中／續期審核中：空白表單；已審核：結果卡；按「修改審核」後才展開表單
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
            setText('[data-review-summary-title]', getStatusLabel(record.status) || record.statusLabel || '審核中');
            setText('[data-review-done-result]', '-');
            setText('[data-review-done-status]', dash(getStatusLabel(record.status) || record.statusLabel));
            setText('[data-review-done-sales]', '-');
            setText('[data-review-done-note]', '-');
        } else {
            setText('[data-review-summary-title]', hasReview ? '已完成審核' : (getStatusLabel(record.status) || record.statusLabel || '-'));
            setText('[data-review-done-result]', dash(record.review?.resultLabel));
            setText('[data-review-done-status]', dash(getStatusLabel(record.status) || record.statusLabel));
            setText('[data-review-done-sales]', dash(record.review?.salesLabel));
            setText('[data-review-done-note]', dash(record.review?.note));
        }
    }

    if (hint) {
        hint.hidden = !showForm;
        if (showForm) {
            if (isPendingRenewal(record)) {
                hint.textContent = '此為續期申請，僅總管理者可操作。審核通過後保護到期日才會延長 90 天。';
            } else if (isEditing) {
                hint.textContent = '修改後送出，會依新的審核結果更新案件狀態。';
            } else {
                hint.textContent = '僅總管理者可操作。審核通過需指派承接業務；指派後該筆會出現在承接業務與其主管的帳號。';
            }
        }
    }

    const pendingRenewalForm = isPendingRenewal(record);

    page.querySelectorAll('[data-review-result-field], [data-review-note-field]').forEach((el) => {
        el.hidden = !showForm;
    });

    const salesField = page.querySelector('[data-review-sales-field]');
    if (salesField) {
        // 續期審核不改指派，隱藏承接業務
        salesField.hidden = !showForm || pendingRenewalForm;
    }

    if (showForm && form) {
        const resultSelect = form.querySelector('[name="review_result"]')?.closest('[data-form-select]');
        const salesSelect = form.querySelector('[name="assigned_sales"]')?.closest('[data-form-select]');
        const note = form.querySelector('[data-review-note]');

        if (isEditing && hasReview) {
            if (record.review?.result) {
                setFormSelectByValue(resultSelect, record.review.result);
            }
            if (note) {
                note.value = record.review?.note || '';
            }
        } else {
            clearFormSelect(resultSelect, '請選擇審核結果');
            if (note) {
                note.value = '';
            }
        }

        if (!pendingRenewalForm) {
            if (record.oem_sales_id) {
                setFormSelectByValue(salesSelect, record.oem_sales_id);
            } else {
                clearFormSelect(salesSelect, '請選擇承接業務');
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
        if (!record || !canViewOpportunity(record)) {
            denyOpportunityAccess(page.dataset.listUrl || '/opportunities/');
            return;
        }
        renderReviewPage(record);
    }

    // 補件／暫存頁：角色切換時重算「修改審核」顯示
    const createForm = document.querySelector('[data-opportunity-form]');
    if (createForm) {
        const draftId = getQueryParam('draft') || '';
        if (draftId) {
            const draft = getOpportunityDraft(draftId);
            const draftRecord = {
                id: draftId,
                status: 'draft',
                created_by: draft?.created_by || '',
                oem_sales_id: draft?.oem_sales_id || '',
            };
            if (draft && !canViewOpportunity(draftRecord)) {
                denyOpportunityAccess(createForm.dataset.listUrl || '/opportunities/');
                return;
            }
        }

        const recordId = getQueryParam('id') || '';
        const record = recordId ? getOpportunityById(recordId) : null;
        if (recordId && (!record || !canViewOpportunity(record))) {
            denyOpportunityAccess(createForm.dataset.listUrl || '/opportunities/');
            return;
        }
        if (record?.status === 'rejected' && record.review) {
            showCreateReviewResult(record.review, record.status, recordId);
        } else {
            const editReviewLink = document.querySelector('[data-create-edit-review]');
            if (editReviewLink) {
                editReviewLink.hidden = true;
            }
        }
    }

    const renewPage = document.querySelector('[data-renew-page]');
    if (renewPage) {
        const id = getQueryParam('id');
        const record = getOpportunityById(id);
        if (!record || !canViewOpportunity(record)) {
            denyOpportunityAccess(renewPage.dataset.listUrl || '/opportunities/');
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
    if (!record || !canViewOpportunity(record)) {
        denyOpportunityAccess(page.dataset.listUrl || '/opportunities/');
        return;
    }

    // 從補件頁「修改審核」帶入時，直接展開編輯表單
    if (
        getQueryParam('edit') === '1'
        && record.review
        && !isReviewQueueStatus(record.status)
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
        if (!isReviewQueueStatus(current.status) && page.dataset.reviewEditing !== '1') {
            showAppToast('請先點選修改審核', 'error');
            return;
        }

        form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

        const resultSelect = form.querySelector('[name="review_result"]')?.closest('[data-form-select]');
        const salesSelect = form.querySelector('[name="assigned_sales"]')?.closest('[data-form-select]');
        const note = form.querySelector('[name="review_note"]');

        const resultValue = resultSelect?.querySelector('[data-form-select-value]')?.value || '';
        const salesValue = salesSelect?.querySelector('[data-form-select-value]')?.value || '';

        const resultOption = (resultSelect?._formMenu || resultSelect?.querySelector('[data-form-select-menu]'))
            ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(resultValue)}"]`);
        const salesOption = salesValue
            ? (salesSelect?._formMenu || salesSelect?.querySelector('[data-form-select-menu]'))
                ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(salesValue)}"]`)
            : null;

        const pendingRenewal = isPendingRenewal(current) ? current.renewal : null;
        let valid = true;
        if (!resultValue) {
            resultSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
            valid = false;
        }
        if (!pendingRenewal && !salesValue && (resultOption?.dataset.status || 'approved') === 'approved') {
            salesSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
            valid = false;
        }

        if (!valid) {
            showAppToast(
                resultValue && !pendingRenewal ? '審核通過需指派承接業務' : '請完成必填的審核欄位',
                'error'
            );
            focusFirstOpportunityError(form);
            return;
        }

        const nextStatus = resultOption?.dataset.status || 'approved';
        const nextStatusLabel = resultOption?.dataset.statusLabel || getStatusLabel(nextStatus);
        const resultLabel = resultOption?.dataset.label || resultValue;
        const nextSalesId = pendingRenewal ? (current.oem_sales_id || '') : salesValue;
        const salesLabel = pendingRenewal
            ? (opportunitySalesName(current) || current.review?.salesLabel || '')
            : (salesOption?.dataset.label || salesValue);

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

        const wasReviewed = Boolean(current.review) && !isReviewQueueStatus(current.status);
        const updated = upsertOpportunity({
            ...current,
            status: nextStatus,
            statusLabel: nextStatusLabel,
            protection: protectionForStatus(nextStatus, nextProtection),
            renewal: nextRenewal,
            oem_sales_id: nextSalesId,
            review: {
                result: resultValue,
                resultLabel,
                sales: nextSalesId,
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
        const assignedSalesId = getOpportunityById(id)?.oem_sales_id || '';
        if (assignedSalesId) {
            setFormSelectByValue(salesSelect, assignedSalesId);
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
        hint.hidden = status !== 'rejected' || showEditReview;
    }
    if (editPanel) {
        editPanel.hidden = true;
    }
    if (asideHint) {
        asideHint.hidden = false;
        if (status === 'rejected') {
            asideHint.textContent = showEditReview
                ? '可查看退回原因，並以「修改審核」更新審核結果。'
                : '請依審核備註修正資料後再次確認送出，送出後會回到「審核中」。';
        }
    }
    if (submitBtn) {
        submitBtn.hidden = showEditReview;
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

    const resultOption = (resultSelect?._formMenu || resultSelect?.querySelector('[data-form-select-menu]'))
        ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(resultValue)}"]`);
    const salesOption = salesValue
        ? (salesSelect?._formMenu || salesSelect?.querySelector('[data-form-select-menu]'))
            ?.querySelector(`[data-form-select-option][data-value="${CSS.escape(salesValue)}"]`)
        : null;

    let valid = true;
    if (!resultValue) {
        resultSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
        valid = false;
    }
    if (!salesValue && (resultOption?.dataset.status || 'approved') === 'approved') {
        salesSelect?.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
        valid = false;
    }
    if (!valid) {
        showAppToast(resultValue ? '審核通過需指派承接業務' : '請完成必填的審核欄位', 'error');
        return;
    }

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
        oem_sales_id: salesValue,
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
    const cancelLink = opportunityForm.querySelector('[data-create-cancel]');

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
            if (cancelLink) {
                cancelLink.textContent = '取消編輯';
            }
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
            const canReview = typeof app().roleCan === 'function' && app().roleCan('opportunity.review');
            if (asideHint) {
                asideHint.textContent = canReview
                    ? '可查看退回原因，並以「修改審核」更新審核結果。'
                    : '請依審核備註修正資料後再次確認送出，送出後會回到「審核中」。';
            }
            if (submitLabel) {
                submitLabel.textContent = '再次送出';
                if (canReview) {
                    submitLabel.hidden = true;
                }
            }
            if (saveDraftBtn) {
                saveDraftBtn.hidden = true;
            }
            if (cancelLink) {
                cancelLink.textContent = '取消編輯';
            }
        }
    }

    if (activeDraftId) {
        const existing = getOpportunityDraft(activeDraftId);
        if (existing && !canViewOpportunity({
            id: activeDraftId,
            status: 'draft',
            created_by: existing.created_by || '',
            oem_sales_id: existing.oem_sales_id || '',
        })) {
            denyOpportunityAccess(opportunityForm.dataset.listUrl || '/opportunities/');
            return;
        }
        if (existing) {
            applyOpportunityFormData(opportunityForm, existing);
        }
        syncOpportunityOemSalesField(opportunityForm, existing ? existing.oem_sales_id || '' : undefined);
        syncTitles('draft', activeDraftId);
    } else if (activeRecordId) {
        const record = getOpportunityById(activeRecordId);
        if (!record || !canViewOpportunity(record)) {
            denyOpportunityAccess(opportunityForm.dataset.listUrl || '/opportunities/');
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
        syncOpportunityOemSalesField(opportunityForm, record.oem_sales_id || '');
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
        syncOpportunityOemSalesField(opportunityForm);
    }

    document.addEventListener('upas:rolechange', () => syncOpportunityOemSalesField(opportunityForm, null));

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => {
            const data = collectOpportunityFormData(opportunityForm);
            if (!activeDraftId) {
                activeDraftId = createOpportunityDraftId();
            }

            const actor = getPreviewActor();
            const existingDraft = getOpportunityDraft(activeDraftId);
            upsertOpportunityDraft({
                id: activeDraftId,
                status: 'draft',
                updatedAt: new Date().toISOString(),
                createdAt: existingDraft?.createdAt || formatDateTime(),
                created_by: existingDraft?.created_by || previewActorKey(actor),
                oem_sales_id: resolveFormOemSalesId(data, existingDraft, actor),
                dealer: existingDraft?.dealer || (isDealerIdentity(actor.identity)
                    ? (actor.identity === 'dealer_overseas' ? 'overseas' : 'tw')
                    : 'oem'),
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

    opportunityForm.noValidate = true;

    async function submitOpportunityWithoutValidation() {
        try {
            const data = collectOpportunityFormData(opportunityForm);
            const existing = activeRecordId ? getOpportunityById(activeRecordId) : null;
            const existingDraft = activeDraftId ? getOpportunityDraft(activeDraftId) : null;
            const actor = getPreviewActor();
            const createdAt = existing?.submittedAt || existing?.createdAt || existingDraft?.createdAt || formatDateTime();
            const record = formDataToRecord(data, {
                id: activeRecordId || undefined,
                status: 'reviewing',
                amount: existing?.amount || '-',
                amountValue: existing?.amountValue || 0,
                dealer: existing?.dealer || (isDealerIdentity(actor.identity)
                    ? (actor.identity === 'dealer_overseas' ? 'overseas' : 'tw')
                    : 'oem'),
                protection: existing?.protection || '-',
                booking_code: existing?.booking_code || activeRecordId || undefined,
                review: existing?.review || null,
                submittedAt: createdAt,
                created_by: existing?.created_by || previewActorKey(actor),
                oem_sales_id: resolveFormOemSalesId(data, existing, actor),
            });

            upsertOpportunity(record);

            if (activeDraftId) {
                removeOpportunityDraft(activeDraftId);
            }
        } catch (error) {
            console.warn(error);
        }

        await showSubmitReviewNotice(
            activeRecordId ? '已再次送出，商機回到審核中' : '已送出，商機進入審核中',
        );
        window.location.href = opportunityForm.dataset.listUrl
            || opportunityForm.dataset.cancelUrl
            || '/opportunities/';
    }

    opportunityForm.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();
        submitOpportunityWithoutValidation();
    });

    submitLabel?.addEventListener('click', (event) => {
        if (window.__upasSubmitNoticeShown) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        submitOpportunityWithoutValidation();
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

    if (!record || !canViewOpportunity(record)) {
        denyOpportunityAccess(listUrl);
        return;
    }

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
        pill.textContent = getStatusLabel(record.status) || record.statusLabel || record.status;
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

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validateStepOne()) {
            setStep(1);
            return;
        }

        const nextProtection = updateNewProtection();
        upsertOpportunity({
            ...record,
            protection: oldProtection,
            status: 'renewing',
            statusLabel: getStatusLabel('renewing'),
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

        await showSubmitReviewNotice('已送出續期申請，進入續期審核中');
        window.location.href = listUrl;
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

try { syncOpportunityListUi(); } catch (error) { console.warn(error); }
try { initReviewPage(); } catch (error) { console.warn(error); }
try { initOpportunityForm(); } catch (error) { console.warn(error); }
try { initRenewPage(); } catch (error) { console.warn(error); }
