/* 商機／技術中心：指定收件信箱。只保存設定，不寄信。 */

const STORAGE_KEY = 'upas-notify-mailboxes';

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

function readMailboxes() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function writeMailbox(scope, value) {
    const all = readMailboxes();
    all[scope] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function normalizeMailboxList(raw) {
    const emails = String(raw || '')
        .split(/[,，\n]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    const invalid = emails.filter((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));

    return {
        emails,
        invalid,
        value: emails.join(', '),
    };
}

function bindNotifyMailbox(modal) {
    const scope = modal.dataset.notifyMailboxModal || '';
    if (!scope) {
        return;
    }

    const input = modal.querySelector('[data-notify-mailbox-input]');
    const openers = document.querySelectorAll(`[data-notify-mailbox-open="${scope}"]`);
    let lastFocus = null;

    const close = () => {
        if (modal.hidden) {
            return;
        }
        modal.classList.remove('is-open');
        window.setTimeout(() => {
            modal.hidden = true;
        }, 200);
        if (lastFocus && document.contains(lastFocus)) {
            lastFocus.focus();
        }
        lastFocus = null;
    };

    const open = (trigger) => {
        const stored = readMailboxes();
        if (input) {
            input.value = String(stored[scope] || '');
            input.classList.remove('form-error');
        }
        lastFocus = trigger || null;
        modal.hidden = false;
        requestAnimationFrame(() => {
            modal.classList.add('is-open');
        });
        refreshIcons(modal);
        input?.focus();
    };

    openers.forEach((button) => {
        button.addEventListener('click', () => open(button));
    });

    modal.addEventListener('click', (event) => {
        if (event.target.closest('[data-notify-mailbox-dismiss]')) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            close();
        }
    });

    modal.querySelector('[data-notify-mailbox-save]')?.addEventListener('click', () => {
        const parsed = normalizeMailboxList(input?.value || '');
        if (parsed.invalid.length > 0) {
            input?.classList.add('form-error');
            showToast('請輸入有效的信箱。多組信箱請以逗點空格分隔。', 'error');
            input?.focus();
            return;
        }

        writeMailbox(scope, parsed.value);
        if (input) {
            input.value = parsed.value;
            input.classList.remove('form-error');
        }
        showToast(parsed.value ? '已儲存收件信箱' : '已清除收件信箱');
        close();
    });

    input?.addEventListener('input', () => {
        input.classList.remove('form-error');
    });
}

document.querySelectorAll('[data-notify-mailbox-modal]').forEach(bindNotifyMailbox);
