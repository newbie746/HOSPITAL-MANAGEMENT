/* ==========================================================
   Dashboard - Navigation & Stats
   ========================================================== */

function setupDashboard() {
    document.getElementById('userName').textContent = esc(currentUser.name);
    const sidebarNav = document.getElementById('sidebarNav');
    let navHTML = '';

    if (currentUser.role === 'admin') {
        document.getElementById('sidebarRole').textContent = 'Admin Panel';
        navHTML = `
            <a class="active" onclick="switchPanel('Dashboard')"><span class="icon"><i class="fas fa-chart-pie"></i></span> Dashboard</a>
            <a onclick="switchPanel('Doctors')"><span class="icon"><i class="fas fa-user-md"></i></span> Doctors</a>
            <a onclick="switchPanel('Patients')"><span class="icon"><i class="fas fa-users"></i></span> Patients</a>
            <a onclick="switchPanel('Appointments')"><span class="icon"><i class="fas fa-calendar-check"></i></span> Appointments</a>
            <a onclick="switchPanel('Records')"><span class="icon"><i class="fas fa-file-medical"></i></span> Medical Records</a>
            <a onclick="switchPanel('Users')"><span class="icon"><i class="fas fa-user-cog"></i></span> All Users</a>
        `;
    } else if (currentUser.role === 'doctor') {
        document.getElementById('sidebarRole').textContent = 'Doctor Panel';
        navHTML = `
            <a class="active" onclick="switchPanel('Dashboard')"><span class="icon"><i class="fas fa-chart-pie"></i></span> Dashboard</a>
            <a onclick="switchPanel('Patients')"><span class="icon"><i class="fas fa-users"></i></span> My Patients</a>
            <a onclick="switchPanel('Appointments')"><span class="icon"><i class="fas fa-calendar-check"></i></span> My Appointments</a>
            <a onclick="switchPanel('Records')"><span class="icon"><i class="fas fa-file-medical"></i></span> Medical Records</a>
        `;
    } else {
        document.getElementById('sidebarRole').textContent = 'Patient Portal';
        navHTML = `
            <a class="active" onclick="switchPanel('Dashboard')"><span class="icon"><i class="fas fa-chart-pie"></i></span> Dashboard</a>
            <a onclick="switchPanel('Appointments')"><span class="icon"><i class="fas fa-calendar-check"></i></span> My Appointments</a>
            <a onclick="switchPanel('Records')"><span class="icon"><i class="fas fa-file-medical"></i></span> My Records</a>
            <a onclick="switchPanel('Profile')"><span class="icon"><i class="fas fa-id-card"></i></span> My Profile</a>
        `;
    }

    sidebarNav.innerHTML = navHTML;
    switchPanel('Dashboard');
}

function switchPanel(name) {
    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        if (a.textContent.trim().includes(name) ||
            (name === 'Dashboard' && a.textContent.includes('Dashboard')) ||
            (name === 'Records' && a.textContent.includes('Records'))) {
            a.classList.add('active');
        }
    });

    document.getElementById('pageTitle').textContent = name;

    switch (name) {
        case 'Dashboard':
            document.getElementById('panelDashboard').classList.add('active');
            loadDashboard();
            break;
        case 'Doctors':
            document.getElementById('panelDoctors').classList.add('active');
            loadDoctors();
            break;
        case 'Patients':
            document.getElementById('panelPatients').classList.add('active');
            loadPatients();
            break;
        case 'Appointments':
            document.getElementById('panelAppointments').classList.add('active');
            loadAppointments();
            break;
        case 'Records':
            document.getElementById('panelRecords').classList.add('active');
            loadRecords();
            break;
        case 'Users':
            document.getElementById('panelUsers').classList.add('active');
            loadUsers();
            break;
        case 'Profile':
            document.getElementById('panelProfile').classList.add('active');
            loadProfile();
            break;
    }
}

