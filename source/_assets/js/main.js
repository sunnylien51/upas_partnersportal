document.addEventListener('DOMContentLoaded', function () {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

const appSidebar = document.getElementById('app-sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function openAppSidebar() {
    if (!appSidebar) {
        return;
    }

    appSidebar.classList.remove('-translate-x-full');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('hidden');
    }
    document.body.classList.add('overflow-hidden');
}

function closeAppSidebar() {
    if (!appSidebar) {
        return;
    }

    appSidebar.classList.add('-translate-x-full');
    if (sidebarOverlay) {
        sidebarOverlay.classList.add('hidden');
    }
    document.body.classList.remove('overflow-hidden');
}

if (sidebarToggle && appSidebar) {
    sidebarToggle.addEventListener('click', openAppSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeAppSidebar);
}

window.addEventListener('resize', () => {
    if (window.innerWidth >= 800) {
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('hidden');
        }
        document.body.classList.remove('overflow-hidden');
        if (appSidebar) {
            appSidebar.classList.add('-translate-x-full');
        }
    }
});

document.querySelectorAll('[data-locale]').forEach((button) => {
    button.addEventListener('click', function () {
        document.querySelectorAll('[data-locale]').forEach((item) => {
            item.classList.toggle('is-active', item === button);
        });
    });
});

function refreshIcons(scope) {
    if (typeof lucide === 'undefined') {
        return;
    }

    lucide.createIcons({
        root: scope || document,
    });
}

function closeRowMoreMenus() {
    if (typeof window.closeRowMoreMenusImpl === 'function') {
        window.closeRowMoreMenusImpl();
    }
}

function closeStatusSelects(except) {
    document.querySelectorAll('[data-status-select].is-open').forEach((select) => {
        if (except && select === except) {
            return;
        }

        select.classList.remove('is-open');
        const trigger = select.querySelector('[data-status-trigger]');
        const menu = select._statusMenu;
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
        if (menu) {
            menu.classList.remove('is-open');
            menu.hidden = true;
            menu.style.removeProperty('top');
            menu.style.removeProperty('left');
            menu.style.removeProperty('position');
            if (menu._statusOwner) {
                menu._statusOwner.appendChild(menu);
            }
        }
    });
}

function setStatusSelectValue(select, option) {
    const value = option.dataset.value;
    const label = option.dataset.label;
    const icon = option.dataset.icon;
    const trigger = select.querySelector('[data-status-trigger]');
    const labelEl = select.querySelector('[data-status-label]');
    const iconEl = select.querySelector('[data-status-icon]');

    if (!trigger || !labelEl || !iconEl) {
        return;
    }

    trigger.className = `status-trigger status-${value}`;
    labelEl.textContent = label;

    const nextIcon = document.createElement('i');
    nextIcon.setAttribute('data-lucide', icon);
    nextIcon.className = 'status-trigger-icon';
    nextIcon.setAttribute('data-status-icon', '');
    iconEl.replaceWith(nextIcon);

    const menu = select._statusMenu;
    if (menu) {
        menu.querySelectorAll('[data-status-option]').forEach((item) => {
            const selected = item === option;
            item.classList.toggle('is-selected', selected);
            item.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
    }

    refreshIcons(select);
}

function positionStatusMenu(trigger, menu) {
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const menuWidth = Math.max(menu.offsetWidth || 184, 184);
    const menuHeight = menu.offsetHeight || 280;
    let top = rect.bottom + gap;
    let left = rect.left;

    if (top + menuHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - menuHeight - gap);
    }

    if (left + menuWidth > window.innerWidth - 12) {
        left = Math.max(12, rect.right - menuWidth);
    }

    menu.style.position = 'fixed';
    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
}

document.querySelectorAll('[data-status-select]').forEach((select, index) => {
    const trigger = select.querySelector('[data-status-trigger]');
    const menu = select.querySelector('[data-status-menu]');

    if (!trigger || !menu) {
        return;
    }

    select.dataset.statusId = String(index);
    menu.dataset.owner = String(index);
    menu._statusOwner = select;
    select._statusMenu = menu;

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (select.classList.contains('is-readonly')) {
            return;
        }

        const willOpen = !select.classList.contains('is-open');
        closeStatusSelects();
        closeFilterDropdown();
        closeFormSelects();

        if (!willOpen) {
            return;
        }

        document.body.appendChild(menu);
        menu.hidden = false;
        menu.classList.add('is-open');
        select.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        positionStatusMenu(trigger, menu);
        refreshIcons(menu);
    });

    menu.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    menu.querySelectorAll('[data-status-option]').forEach((option) => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            setStatusSelectValue(select, option);
            closeStatusSelects();

            const row = select.closest('[data-opp-row]');
            if (row && typeof window.persistOpportunityRowStatus === 'function') {
                window.persistOpportunityRowStatus(row, option.dataset.value, option.dataset.label);
            }
        });
    });
});

