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
