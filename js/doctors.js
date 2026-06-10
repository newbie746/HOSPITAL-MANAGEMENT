/* ==========================================================
   Doctors - CRUD Operations (Admin only)
   ========================================================== */

function loadDoctors(search) {
    let query = `
        SELECT d.id, u.name, u.email, d.specialization, d.phone, u.id as uid
        FROM doctors d JOIN users u ON d.user_id = u.id
    `;
    const params = [];
    if (search) {
        query += " WHERE u.name LIKE ? OR d.specialization LIKE ?";
        params.push('%' + search + '%', '%' + search + '%');
    }
    query += " ORDER BY d.id";

    const result = db.exec(query, params);
    const tbody = document.getElementById('doctorsTable');
    if (result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No doctors found</td></tr>';
        return;
    }

    tbody.innerHTML = result[0].values.map(r => `
        <tr>
            <td>${r[0]}</td>
            <td>${esc(r[1])}</td>
            <td>${esc(r[2])}</td>
            <td>${esc(r[3])}</td>
            <td>${esc(r[4])}</td>
            <td class="btn-group">
                <button class="btn btn-warning btn-sm" onclick="editDoctor(${r[0]})"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteDoctor(${r[0]},${r[5]})"><i class="fas fa-trash"></i> Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchDoctors(val) { loadDoctors(val); }

function openDoctorModal(id) {
    document.getElementById('doctorModalTitle').textContent = id ? 'Edit Doctor' : 'Add Doctor';
    document.getElementById('doctorId').value = '';
    document.getElementById('doctorName').value = '';
    document.getElementById('doctorEmail').value = '';
    document.getElementById('doctorPassword').value = '';
    document.getElementById('doctorSpec').value = '';
    document.getElementById('doctorPhone').value = '';
    document.getElementById('doctorModal').classList.add('active');
}

function editDoctor(id) {
    const r = db.exec(`
        SELECT d.id, u.name, u.email, d.specialization, d.phone, u.id
        FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?
    `, [id]);
    if (r.length === 0) return;
    const row = r[0].values[0];
    document.getElementById('doctorModalTitle').textContent = 'Edit Doctor';
    document.getElementById('doctorId').value = row[0];
    document.getElementById('doctorName').value = row[1];
    document.getElementById('doctorEmail').value = row[2];
    document.getElementById('doctorPassword').value = '';
    document.getElementById('doctorSpec').value = row[3] || '';
    document.getElementById('doctorPhone').value = row[4] || '';
    document.getElementById('doctorModal').classList.add('active');
}

function saveDoctor() {
    const id       = document.getElementById('doctorId').value;
    const name     = document.getElementById('doctorName').value.trim();
    const email    = document.getElementById('doctorEmail').value.trim();
    const password = document.getElementById('doctorPassword').value;
    const spec     = document.getElementById('doctorSpec').value.trim();
    const phone    = document.getElementById('doctorPhone').value.trim();

    if (!name || !email) { alert('Name and email are required'); return; }

    if (id) {
        const dr = db.exec("SELECT user_id FROM doctors WHERE id=?", [id]);
        const uid = dr[0].values[0][0];
        db.run("UPDATE users SET name=?, email=? WHERE id=?", [name, email, uid]);
        if (password) db.run("UPDATE users SET password=? WHERE id=?", [password, uid]);
        db.run("UPDATE doctors SET specialization=?, phone=? WHERE id=?", [spec, phone, id]);
    } else {
        if (!password) { alert('Password is required'); return; }
        const exists = db.exec("SELECT id FROM users WHERE email=?", [email]);
        if (exists.length > 0 && exists[0].values.length > 0) { alert('Email already exists'); return; }
        db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [name, email, password, 'doctor']);
        const uid = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
        db.run("INSERT INTO doctors (user_id,specialization,phone) VALUES (?,?,?)", [uid, spec, phone]);
    }

    saveDB();
    closeModal('doctorModal');
    loadDoctors();
    showNotification('Doctor saved successfully!');
}

function deleteDoctor(docId, userId) {
    if (!confirm('Delete this doctor? This cannot be undone.')) return;
    db.run("DELETE FROM medical_records WHERE doctor_id=?", [docId]);
    db.run("DELETE FROM appointments WHERE doctor_id=?", [docId]);
    db.run("DELETE FROM doctors WHERE id=?", [docId]);
    db.run("DELETE FROM users WHERE id=?", [userId]);
    saveDB();
    loadDoctors();
    showNotification('Doctor deleted', 'error');
}