window.addEventListener('resize', () => {
    closeStatusSelects();
    closeFilterDropdown();
    closeFormSelects();
    closeRowMoreMenus();
});

document.addEventListener('click', () => {
    closeStatusSelects();
    closeFilterDropdown();
    closeFormSelects();
    closeRowMoreMenus();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeStatusSelects();
        closeFilterDropdown();
        closeFormSelects();
        closeRowMoreMenus();
    }
});

/* ---------- 商機篩選下拉 ---------- */
const FILTER_DEFAULTS = {
    dealer: 'all',
    status: 'all',
};

const filterDropdown = document.querySelector('[data-filter-dropdown]');
const filterTrigger = filterDropdown?.querySelector('[data-filter-trigger]');
const filterPanel = filterDropdown?.querySelector('[data-filter-panel]');
const filterDot = filterDropdown?.querySelector('[data-filter-dot]');
const filterEmpty = document.querySelector('[data-filter-empty]');
const searchInput = document.querySelector('[data-search-input]');

let draftFilters = { ...FILTER_DEFAULTS };
let appliedFilters = { ...FILTER_DEFAULTS };

function syncFilterChips() {
    if (!filterPanel) {
        return;
    }

    filterPanel.querySelectorAll('[data-filter-group]').forEach((group) => {
        const key = group.dataset.filterGroup;
        const selected = draftFilters[key] || 'all';

        group.querySelectorAll('[data-filter-chip]').forEach((chip) => {
            const isSelected = chip.dataset.value === selected;
            chip.classList.toggle('is-selected', isSelected);
            chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });
    });
}

function syncFilterTriggerState() {
    if (!filterDropdown) {
        return;
    }

    const activeCount = Object.keys(FILTER_DEFAULTS).filter((key) => appliedFilters[key] !== 'all').length;
    filterDropdown.classList.toggle('has-filters', activeCount > 0);

    if (filterDot) {
        filterDot.hidden = activeCount === 0;
    }
}

function applyOpportunityFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const rows = document.querySelectorAll('[data-opp-row]');
    let visibleCount = 0;

    rows.forEach((row) => {
        const dealerOk = appliedFilters.dealer === 'all' || row.dataset.dealer === appliedFilters.dealer;
        const statusOk = appliedFilters.status === 'all' || row.dataset.status === appliedFilters.status;
        const searchOk = query.length === 0 || (row.dataset.search || '').toLowerCase().includes(query);
        const visible = dealerOk && statusOk && searchOk;

        row.hidden = !visible;
        if (visible) {
            visibleCount += 1;
        }
    });

    if (filterEmpty) {
        filterEmpty.hidden = visibleCount > 0 || rows.length === 0;
    }

    syncFilterTriggerState();
}

function positionFilterPanel() {
    if (!filterTrigger || !filterPanel) {
        return;
    }

    const rect = filterTrigger.getBoundingClientRect();
    const gap = 8;
    const panelWidth = Math.min(766, window.innerWidth - 24);
    const panelHeight = filterPanel.offsetHeight || 420;
    let top = rect.bottom + gap;
    let left = rect.left;

    if (left + panelWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - panelWidth - 12);
    }

    if (top + panelHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - panelHeight - gap);
    }

    filterPanel.style.position = 'fixed';
    filterPanel.style.top = `${Math.round(top)}px`;
    filterPanel.style.left = `${Math.round(left)}px`;
    filterPanel.style.width = `${panelWidth}px`;
}

function closeFilterDropdown() {
    if (!filterDropdown || !filterPanel || !filterTrigger) {
        return;
    }

    if (!filterDropdown.classList.contains('is-open')) {
        return;
    }

    draftFilters = { ...appliedFilters };
    syncFilterChips();

    filterDropdown.classList.remove('is-open');
    filterTrigger.setAttribute('aria-expanded', 'false');
    filterPanel.classList.remove('is-open');
    filterPanel.hidden = true;
    filterPanel.style.removeProperty('top');
    filterPanel.style.removeProperty('left');
    filterPanel.style.removeProperty('width');
    filterPanel.style.removeProperty('position');

    if (filterPanel._filterOwner) {
        filterPanel._filterOwner.appendChild(filterPanel);
    }
}