function loadDashboard() {
    const stats = document.getElementById('statsGrid');
    let html = '';

    if (currentUser.role === 'admin') {
        const docs    = db.exec("SELECT COUNT(*) FROM doctors")[0].values[0][0];
        const pats    = db.exec("SELECT COUNT(*) FROM patients")[0].values[0][0];
        const apps    = db.exec("SELECT COUNT(*) FROM appointments")[0].values[0][0];
        const pending = db.exec("SELECT COUNT(*) FROM appointments WHERE status='Pending'")[0].values[0][0];
        html = `
            <div class="stat-card">
                <div class="stat-icon icon-doctors"><i class="fas fa-user-md"></i></div>
                <div class="stat-details"><div class="stat-number">${docs}</div><div class="stat-label">Doctors</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-patients"><i class="fas fa-users"></i></div>
                <div class="stat-details"><div class="stat-number">${pats}</div><div class="stat-label">Patients</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-appointments"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-details"><div class="stat-number">${apps}</div><div class="stat-label">Appointments</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-pending"><i class="fas fa-hourglass-half"></i></div>
                <div class="stat-details"><div class="stat-number">${pending}</div><div class="stat-label">Pending</div></div>
            </div>
        `;
    } else if (currentUser.role === 'doctor') {
        const myApps    = db.exec("SELECT COUNT(*) FROM appointments WHERE doctor_id=?", [currentUser.doctorId]);
        const total     = myApps.length > 0 ? myApps[0].values[0][0] : 0;
        const myPending = db.exec("SELECT COUNT(*) FROM appointments WHERE doctor_id=? AND status='Pending'", [currentUser.doctorId]);
        const pend      = myPending.length > 0 ? myPending[0].values[0][0] : 0;
        const myPats    = db.exec("SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id=?", [currentUser.doctorId]);
        const patCount  = myPats.length > 0 ? myPats[0].values[0][0] : 0;
        html = `
            <div class="stat-card">
                <div class="stat-icon icon-appointments"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-details"><div class="stat-number">${total}</div><div class="stat-label">My Appointments</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-pending"><i class="fas fa-hourglass-half"></i></div>
                <div class="stat-details"><div class="stat-number">${pend}</div><div class="stat-label">Pending</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-patients"><i class="fas fa-users"></i></div>
                <div class="stat-details"><div class="stat-number">${patCount}</div><div class="stat-label">My Patients</div></div>
            </div>
        `;
    } else {
        const myApps = db.exec("SELECT COUNT(*) FROM appointments WHERE patient_id=?", [currentUser.patientId]);
        const total  = myApps.length > 0 ? myApps[0].values[0][0] : 0;
        const myRecs = db.exec("SELECT COUNT(*) FROM medical_records WHERE patient_id=?", [currentUser.patientId]);
        const recs   = myRecs.length > 0 ? myRecs[0].values[0][0] : 0;
        html = `
            <div class="stat-card">
                <div class="stat-icon icon-appointments"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-details"><div class="stat-number">${total}</div><div class="stat-label">My Appointments</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon icon-records"><i class="fas fa-file-medical"></i></div>
                <div class="stat-details"><div class="stat-number">${recs}</div><div class="stat-label">Medical Records</div></div>
            </div>
        `;
    }
    stats.innerHTML = html;

    loadRecentAppointments();
}

function loadRecentAppointments() {
    let query = `
        SELECT a.id, u_p.name, u_d.name, a.appointment_date, a.status
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u_p ON p.user_id = u_p.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u_d ON d.user_id = u_d.id
    `;
    const params = [];
    if (currentUser.role === 'doctor') {
        query += " WHERE a.doctor_id = ?";
        params.push(currentUser.doctorId);
    } else if (currentUser.role === 'patient') {
        query += " WHERE a.patient_id = ?";
        params.push(currentUser.patientId);
    }
    query += " ORDER BY a.appointment_date DESC LIMIT 5";

    const result = db.exec(query, params);
    const tbody = document.getElementById('recentAppointments');
    if (result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No appointments found</td></tr>';
        return;
    }

    tbody.innerHTML = result[0].values.map(r => `
        <tr>
            <td>${esc(r[1])}</td>
            <td>${esc(r[2])}</td>
            <td>${esc(r[3])}</td>
            <td><span class="badge badge-${r[4].toLowerCase()}">${esc(r[4])}</span></td>
        </tr>
    `).join('');
}
