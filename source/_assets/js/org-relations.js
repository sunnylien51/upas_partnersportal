const STORAGE_KEY = 'upas-partners';
const DELETED_KEY = 'upas-partners-deleted';

const IDENTITY_LABEL = {
    oem_manager: '原廠業務主管',
    oem_sales: '原廠業務',
    dealer_tw: '國內經銷商',
    dealer_overseas: '海外經銷商',
};

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

function readJson(id, fallback) {
    const el = document.getElementById(id);
    if (!el) {
        return fallback;
    }
    try {
        return JSON.parse(el.textContent);
    } catch (error) {
        return fallback;
    }
}

function readStoredPartners() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function readDeletedIds() {
    try {
        const parsed = JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch (error) {
        return new Set();
    }
}

function clonePartners(list) {
    return list.map((item) => ({ ...item }));
}

function loadPartners() {
    const deleted = readDeletedIds();
    const byId = new Map();
    const seed = readJson('partners-seed-data', []);
    (Array.isArray(seed) ? seed : []).forEach((item) => {
        if (item?.id && !deleted.has(String(item.id))) {
            byId.set(String(item.id), { ...item });
        }
    });
    readStoredPartners().forEach((item) => {
        if (!item?.id || deleted.has(String(item.id))) {
            return;
        }
        const id = String(item.id);
        byId.set(id, { ...(byId.get(id) || {}), ...item });
    });
    return [...byId.values()];
}

function canEdit() {
    return typeof app().roleCan !== 'function' || app().roleCan('profile.manage');
}

function byName(a, b) {
    return String(a.name || a.company || '').localeCompare(String(b.name || b.company || ''), 'zh-Hant');
}

function personLabel(partner) {
    const role = IDENTITY_LABEL[partner.identity] || '';
    return [partner.name || partner.company || partner.id, role].filter(Boolean).join(' · ');
}

function relationKey(partner) {
    return `${partner.id}|${partner.manager_id || ''}`;
}

const page = document.querySelector('[data-org-page]');
if (page) {
    const poolEl = page.querySelector('[data-org-pool]');
    const treeEl = page.querySelector('[data-org-tree]');
    const saveBtn = page.querySelector('[data-org-save]');
    const resetBtn = page.querySelector('[data-org-reset]');
    let baseline = loadPartners();
    let working = clonePartners(baseline);
    const expanded = new Set();
    let drag = null;

    function partnerById(id) {
        return working.find((item) => item.id === id) || null;
    }

    function salesOf(managerId) {
        return working
            .filter((item) => item.identity === 'oem_sales' && item.manager_id === managerId)
            .sort(byName);
    }

    function isDirty() {
        const base = new Map(baseline.map((item) => [item.id, relationKey(item)]));
        return working.some((item) => base.get(item.id) !== relationKey(item));
    }

    function syncActions() {
        const dirty = isDirty();
        const editable = canEdit();
        if (saveBtn) {
            saveBtn.disabled = !dirty || !editable;
        }
        if (resetBtn) {
            resetBtn.disabled = !dirty || !editable;
        }
    }

    function escapeText(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function toggleButton(id, hasChildren) {
        if (!hasChildren) {
            return '<span class="size-6 shrink-0" aria-hidden="true"></span>';
        }
        const open = expanded.has(id);
        return `<button type="button" class="org-toggle" data-org-toggle="${escapeText(id)}" aria-expanded="${open ? 'true' : 'false'}" aria-label="${open ? '收合' : '展開'}">
            <i data-lucide="${open ? 'chevron-down' : 'chevron-right'}" class="w-4 h-4"></i>
        </button>`;
    }

    function salesBranch(sales) {
        return `
            <div class="org-row bg-bg2" draggable="${canEdit() ? 'true' : 'false'}" data-org-drag="sales" data-org-id="${escapeText(sales.id)}">
                ${toggleButton(sales.id, false)}
                <span class="text-cb3 text-gray5 min-w-0 truncate">${escapeText(personLabel(sales))}</span>
            </div>
        `;
    }

    function renderPool() {
        const managerIds = new Set(working.filter((item) => item.identity === 'oem_manager').map((item) => item.id));
        const looseSales = working
            .filter((item) => item.identity === 'oem_sales' && !managerIds.has(item.manager_id || ''))
            .sort(byName);

        poolEl.innerHTML = `
            <div class="self-stretch flex flex-col gap-2" data-org-drop="unbind-sales">
                <p class="text-cb3 text-gray4">原廠業務（尚未指定直屬主管）</p>
                ${looseSales.length
                    ? looseSales.map((sales) => salesBranch(sales)).join('')
                    : '<p class="org-dropzone text-cb3 text-gray3 px-3 py-4 rounded-[8px] border border-dashed border-gray1">目前都已指定直屬主管。</p>'}
            </div>
        `;
    }

    function renderTree() {
        const managers = working.filter((item) => item.identity === 'oem_manager').sort(byName);
        if (!managers.length) {
            treeEl.innerHTML = '<p class="text-cb3 text-gray3">尚無原廠業務主管。請先在夥伴管理指定身分權限。</p>';
            return;
        }

        treeEl.innerHTML = managers.map((manager) => {
            const sales = salesOf(manager.id);
            return `
                <div class="flex flex-col gap-2" data-org-drop="manager" data-org-id="${escapeText(manager.id)}">
                    <div class="org-row">
                        ${toggleButton(manager.id, true)}
                        <span class="text-cb3 text-gray5 min-w-0 truncate">${escapeText(personLabel(manager))}</span>
                    </div>
                    <div class="org-children" ${expanded.has(manager.id) ? '' : 'hidden'}>
                        ${sales.length
                            ? sales.map((item) => salesBranch(item)).join('')
                            : '<p class="text-cb3 text-gray3">尚無業務。將左側的原廠業務拖到這裡。</p>'}
                    </div>
            </div>
        `;
    }).join('');
    }

    function render() {
        renderPool();
        renderTree();
        bindInteractions();
        syncActions();
        refreshIcons(page);
    }

    function bindInteractions() {
        page.querySelectorAll('[data-org-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const id = button.dataset.orgToggle;
                if (expanded.has(id)) {
                    expanded.delete(id);
                } else {
                    expanded.add(id);
                }
                render();
            });
        });

        page.querySelectorAll('[data-org-drag]').forEach((row) => {
            row.addEventListener('dragstart', (event) => {
                drag = { kind: row.dataset.orgDrag, id: row.dataset.orgId };
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', row.dataset.orgId || '');
                row.classList.add('opacity-60');
            });
            row.addEventListener('dragend', () => {
                drag = null;
                row.classList.remove('opacity-60');
                page.querySelectorAll('.is-over').forEach((el) => el.classList.remove('is-over'));
            });
        });

        page.querySelectorAll('[data-org-drop]').forEach((zone) => {
            zone.addEventListener('dragover', (event) => {
                if (!canAccept(zone)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                zone.classList.add('is-over');
                const row = zone.querySelector(':scope > .org-row');
                row?.classList.add('is-over');
            });
            zone.addEventListener('dragleave', (event) => {
                if (zone.contains(event.relatedTarget)) {
                    return;
                }
                zone.classList.remove('is-over');
                zone.querySelector(':scope > .org-row')?.classList.remove('is-over');
            });
            zone.addEventListener('drop', (event) => {
                if (!canAccept(zone)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                zone.classList.remove('is-over');
                const moving = drag;
                drag = null;
                applyDrop(zone, moving);
            });
        });
    }

    function canAccept(zone) {
        if (!canEdit() || !drag) {
            return false;
        }
        const drop = zone.dataset.orgDrop;
        return drag.kind === 'sales' && (drop === 'manager' || drop === 'unbind-sales');
    }

    async function applyDrop(zone, moving) {
        if (!moving) {
            return;
        }
        const source = partnerById(moving.id);
        if (!source) {
            return;
        }
        const drop = zone.dataset.orgDrop;
        const targetId = zone.dataset.orgId || '';
        const target = targetId ? partnerById(targetId) : null;

        if (moving.kind === 'sales' && drop === 'manager') {
            if (source.manager_id === targetId) {
                return;
            }
            const ok = await showConfirm({
                title: '調整直屬主管',
                message: `確定將「${source.name || source.id}」改掛到「${target?.name || '這位主管'}」底下？`,
                confirmLabel: '確定',
                cancelLabel: '取消',
            });
            if (!ok) {
                return;
            }
            source.manager_id = targetId;
            expanded.add(targetId);
            expanded.add(source.id);
        } else if (moving.kind === 'sales' && drop === 'unbind-sales') {
            if (!source.manager_id) {
                return;
            }
            const ok = await showConfirm({
                title: '取消直屬主管',
                message: `確定讓「${source.name || source.id}」先不掛主管？`,
                confirmLabel: '確定',
                cancelLabel: '取消',
            });
            if (!ok) {
                return;
            }
            source.manager_id = '';
        }

        render();
    }

    function saveRelations() {
        const base = new Map(baseline.map((item) => [item.id, relationKey(item)]));
        const changed = working.filter((item) => base.get(item.id) !== relationKey(item));
        if (!changed.length) {
            return;
        }
        const stored = readStoredPartners().filter((item) => !changed.some((next) => next.id === item.id));
        stored.push(...changed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        baseline = clonePartners(working);
        syncActions();
        showToast('已儲存組織關係');
    }

    saveBtn?.addEventListener('click', saveRelations);
    resetBtn?.addEventListener('click', () => {
        working = clonePartners(baseline);
        render();
        showToast('已還原尚未儲存的調整');
    });

    working.filter((item) => item.identity === 'oem_manager' || item.identity === 'oem_sales').forEach((item) => {
        expanded.add(item.id);
    });
    render();
}