function openFilterDropdown() {
    if (!filterDropdown || !filterPanel || !filterTrigger) {
        return;
    }

    closeStatusSelects();
    closeFormSelects();
    draftFilters = { ...appliedFilters };
    syncFilterChips();

    document.body.appendChild(filterPanel);
    filterPanel.hidden = false;
    filterPanel.classList.add('is-open');
    filterDropdown.classList.add('is-open');
    filterTrigger.setAttribute('aria-expanded', 'true');
    positionFilterPanel();
}

if (filterDropdown && filterTrigger && filterPanel) {
    filterPanel._filterOwner = filterDropdown;

    filterTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (filterDropdown.classList.contains('is-open')) {
            closeFilterDropdown();
            return;
        }

        openFilterDropdown();
    });

    filterPanel.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    filterPanel.querySelectorAll('[data-filter-group]').forEach((group) => {
        group.querySelectorAll('[data-filter-chip]').forEach((chip) => {
            chip.addEventListener('click', (event) => {
                event.preventDefault();
                draftFilters[group.dataset.filterGroup] = chip.dataset.value;
                syncFilterChips();
            });
        });
    });

    const clearBtn = filterPanel.querySelector('[data-filter-clear]');
    if (clearBtn) {
        clearBtn.addEventListener('click', (event) => {
            event.preventDefault();
            draftFilters = { ...FILTER_DEFAULTS };
            syncFilterChips();
        });
    }

    const applyBtn = filterPanel.querySelector('[data-filter-apply]');
    if (applyBtn) {
        applyBtn.addEventListener('click', (event) => {
            event.preventDefault();
            appliedFilters = { ...draftFilters };
            applyOpportunityFilters();
            closeFilterDropdown();
        });
    }
}

/* ---------- 預覽身分：總管理者 / 一般使用者 ---------- */
const ROLE_STORAGE_KEY = 'upas-preview-role';
const rolesConfigEl = document.getElementById('app-roles-config');
let rolesConfig = {
    defaultRole: 'admin',
    roles: {},
};

if (rolesConfigEl) {
    try {
        rolesConfig = JSON.parse(rolesConfigEl.textContent);
    } catch (error) {
        console.warn('Unable to parse roles config', error);
    }
}

function getPreviewRole() {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    if (stored && rolesConfig.roles[stored]) {
        return stored;
    }

    return rolesConfig.defaultRole || 'admin';
}

function roleCan(capability) {
    const role = rolesConfig.roles[getPreviewRole()];
    return Boolean(role && Array.isArray(role.can) && role.can.includes(capability));
}

function roleHasNav(path) {
    const role = rolesConfig.roles[getPreviewRole()];
    return Boolean(role && Array.isArray(role.nav) && role.nav.includes(path));
}

