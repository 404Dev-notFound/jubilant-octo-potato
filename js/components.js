// Reusable UI Components and Utilities
window.UI = {
    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        let icon = 'info', colorClass = 'text-primary border-primary/50 bg-primary/10';
        if (type === 'success') { icon = 'check_circle'; colorClass = 'text-tertiary border-tertiary/50 bg-tertiary/10'; } 
        else if (type === 'error') { icon = 'error'; colorClass = 'text-error border-error/50 bg-error/10'; }
        toast.className = `glass-panel px-md py-sm rounded-lg flex items-center gap-sm transform transition-all duration-300 translate-x-[120%] ${colorClass}`;
        toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span><span class="font-label-md">${message}</span>`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove('translate-x-[120%]'));
        setTimeout(() => { toast.classList.add('translate-x-[120%]'); setTimeout(() => toast.remove(), 300); }, 3000);
    },
    
    openModal: (contentHTML) => {
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!container || !content) return;
        content.innerHTML = contentHTML;
        container.classList.remove('pointer-events-none', 'opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    },

    closeModal: () => {
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!container) return;
        container.classList.add('pointer-events-none', 'opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => content.innerHTML = '', 300);
    },
    
    createSkeleton: (width='w-full', height='h-24') => {
        return `<div class="${width} ${height} rounded-xl bg-surface-container-high animate-pulse border border-white/5"></div>`;
    },

    escapeHtml: (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    openContactAdmin: async (options = {}) => {
        try {
            const module = await import(`./forms/contact_admin_modal.js?t=${Date.now()}`);
            const html = module.render_contact_admin_modal(options);
            window.UI.openModal(html);
        } catch (err) {
            console.error('Failed to load contact admin modal:', err);
            window.UI.showToast('Contact administrator at scriptedbydev@gmail.com', 'info');
        }
    }
};

// Expose escapeHtml and openContactAdmin directly on window object as global utilities
window.escapeHtml = window.UI.escapeHtml;
window.openContactAdmin = window.UI.openContactAdmin;

// Global Listeners for Modal & Contact Admin
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') || e.target.closest('[data-close-modal]')) {
        window.UI.closeModal();
        return;
    }

    const contactAdminBtn = e.target.closest('[data-contact-admin]');
    if (contactAdminBtn) {
        e.preventDefault();
        const context = contactAdminBtn.getAttribute('data-contact-admin') || 'general';
        const title = contactAdminBtn.getAttribute('data-title') || null;
        const message = contactAdminBtn.getAttribute('data-message') || null;
        window.UI.openContactAdmin({ context, title, message });
    }
});