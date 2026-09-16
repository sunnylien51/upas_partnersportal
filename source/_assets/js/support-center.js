const STORAGE_KEY = 'upas-support-tickets';

function app() {
    return window.upasApp || {};
}

function showToast(message, tone = 'default') {
    if (typeof app().showAppToast === 'function') {
        app().showAppToast(message, tone);
        return;
    }
    window.alert(message);
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

function readJson(id) {
    const el = document.getElementById(id);
    if (!el) {
        return null;
    }
    try {
        return JSON.parse(el.textContent);
    } catch (error) {
        console.warn('Unable to parse support data', error);
        return null;
    }
}

function readStoredTickets() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function writeStoredTickets(tickets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

/* 種子工單原本只在 Blade 輸出，管理者改過之後也寫進 store 當覆寫 */
function upsertStoredTicket(ticket) {
    const id = String(ticket?.id || '');
    if (!id) {
        return;
    }
    const tickets = readStoredTickets();
    const index = tickets.findIndex((item) => String(item?.id || '') === id);
    if (index >= 0) {
        tickets[index] = { ...tickets[index], ...ticket };
    } else {
        tickets.push(ticket);
    }
    writeStoredTickets(tickets);
}

function formatDateTime(date = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextTicketId(existing) {
    let max = 2600;
    existing.forEach((ticket) => {
        const match = String(ticket.id || '').match(/TKT-(\d+)/i);
        if (match) {
            max = Math.max(max, Number(match[1]));
        }
    });
    return `TKT-${max + 1}`;
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
}

function bindFaqAccordion(root) {
    if (root.dataset.faqAccordionBound === 'true') {
        return;
    }
    root.dataset.faqAccordionBound = 'true';
    root.addEventListener('click', (event) => {
        if (event.target.closest('[data-faq-admin]')) {
            return;
        }
        const trigger = event.target.closest('[data-faq-trigger]');
        if (!trigger || !root.contains(trigger)) {
            return;
        }
        const item = trigger.closest('[data-faq-item]');
        if (!item) {
            return;
        }
        const open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
}

function bindTicketModal(meta, { onSave } = {}) {
    const modal = document.querySelector('[data-ticket-modal]');
    if (!modal) {
        return null;
    }

    const statuses = meta.statuses || {};
    const ticketTypes = meta.ticketTypes || {};
    const seed = meta.tickets || [];
    const capability = meta.capability || 'support.manage';
    const noteSection = modal.querySelector('[data-ticket-modal-note-section]');
    const manageSection = modal.querySelector('[data-ticket-manage]');
    const saveBtn = modal.querySelector('[data-ticket-manage-save]');
    const statusSelect = modal.querySelector('[data-ticket-manage-status]');
    const assigneeInput = modal.querySelector('[data-ticket-manage-assignee]');
    const noteInput = modal.querySelector('[data-ticket-manage-note]');
    let lastFocus = null;
    let currentId = '';

    const canManage = () => typeof app().roleCan !== 'function' || app().roleCan(capability);

    /* 管理者看可編輯表單，一般使用者看唯讀處理說明，兩者不同時出現 */
    const syncManageView = () => {
        const allowed = canManage();
        if (manageSection) manageSection.hidden = !allowed;
        if (saveBtn) saveBtn.hidden = !allowed;
        if (noteSection) noteSection.hidden = allowed;
    };

    const setStatusValue = (value) => {
        if (!statusSelect) {
            return;
        }
        const menu = statusSelect._formMenu || statusSelect.querySelector('[data-form-select-menu]');
        const option = menu?.querySelector(`[data-form-select-option][data-value="${CSS.escape(String(value))}"]`);
        if (option && typeof app().setFormSelectValue === 'function') {
            app().setFormSelectValue(statusSelect, option);
        }
    };

    const setText = (selector, value) => {
        const el = modal.querySelector(selector);
        if (el) {
            el.textContent = value;
        }
    };

    const syncUrl = (id) => {
        const url = new URL(window.location.href);
        if (id) {
            url.searchParams.set('ticket', id);
        } else {
            url.searchParams.delete('ticket');
        }
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const find = (id) => {
        if (!id) {
            return null;
        }
        const stored = readStoredTickets();
        return stored.find((item) => item?.id === id) || seed.find((item) => item?.id === id) || null;
    };

    const close = () => {
        if (modal.hidden) {
            return;
        }
        modal.classList.remove('is-open');
        window.setTimeout(() => {
            modal.hidden = true;
        }, 200);
        syncUrl('');
        if (lastFocus && document.contains(lastFocus)) {
            lastFocus.focus();
        }
        lastFocus = null;
    };

    const open = (id, trigger) => {
        const ticket = find(id);
        if (!ticket) {
            showToast('找不到這張工單', 'error');
            return false;
        }

        const status = statuses[ticket.status] || { value: ticket.status || 'open', label: ticket.status || '未處理' };

        setText('[data-ticket-modal-id]', ticket.id);
        setText('[data-ticket-modal-subject]', ticket.subject || '—');
        setText('[data-ticket-modal-customer]', ticket.customer || '—');
        setText('[data-ticket-modal-product]', ticket.product || '—');
        setText('[data-ticket-modal-type]', ticketTypes[ticket.type] || ticket.type || '—');
        setText('[data-ticket-modal-contact]', ticket.contact || '—');
        setText('[data-ticket-modal-assignee]', ticket.assignee || '尚未指派');
        setText('[data-ticket-modal-created]', ticket.createdAt || '—');
        setText('[data-ticket-modal-updated]', ticket.updatedAt || ticket.updated || '—');
        setText('[data-ticket-modal-description]', ticket.description || '—');
        setText('[data-ticket-modal-note]', String(ticket.note || '').trim() || '—');

        const pill = modal.querySelector('[data-ticket-modal-status-pill]');
        if (pill) {
            pill.className = `status-pill status-${status.value}`;
            pill.textContent = status.label;
        }

        const attachmentSection = modal.querySelector('[data-ticket-modal-attachment-section]');
        if (attachmentSection) {
            const attachment = ticket.attachment;
            attachmentSection.hidden = !attachment?.name;
            if (attachment?.name) {
                setText('[data-ticket-modal-attachment-name]', attachment.name);
                setText('[data-ticket-modal-attachment-meta]', attachment.sizeLabel || formatFileSize(attachment.size) || attachment.type || '');
                const link = modal.querySelector('[data-ticket-modal-attachment-link]');
                if (link) {
                    link.href = attachment.url || '#';
                    link.setAttribute('aria-label', `查看或下載 ${attachment.name}`);
                }
            }
        }

        currentId = ticket.id;
        if (assigneeInput) assigneeInput.value = ticket.assignee || '';
        if (noteInput) noteInput.value = String(ticket.note || '');
        setStatusValue(status.value);
        syncManageView();

        lastFocus = trigger || null;
        modal.hidden = false;
        requestAnimationFrame(() => {
            modal.classList.add('is-open');
        });
        refreshIcons(modal);
        modal.querySelector('.ticket-modal-body')?.scrollTo({ top: 0 });
        modal.querySelector('button[data-ticket-modal-dismiss]')?.focus();
        syncUrl(ticket.id);
        return true;
    };

    modal.addEventListener('click', (event) => {
        if (event.target.closest('[data-ticket-modal-dismiss]')) {
            close();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            close();
        }
    });

    saveBtn?.addEventListener('click', () => {
        if (!canManage()) {
            showToast('目前身分權限無法處理工單', 'error');
            return;
        }

        const ticket = find(currentId);
        if (!ticket) {
            showToast('找不到這張工單', 'error');
            return;
        }

        const note = noteInput?.value.trim() || '';
        if (!note) {
            noteInput?.classList.add('form-error');
            noteInput?.focus();
            showToast('請輸入回覆建單人的內容', 'error');
            return;
        }
        noteInput?.classList.remove('form-error');

        const next = {
            ...ticket,
            status: statusSelect?.querySelector('[data-form-select-value]')?.value || ticket.status || 'open',
            assignee: assigneeInput?.value.trim() || '',
            note,
            updatedAt: formatDateTime(),
            updated: '剛剛',
        };

        upsertStoredTicket(next);
        onSave?.(next);

        /* 同步彈窗上的唯讀欄位，讓管理者當下就看到結果 */
        const nextStatus = statuses[next.status] || { value: next.status, label: next.status };
        const pill = modal.querySelector('[data-ticket-modal-status-pill]');
        if (pill) {
            pill.className = `status-pill status-${nextStatus.value}`;
            pill.textContent = nextStatus.label;
        }
        setText('[data-ticket-modal-assignee]', next.assignee || '尚未指派');
        setText('[data-ticket-modal-updated]', next.updatedAt);
        setText('[data-ticket-modal-note]', next.note || '—');

        showToast('已更新工單處理結果', 'success');
    });

    document.addEventListener('upas:rolechange', () => {
        if (!modal.hidden) {
            syncManageView();
        }
    });

    return { open, close };
}

function bindSupportCenter(root) {
    const meta = readJson('support-center-data') || {};
    const statuses = meta.statuses || {};
    const search = root.querySelector('[data-support-search]');
    const searchClear = search?.closest('label')?.querySelector('[data-search-clear]');
    const faqEmpty = root.querySelector('[data-faq-empty]');
    const faqSummary = root.querySelector('[data-faq-summary]');
    const faqPagination = root.querySelector('[data-faq-pagination]');
    const faqItems = () => [...root.querySelectorAll('[data-faq-item]')];
    const ticketRowsWrap = root.querySelector('[data-ticket-rows]');
    const ticketEmpty = root.querySelector('[data-ticket-empty]');
    const ticketSummary = root.querySelector('[data-ticket-summary]');
    const ticketPagination = root.querySelector('[data-ticket-pagination]');
    const template = document.querySelector('[data-ticket-row-template]');
    const seedIds = new Set([...root.querySelectorAll('[data-ticket-row]')].map((row) => row.dataset.ticketId));
    const faqFilters = { type: 'all', module: 'all' };
    const faqPageSize = Number(root.dataset.faqPageSize || 5);
    const ticketPageSize = Number(root.dataset.ticketPageSize || 5);
    let faqPage = 1;
    let ticketPage = 1;

    bindFaqAccordion(root);

    function query() {
        return (search?.value || '').trim().toLowerCase();
    }

    function closeFaqItem(item) {
        item.classList.remove('is-open');
        item.querySelector('[data-faq-trigger]')?.setAttribute('aria-expanded', 'false');
    }

    function matchedFaqItems() {
        const keyword = query();

        return faqItems().filter((item) => {
            const typeOk = faqFilters.type === 'all' || item.dataset.type === faqFilters.type;
            const moduleOk = faqFilters.module === 'all' || item.dataset.module === faqFilters.module;
            const haystack = (item.dataset.search || item.textContent || '').toLowerCase();
            return typeOk && moduleOk && (!keyword || haystack.includes(keyword));
        });
    }

    function renderFaqPagination(current, pages) {
        if (!faqPagination) {
            return;
        }

        faqPagination.replaceChildren();

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
                    faqPage = target;
                    applyFaqFilter();
                });
            }
            faqPagination.appendChild(btn);
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

        refreshIcons(faqPagination);
    }

    function applyFaqFilter() {
        const matched = matchedFaqItems();
        const total = matched.length;
        const pages = Math.max(1, Math.ceil(total / faqPageSize) || 1);
        if (faqPage > pages) {
            faqPage = pages;
        }

        const start = total === 0 ? 0 : (faqPage - 1) * faqPageSize;
        const end = start + faqPageSize;

        faqItems().forEach((item) => {
            item.hidden = true;
            closeFaqItem(item);
        });
        matched.forEach((item, index) => {
            const show = index >= start && index < end;
            item.hidden = !show;
            if (!show) {
                closeFaqItem(item);
            }
        });

        if (faqEmpty) {
            const allCount = faqItems().length;
            faqEmpty.hidden = total > 0;
            faqEmpty.textContent = allCount === 0 ? '尚無 FAQ' : '沒有符合條件的 FAQ';
        }

        if (faqSummary) {
            faqSummary.textContent = total === 0
                ? 'Showing 0 of 0 results'
                : `Showing ${start + 1}-${Math.min(end, total)} of ${total} results`;
        }

        renderFaqPagination(faqPage, pages);
    }

    function applyTicketFilter() {
        const rows = [...root.querySelectorAll('[data-ticket-row]')];
        const total = rows.length;
        const pages = Math.max(1, Math.ceil(total / ticketPageSize) || 1);
        if (ticketPage > pages) {
            ticketPage = pages;
        }

        const start = total === 0 ? 0 : (ticketPage - 1) * ticketPageSize;
        const end = start + ticketPageSize;

        rows.forEach((row, index) => {
            row.hidden = !(index >= start && index < end);
        });

        if (ticketEmpty) {
            ticketEmpty.hidden = total > 0;
        }

        if (ticketSummary) {
            ticketSummary.textContent = total === 0
                ? 'Showing 0 of 0 results'
                : `Showing ${start + 1}-${Math.min(end, total)} of ${total} results`;
        }

        if (ticketPagination) {
            ticketPagination.replaceChildren();

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
                        ticketPage = target;
                        applyTicketFilter();
                    });
                }
                ticketPagination.appendChild(btn);
            };

            appendBtn({
                icon: 'chevron-left',
                target: ticketPage - 1,
                disabled: ticketPage <= 1,
                aria: '上一頁',
            });

            for (let index = 1; index <= pages; index += 1) {
                appendBtn({
                    label: String(index),
                    target: index,
                    active: index === ticketPage,
                });
            }

            appendBtn({
                icon: 'chevron-right',
                target: ticketPage + 1,
                disabled: ticketPage >= pages,
                last: true,
                aria: '下一頁',
            });

            refreshIcons(ticketPagination);
        }
    }

    function applyFilters() {
        applyFaqFilter();
        applyTicketFilter();
    }

    /* 種子列與樣板列共用：種子列沒有的欄位選擇器會自動略過 */
    function fillTicketRow(row, ticket) {
        const status = statuses[ticket.status] || { value: ticket.status, label: ticket.status };
        row.dataset.ticketId = ticket.id;
        row.dataset.status = ticket.status || 'open';
        row.dataset.search = [
            ticket.id,
            ticket.customer,
            ticket.subject,
            ticket.assignee || '尚未指派',
            status.label,
        ].join(' ');

        const set = (selector, value) => {
            const el = row.querySelector(selector);
            if (el) {
                el.textContent = value;
            }
        };

        set('[data-ticket-id-text]', ticket.id);
        set('[data-ticket-customer]', ticket.customer || '—');
        set('[data-ticket-subject]', ticket.subject || '—');
        set('[data-ticket-updated]', ticket.updated || '剛剛');
        set('[data-ticket-assignee]', ticket.assignee || '尚未指派');

        row.setAttribute('aria-label', `檢視工單 ${ticket.id}`);

        const statusEl = row.querySelector('[data-ticket-status]');
        if (statusEl) {
            statusEl.className = `status-pill status-${status.value}`;
            statusEl.textContent = status.label;
        }
    }

    function ticketRow(id) {
        return root.querySelector(`[data-ticket-row][data-ticket-id="${CSS.escape(String(id))}"]`);
    }

    function mountStoredTickets() {
        if (!ticketRowsWrap || !template) {
            return;
        }

        readStoredTickets().forEach((ticket) => {
            if (!ticket?.id) {
                return;
            }

            /* 管理者改過的種子工單只要更新既有列，新開的工單才補一列 */
            if (seedIds.has(ticket.id)) {
                const row = ticketRow(ticket.id);
                if (row) {
                    fillTicketRow(row, ticket);
                }
                return;
            }

            const fragment = template.content.cloneNode(true);
            const row = fragment.querySelector('[data-ticket-row]');
            if (!row) {
                return;
            }

            fillTicketRow(row, ticket);
            seedIds.add(ticket.id);
            ticketRowsWrap.prepend(row);
        });

        refreshIcons(ticketRowsWrap);
    }

    root.querySelectorAll('[data-faq-filter]').forEach((select) => {
        const group = select.dataset.faqFilter;
        const hidden = select.querySelector('[data-form-select-value]');
        faqFilters[group] = hidden?.value || 'all';
        hidden?.addEventListener('change', () => {
            faqFilters[group] = hidden.value || 'all';
            faqPage = 1;
            applyFaqFilter();
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
            faqPage = 1;
            applyFaqFilter();
        });
        search.addEventListener('search', () => {
            syncClear();
            faqPage = 1;
            applyFaqFilter();
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
        showToast(action.dataset.resourceAction === 'link' ? '已開啟連結（示意）' : '已開始下載（示意）');
    });

    const ticketModal = bindTicketModal(meta, {
        onSave: (ticket) => {
            const row = ticketRow(ticket.id);
            if (row) {
                fillTicketRow(row, ticket);
                refreshIcons(row);
            }
            applyTicketFilter();
        },
    });

    if (ticketModal) {
        const openFromRow = (row, trigger) => {
            const id = row?.dataset.ticketId || '';
            if (!id) {
                return;
            }
            ticketModal.open(id, trigger || row);
        };

        root.addEventListener('click', (event) => {
            const row = event.target.closest('[data-ticket-row][data-ticket-open]');
            if (!row || !root.contains(row)) {
                return;
            }
            event.preventDefault();
            openFromRow(row, event.target.closest('[data-ticket-open]') || row);
        });

        root.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }
            const row = event.target.closest('[data-ticket-row][data-ticket-open]');
            if (!row || !root.contains(row) || event.target !== row) {
                return;
            }
            event.preventDefault();
            openFromRow(row, row);
        });
    }

    mountStoredTickets();
    applyFilters();

    const requestedTicket = new URLSearchParams(window.location.search).get('ticket');
    if (requestedTicket && ticketModal) {
        ticketModal.open(requestedTicket);
    }

    root._applyFaqFilter = applyFaqFilter;
    document.addEventListener('upas:faqs-updated', applyFaqFilter);
}