function applyPreviewRole(roleKey) {
    if (!rolesConfig.roles[roleKey]) {
        return;
    }

    localStorage.setItem(ROLE_STORAGE_KEY, roleKey);
    document.body.dataset.previewRole = roleKey;

    const role = rolesConfig.roles[roleKey];

    document.querySelectorAll('[data-role-switch]').forEach((button) => {
        const active = button.dataset.roleSwitch === roleKey;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    document.querySelectorAll('[data-role-label]').forEach((label) => {
        label.textContent = role.label;
    });

    document.querySelectorAll('[data-requires]').forEach((element) => {
        const allowed = roleCan(element.dataset.requires);
        element.hidden = !allowed;
        element.classList.toggle('is-role-hidden', !allowed);
    });

    document.querySelectorAll('[data-nav-path]').forEach((element) => {
        const allowed = roleHasNav(element.dataset.navPath);
        element.hidden = !allowed;
        element.classList.toggle('is-role-hidden', !allowed);
    });

    document.querySelectorAll('[data-status-select]').forEach((select) => {
        const canEdit = roleCan('opportunity.status.edit');
        select.classList.toggle('is-readonly', !canEdit);
        const trigger = select.querySelector('[data-status-trigger]');
        if (trigger) {
            trigger.setAttribute('aria-disabled', canEdit ? 'false' : 'true');
            if (!canEdit) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        }
    });

    const moduleCountEl = document.querySelector('[data-module-count]');
    if (moduleCountEl) {
        const visibleModules = document.querySelectorAll('[data-overview-module]:not([hidden])').length;
        moduleCountEl.textContent = String(visibleModules);
    }

    closeStatusSelects();
    closeFilterDropdown();
    closeFormSelects();
    if (typeof closeRowMoreMenus === 'function') {
        closeRowMoreMenus();
    }
    if (typeof window.syncOpportunityListUi === 'function') {
        window.syncOpportunityListUi();
    }
    if (typeof window.syncOpportunityReviewUi === 'function') {
        window.syncOpportunityReviewUi();
    }
}

document.querySelectorAll('[data-role-switch]').forEach((button) => {
    button.addEventListener('click', () => {
        applyPreviewRole(button.dataset.roleSwitch);
    });
});

applyPreviewRole(getPreviewRole());

document.querySelectorAll('[data-search-input]').forEach((input) => {
    const clearBtn = input.parentElement.querySelector('[data-search-clear]');
    if (!clearBtn) {
        return;
    }

    const syncSearchClear = () => {
        clearBtn.hidden = input.value.length === 0;
    };

    input.addEventListener('input', () => {
        syncSearchClear();
        applyOpportunityFilters();
    });
    input.addEventListener('search', () => {
        syncSearchClear();
        applyOpportunityFilters();
    });
    clearBtn.addEventListener('click', () => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
    });
    syncSearchClear();
});

/* ---------- 新增商機：來源選項、自訂下拉、產品列、送出 ---------- */
function closeFormSelects(except) {
    document.querySelectorAll('[data-form-select].is-open').forEach((select) => {
        if (except && select === except) {
            return;
        }

        select.classList.remove('is-open');
        const trigger = select.querySelector('[data-form-select-trigger]');
        const menu = select._formMenu;
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
        if (menu) {
            menu.classList.remove('is-open');
            menu.hidden = true;
            menu.style.removeProperty('top');
            menu.style.removeProperty('left');
            menu.style.removeProperty('width');
            menu.style.removeProperty('min-width');
            menu.style.removeProperty('max-width');
            menu.style.removeProperty('position');
            if (menu._formOwner) {
                menu._formOwner.appendChild(menu);
            }
        }
    });
}

function positionFormMenu(trigger, menu) {
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const menuWidth = Math.round(rect.width);

    menu.style.position = 'fixed';
    menu.style.width = `${menuWidth}px`;
    menu.style.minWidth = `${menuWidth}px`;
    menu.style.maxWidth = `${menuWidth}px`;
    menu.style.left = '0px';
    menu.style.top = '0px';

    const menuHeight = menu.offsetHeight || 200;
    let top = rect.bottom + gap;
    let left = rect.left;

    if (top + menuHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - menuHeight - gap);
    }

    if (left + menuWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - menuWidth - 12);
    }

    if (left < 12) {
        left = 12;
    }

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
}

function setFormSelectValue(select, option) {
    const value = option.dataset.value || '';
    const label = option.dataset.label || value;
    const hidden = select.querySelector('[data-form-select-value]');
    const labelEl = select.querySelector('[data-form-select-label]');
    const trigger = select.querySelector('[data-form-select-trigger]');

    if (hidden) {
        hidden.value = value;
    }

    if (labelEl) {
        labelEl.textContent = label;
        labelEl.classList.toggle('is-placeholder', value === '');
    }

    if (trigger) {
        trigger.classList.remove('form-error');
    }

    const menu = select._formMenu;
    if (menu) {
        menu.querySelectorAll('[data-form-select-option]').forEach((item) => {
            item.classList.toggle('is-selected', item === option);
        });
    }
}

function bindFormSelect(select) {
    if (select.dataset.bound === 'true') {
        return;
    }

    const trigger = select.querySelector('[data-form-select-trigger]');
    const menu = select.querySelector('[data-form-select-menu]');

    if (!trigger || !menu) {
        return;
    }

    select.dataset.bound = 'true';
    menu._formOwner = select;
    select._formMenu = menu;

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (select.classList.contains('is-readonly')) {
            return;
        }

        const willOpen = !select.classList.contains('is-open');
        closeFormSelects();
        closeStatusSelects();
        closeFilterDropdown();

        if (!willOpen) {
            return;
        }

        document.body.appendChild(menu);
        menu.hidden = false;
        menu.classList.add('is-open');
        select.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        positionFormMenu(trigger, menu);
    });

    menu.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    menu.querySelectorAll('[data-form-select-option]').forEach((option) => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            setFormSelectValue(select, option);
            closeFormSelects();
        });
    });
}

