/* ==========================================================
   Patients - CRUD Operations
   ========================================================== */

function loadPatients(search) {
    let query = `
        SELECT p.id, u.name, u.email, p.phone, p.age, p.gender, u.id as uid
        FROM patients p JOIN users u ON p.user_id = u.id
    `;
    const params = [];

    if (currentUser.role === 'doctor') {
        query += " WHERE p.id IN (SELECT DISTINCT patient_id FROM appointments WHERE doctor_id=?)";
        params.push(currentUser.doctorId);
        if (search) {
            query += " AND u.name LIKE ?";
            params.push('%' + search + '%');
        }
    } else if (search) {
        query += " WHERE u.name LIKE ?";
        params.push('%' + search + '%');
    }
    query += " ORDER BY p.id";

    const addBtn = document.getElementById('addPatientBtn');
    if (addBtn) addBtn.style.display = currentUser.role === 'doctor' ? 'none' : 'inline-block';

    const result = db.exec(query, params);
    const tbody = document.getElementById('patientsTable');
    if (result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No patients found</td></tr>';
        return;
    }

    const canEdit = currentUser.role === 'admin';
    tbody.innerHTML = result[0].values.map(r => `
        <tr>
            <td>${r[0]}</td>
            <td>${esc(r[1])}</td>
            <td>${esc(r[2])}</td>
            <td>${esc(r[3])}</td>
            <td>${r[4] || '-'}</td>
            <td>${esc(r[5]) || '-'}</td>
            <td class="btn-group">
                ${canEdit ? `<button class="btn btn-warning btn-sm" onclick="editPatient(${r[0]})"><i class="fas fa-edit"></i> Edit</button>` : ''}
                ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="deletePatient(${r[0]},${r[6]})"><i class="fas fa-trash"></i> Delete</button>` : ''}
                <button class="btn btn-info btn-sm" onclick="viewPatientRecords(${r[0]})"><i class="fas fa-folder-open"></i> Records</button>
            </td>
        </tr>
    `).join('');
}

function searchPatients(val) { loadPatients(val); }

function openPatientModal() {
    document.getElementById('patientModalTitle').textContent = 'Add Patient';
    document.getElementById('patientIdField').value = '';
    document.getElementById('patientName').value = '';
    document.getElementById('patientEmail').value = '';
    document.getElementById('patientPassword').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('patientGender').value = '';
    document.getElementById('patientAddress').value = '';
    document.getElementById('patientModal').classList.add('active');
}

function editPatient(id) {
    const r = db.exec(`
        SELECT p.id, u.name, u.email, p.phone, p.age, p.gender, p.address, u.id
        FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [id]);
    if (r.length === 0) return;
    const row = r[0].values[0];
    document.getElementById('patientModalTitle').textContent = 'Edit Patient';
    document.getElementById('patientIdField').value = row[0];
    document.getElementById('patientName').value = row[1];
    document.getElementById('patientEmail').value = row[2];
    document.getElementById('patientPassword').value = '';
    document.getElementById('patientPhone').value = row[3] || '';
    document.getElementById('patientAge').value = row[4] || '';
    document.getElementById('patientGender').value = row[5] || '';
    document.getElementById('patientAddress').value = row[6] || '';
    document.getElementById('patientModal').classList.add('active');
}

function savePatient() {
    const id       = document.getElementById('patientIdField').value;
    const name     = document.getElementById('patientName').value.trim();
    const email    = document.getElementById('patientEmail').value.trim();
    const password = document.getElementById('patientPassword').value;
    const phone    = document.getElementById('patientPhone').value.trim();
    const age      = document.getElementById('patientAge').value;
    const gender   = document.getElementById('patientGender').value;
    const address  = document.getElementById('patientAddress').value.trim();

    if (!name || !email) { alert('Name and email are required'); return; }

    if (id) {
        const pt = db.exec("SELECT user_id FROM patients WHERE id=?", [id]);
        const uid = pt[0].values[0][0];
        db.run("UPDATE users SET name=?, email=? WHERE id=?", [name, email, uid]);
        if (password) db.run("UPDATE users SET password=? WHERE id=?", [password, uid]);
        db.run("UPDATE patients SET phone=?, age=?, gender=?, address=? WHERE id=?",
            [phone, age || null, gender, address, id]);
    } else {
        if (!password) { alert('Password is required'); return; }
        const exists = db.exec("SELECT id FROM users WHERE email=?", [email]);
        if (exists.length > 0 && exists[0].values.length > 0) { alert('Email already exists'); return; }
        db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [name, email, password, 'patient']);
        const uid = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
        db.run("INSERT INTO patients (user_id,phone,age,gender,address) VALUES (?,?,?,?,?)",
            [uid, phone, age || null, gender, address]);
    }

    saveDB();
    closeModal('patientModal');
    loadPatients();
    showNotification('Patient saved successfully!');
}

function deletePatient(patId, userId) {
    if (!confirm('Delete this patient? This cannot be undone.')) return;
    db.run("DELETE FROM medical_records WHERE patient_id=?", [patId]);
    db.run("DELETE FROM appointments WHERE patient_id=?", [patId]);
    db.run("DELETE FROM patients WHERE id=?", [patId]);
    db.run("DELETE FROM users WHERE id=?", [userId]);
    saveDB();
    loadPatients();
    showNotification('Patient deleted', 'error');
}

function viewPatientRecords(patId) {
    switchPanel('Records');
    loadRecords(null, patId);
}
