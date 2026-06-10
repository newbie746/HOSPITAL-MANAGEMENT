/* ==========================================================
   Shared Helpers - Utilities, Dropdowns, Modals, Notifications
   ========================================================== */

function esc(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function populatePatientDropdown(selectId) {
    const result = db.exec("SELECT p.id, u.name FROM patients p JOIN users u ON p.user_id = u.id ORDER BY u.name");
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">Select Patient</option>';
    if (result.length > 0) {
        result[0].values.forEach(r => {
            sel.innerHTML += `<option value="${r[0]}">${esc(r[1])}</option>`;
        });
    }
}

function populateDoctorDropdown(selectId) {
    const result = db.exec("SELECT d.id, u.name, d.specialization FROM doctors d JOIN users u ON d.user_id = u.id ORDER BY u.name");
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">Select Doctor</option>';
    if (result.length > 0) {
        result[0].values.forEach(r => {
            sel.innerHTML += `<option value="${r[0]}">${esc(r[1])} (${esc(r[2])})</option>`;
        });
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    const icon = iconMap[type] || 'fa-info-circle';
    container.innerHTML = `<div class="alert alert-${type}"><i class="fas ${icon}"></i> ${esc(message)}</div>`;
    setTimeout(() => container.innerHTML = '', 4000);
}

function showNotification(message, type, duration) {
    type = type || 'success';
    duration = duration || 4000;

    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
        success: 'fa-check-circle',
        error:   'fa-times-circle',
        info:    'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    const icon = iconMap[type] || 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${esc(message)}</span>
        <button class="toast-close" onclick="dismissToast(this)"><i class="fas fa-times"></i></button>
        <div class="toast-progress" style="animation-duration:${duration}ms"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function dismissToast(btn) {
    const toast = btn.closest('.toast');
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
}

// ============================================================
//  EVENT LISTENERS - set up once the DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('regRole').addEventListener('change', function () {
        document.getElementById('regSpecializationGroup').style.display =
            this.value === 'doctor' ? 'block' : 'none';
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) this.classList.remove('active');
        });
    });

    initDB().then(() => {
        console.log('HMS Database initialized');
    }).catch(err => {
        console.error('DB init error:', err);
        alert('Failed to initialize database: ' + err.message);
    });
});