function bindFormSelects(scope) {
    (scope || document).querySelectorAll('[data-form-select]').forEach(bindFormSelect);
}

document.querySelectorAll('[data-source-input]').forEach((input) => {
    const syncSource = () => {
        document.querySelectorAll('[data-source-input]').forEach((item) => {
            const option = item.closest('.source-option');
            if (option) {
                option.classList.toggle('is-selected', item.checked);
            }
        });
    };

    input.addEventListener('change', syncSource);
});

const productRows = document.querySelector('[data-product-rows]');
const productRowTemplate = document.querySelector('[data-product-row-template]');
const addProductBtn = document.querySelector('[data-add-product]');

function getOpportunityProductRows() {
    return productRows ? productRows.querySelectorAll('[data-product-row]') : [];
}

function syncProductRowRemoveButtons() {
    if (!productRows) {
        return;
    }

    const rows = getOpportunityProductRows();
    const canRemove = rows.length > 1;

    rows.forEach((row) => {
        const button = row.querySelector('[data-remove-product]');
        if (!button) {
            return;
        }

        button.hidden = !canRemove;
        button.disabled = !canRemove;
    });
}

if (addProductBtn && productRows && productRowTemplate) {
    addProductBtn.addEventListener('click', () => {
        const fragment = productRowTemplate.content.cloneNode(true);
        const row = fragment.querySelector('[data-product-row]');
        productRows.appendChild(fragment);
        if (row) {
            bindFormSelects(row);
            refreshIcons(row);
        }
        syncProductRowRemoveButtons();
    });

    productRows.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-product]');
        if (!button || button.hidden || button.disabled) {
            return;
        }

        const row = button.closest('[data-product-row]');
        if (!row || getOpportunityProductRows().length <= 1) {
            return;
        }

        closeFormSelects();
        row.remove();
        syncProductRowRemoveButtons();
    });

    syncProductRowRemoveButtons();
}

bindFormSelects();

/* ---------- 資源目錄：產品公告 / 行銷資源（分類、搜尋、分頁、下載回饋） ---------- */
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