function bindVersionHelpModal() {
    const modal = document.querySelector('[data-version-help-modal]');
    const openBtn = document.querySelector('[data-version-help-open]');
    if (!modal || !openBtn) {
        return;
    }

    const open = () => {
        modal.hidden = false;
        requestAnimationFrame(() => {
            modal.classList.add('is-open');
        });
        refreshIcons(modal);
    };

    const close = () => {
        modal.classList.remove('is-open');
        window.setTimeout(() => {
            modal.hidden = true;
        }, 200);
    };

    openBtn.addEventListener('click', open);
    modal.addEventListener('click', (event) => {
        if (event.target.closest('[data-version-help-dismiss]')) {
            close();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            close();
        }
    });
}

function bindTicketForm(form) {
    bindFileUpload(form.querySelector('[data-file-upload]'));
    bindVersionHelpModal();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        form.querySelectorAll('.form-error').forEach((el) => el.classList.remove('form-error'));

        const requiredFields = [...form.querySelectorAll('input[required], textarea[required]')];
        let valid = true;

        requiredFields.forEach((field) => {
            if (String(field.value || '').trim()) {
                return;
            }
            valid = false;
            const select = field.closest('[data-form-select]');
            if (select) {
                select.querySelector('[data-form-select-trigger]')?.classList.add('form-error');
                return;
            }
            field.classList.add('form-error');
        });

        if (!valid) {
            showToast('請完整填寫必填欄位', 'error');
            form.querySelector('.form-error')?.focus?.();
            return;
        }

        const seed = readJson('support-ticket-catalog')?.tickets || [];
        const stored = readStoredTickets();
        const existing = [...seed, ...stored];
        const now = new Date();
        const id = nextTicketId(existing);
        const attachmentName = form.querySelector('[data-file-name]')?.value || '';
        const ticket = {
            id,
            customer: form.querySelector('[name="customer"]')?.value.trim() || '',
            product: form.querySelector('[name="product"]')?.value.trim() || '',
            subject: form.querySelector('[name="subject"]')?.value.trim() || '',
            type: form.querySelector('[name="type"]')?.value || '',
            contact: form.querySelector('[name="contact"]')?.value.trim() || '',
            description: form.querySelector('[name="description"]')?.value.trim() || '',
            status: 'open',
            assignee: '',
            updated: '剛剛',
            updatedAt: formatDateTime(now),
            createdAt: formatDateTime(now),
            note: '',
            attachment: attachmentName
                ? {
                    name: attachmentName,
                    size: Number(form.querySelector('[data-file-size]')?.value || 0),
                    type: form.querySelector('[data-file-type]')?.value || '',
                    sizeLabel: formatFileSize(form.querySelector('[data-file-size]')?.value),
                }
                : null,
        };

        writeStoredTickets([ticket, ...stored]);
        showToast('已建立技術工單');

        const listUrl = form.dataset.listUrl || '/support/';
        const base = listUrl.endsWith('/') ? listUrl : `${listUrl}/`;
        window.setTimeout(() => {
            window.location.href = `${base}?ticket=${encodeURIComponent(id)}`;
        }, 450);
    });
}

function bindTicketPage(page) {
    const listUrl = page.dataset.listUrl || '/support/';
    const base = listUrl.endsWith('/') ? listUrl : `${listUrl}/`;
    const id = new URLSearchParams(window.location.search).get('id') || '';
    window.location.replace(id ? `${base}?ticket=${encodeURIComponent(id)}` : base);
}

document.querySelectorAll('[data-support-center]').forEach(bindSupportCenter);
document.querySelectorAll('[data-support-ticket-form]').forEach(bindTicketForm);
document.querySelectorAll('[data-support-ticket-page]').forEach(bindTicketPage);