function bindResourceCatalog(root) {
    if (!root) {
        return;
    }

    const pageSize = Number(root.dataset.pageSize || 8);
    const tabs = [...root.querySelectorAll('[data-catalog-tab]')];
    const rows = [...root.querySelectorAll('[data-catalog-row]')];
    const empty = root.querySelector('[data-catalog-empty]');
    const summary = root.querySelector('[data-catalog-summary]');
    const pagination = root.querySelector('[data-catalog-pagination]');
    const search = root.querySelector('[data-catalog-search]');
    const searchClear = search?.closest('label')?.querySelector('[data-search-clear]');
    let page = 1;

    function activeCategory() {
        return root.querySelector('[data-catalog-tab].is-active')?.dataset.catalogTab
            || tabs[0]?.dataset.catalogTab
            || '';
    }

    function matchedRows() {
        const category = activeCategory();
        const query = (search?.value || '').trim().toLowerCase();

        return rows.filter((row) => {
            const categoryOk = !category || row.dataset.category === category;
            const haystack = (row.dataset.search || row.textContent || '').toLowerCase();
            const searchOk = !query || haystack.includes(query);
            return categoryOk && searchOk;
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
            summary.textContent = total === 0
                ? 'Showing 0 of 0 results'
                : `Showing ${start + 1}-${Math.min(end, total)} of ${total} results`;
        }

        renderPagination(page, pages);
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((item) => {
                const active = item === tab;
                item.classList.toggle('is-active', active);
                item.setAttribute('aria-selected', active ? 'true' : 'false');
            });
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

    root.addEventListener('click', (event) => {
        const action = event.target.closest('[data-resource-action]');
        if (!action || !root.contains(action)) {
            return;
        }

        event.preventDefault();
        const kind = action.dataset.resourceAction;
        showAppToast(kind === 'link' ? '已開啟連結（示意）' : '已開始下載（示意）');
    });

    render();
}

document.querySelectorAll('[data-resource-catalog]').forEach(bindResourceCatalog);

function bindTrainingCenter(root) {
    const groups = [...root.querySelectorAll('[data-training-group]')];
    const links = [...root.querySelectorAll('[data-training-link]')];
    const panels = [...root.querySelectorAll('[data-training-panel]')];
    const crumb = document.querySelector('[data-training-crumb]');
    const mobileLabel = root.querySelector('[data-training-mobile-label]');
    const mobileToggle = root.querySelector('[data-training-mobile-toggle]');
    const treePanel = root.querySelector('[data-training-tree-panel]');
    const articleShell = root.querySelector('[data-training-article]');
    const prevBtn = root.querySelector('[data-training-prev]');
    const nextBtn = root.querySelector('[data-training-next]');
    const prevLabel = prevBtn?.querySelector('[data-training-nav-label]');
    const nextLabel = nextBtn?.querySelector('[data-training-nav-label]');

    const articles = links.map((link) => ({
        id: link.dataset.trainingLink,
        group: link.closest('[data-training-group]'),
        label: link.textContent.trim(),
        link,
    }));

    function syncGroupClip(group, open) {
        const clip = group.querySelector('.training-tree-children-clip');
        if (clip) {
            clip.inert = !open;
        }
    }

    function setOpenGroup(groupId) {
        groups.forEach((group) => {
            const open = group.dataset.trainingGroup === groupId;
            group.classList.toggle('is-open', open);
            syncGroupClip(group, open);
            const toggle = group.querySelector('[data-training-group-toggle]');
            if (toggle) {
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
        });
    }

    function updatePager(index) {
        const prev = articles[index - 1];
        const next = articles[index + 1];

        if (prevBtn) {
            prevBtn.hidden = !prev;
            if (prev) {
                prevBtn.dataset.target = prev.id;
                if (prevLabel) {
                    prevLabel.textContent = prev.label;
                }
            }
        }

        if (nextBtn) {
            nextBtn.hidden = !next;
            if (next) {
                nextBtn.dataset.target = next.id;
                if (nextLabel) {
                    nextLabel.textContent = next.label;
                }
            }
        }
    }

    function closeMobileTree() {
        treePanel?.classList.remove('is-mobile-open');
        mobileToggle?.setAttribute('aria-expanded', 'false');
    }

    function showArticle(id, { updateHash = true, scroll = false } = {}) {
        const article = articles.find((item) => item.id === id) || articles[0];
        if (!article) {
            return;
        }

        links.forEach((link) => {
            const active = link === article.link;
            link.classList.toggle('is-active', active);
            if (active) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        panels.forEach((panel) => {
            panel.hidden = panel.dataset.trainingPanel !== article.id;
        });

        if (article.group) {
            setOpenGroup(article.group.dataset.trainingGroup);
        }

        if (crumb) {
            crumb.textContent = article.label;
        }

        if (mobileLabel) {
            mobileLabel.textContent = article.label;
        }

        updatePager(articles.indexOf(article));
        closeMobileTree();

        if (updateHash) {
            history.replaceState(null, '', `#${article.id}`);
        }

        if (scroll && articleShell) {
            articleShell.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    groups.forEach((group) => {
        const toggle = group.querySelector('[data-training-group-toggle]');
        toggle?.addEventListener('click', () => {
            const alreadyOpen = group.classList.contains('is-open');
            if (alreadyOpen) {
                group.classList.remove('is-open');
                syncGroupClip(group, false);
                toggle.setAttribute('aria-expanded', 'false');
                return;
            }

            setOpenGroup(group.dataset.trainingGroup);
        });
    });

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            showArticle(link.dataset.trainingLink, { scroll: true });
        });
    });

    mobileToggle?.addEventListener('click', () => {
        const open = treePanel.classList.toggle('is-mobile-open');
        mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    prevBtn?.addEventListener('click', () => {
        if (prevBtn.dataset.target) {
            showArticle(prevBtn.dataset.target, { scroll: true });
        }
    });

    nextBtn?.addEventListener('click', () => {
        if (nextBtn.dataset.target) {
            showArticle(nextBtn.dataset.target, { scroll: true });
        }
    });

    const initial = (location.hash || '').replace('#', '');
    showArticle(initial || articles[0]?.id, { updateHash: Boolean(initial) });

    window.addEventListener('hashchange', () => {
        const id = location.hash.replace('#', '');
        if (id) {
            showArticle(id, { updateHash: false });
        }
    });
}

document.querySelectorAll('[data-training-center]').forEach(bindTrainingCenter);

window.upasApp = {
    roleCan,
    getPreviewRole,
    applyPreviewRole,
    refreshIcons,
    closeFormSelects,
    closeStatusSelects,
    closeFilterDropdown,
    setFormSelectValue,
    bindFormSelects,
    productRows,
    productRowTemplate,
    syncProductRowRemoveButtons,
    applyOpportunityFilters,
    showAppToast,
};

import('./opportunity-flow.js');

