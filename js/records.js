/* ==========================================================
   Medical Records - CRUD Operations
   ========================================================== */

function loadRecords(search, filterPatientId) {
    let query = `
        SELECT mr.id, u_p.name, u_d.name, mr.record_date, mr.diagnosis,
               mr.prescription, mr.notes, mr.patient_id, mr.doctor_id
        FROM medical_records mr
        JOIN patients p ON mr.patient_id = p.id
        JOIN users u_p ON p.user_id = u_p.id
        JOIN doctors d ON mr.doctor_id = d.id
        JOIN users u_d ON d.user_id = u_d.id
    `;
    const params = [];
    const conditions = [];

    if (currentUser.role === 'doctor') {
        conditions.push("mr.doctor_id = ?");
        params.push(currentUser.doctorId);
    } else if (currentUser.role === 'patient') {
        conditions.push("mr.patient_id = ?");
        params.push(currentUser.patientId);
    }
    if (filterPatientId) {
        conditions.push("mr.patient_id = ?");
        params.push(filterPatientId);
    }
    if (search) {
        conditions.push("(u_p.name LIKE ? OR mr.diagnosis LIKE ?)");
        params.push('%' + search + '%', '%' + search + '%');
    }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY mr.record_date DESC";

    const addBtn = document.getElementById('addRecordBtn');
    if (addBtn) addBtn.style.display = (currentUser.role === 'patient') ? 'none' : 'inline-block';

    const result = db.exec(query, params);
    const tbody = document.getElementById('recordsTable');
    if (result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No records found</td></tr>';
        return;
    }

    const canEdit = currentUser.role === 'admin' || currentUser.role === 'doctor';
    tbody.innerHTML = result[0].values.map(r => `
        <tr>
            <td>${r[0]}</td>
            <td>${esc(r[1])}</td>
            <td>${esc(r[2])}</td>
            <td>${esc(r[3])}</td>
            <td>${esc(r[4])}</td>
            <td>${esc(r[5])}</td>
            <td class="btn-group">
                ${canEdit ? `<button class="btn btn-warning btn-sm" onclick="editRecord(${r[0]})"><i class="fas fa-edit"></i> Edit</button>` : ''}
                ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="deleteRecord(${r[0]})"><i class="fas fa-trash"></i> Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function searchRecords(val) { loadRecords(val); }

function openRecordModal() {
    document.getElementById('recordModalTitle').textContent = 'Add Medical Record';
    document.getElementById('recordId').value = '';
    document.getElementById('recordDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('recordDiagnosis').value = '';
    document.getElementById('recordPrescription').value = '';
    document.getElementById('recordNotes').value = '';

    populatePatientDropdown('recordPatient');
    populateDoctorDropdown('recordDoctor');

    if (currentUser.role === 'doctor') {
        setTimeout(() => {
            document.getElementById('recordDoctor').value = currentUser.doctorId;
            document.getElementById('recordDoctor').disabled = true;
        }, 50);
    } else {
        document.getElementById('recordDoctor').disabled = false;
    }

    document.getElementById('recordModal').classList.add('active');
}

function editRecord(id) {
    const r = db.exec("SELECT * FROM medical_records WHERE id=?", [id]);
    if (r.length === 0) return;
    const row = r[0].values[0];

    document.getElementById('recordModalTitle').textContent = 'Edit Medical Record';
    document.getElementById('recordId').value = row[0];

    populatePatientDropdown('recordPatient');
    populateDoctorDropdown('recordDoctor');

    setTimeout(() => {
        document.getElementById('recordPatient').value = row[1];
        document.getElementById('recordDoctor').value = row[2];
        document.getElementById('recordDate').value = row[3];
        document.getElementById('recordDiagnosis').value = row[4] || '';
        document.getElementById('recordPrescription').value = row[5] || '';
        document.getElementById('recordNotes').value = row[6] || '';
        document.getElementById('recordDoctor').disabled = false;
    }, 50);

    document.getElementById('recordModal').classList.add('active');
}

function saveRecord() {
    const id           = document.getElementById('recordId').value;
    const patientId    = document.getElementById('recordPatient').value;
    const doctorId     = document.getElementById('recordDoctor').value;
    const date         = document.getElementById('recordDate').value;
    const diagnosis    = document.getElementById('recordDiagnosis').value.trim();
    const prescription = document.getElementById('recordPrescription').value.trim();
    const notes        = document.getElementById('recordNotes').value.trim();

    if (!patientId || !doctorId || !date) { alert('Patient, Doctor, and Date are required'); return; }

    if (id) {
        db.run("UPDATE medical_records SET patient_id=?, doctor_id=?, record_date=?, diagnosis=?, prescription=?, notes=? WHERE id=?",
            [patientId, doctorId, date, diagnosis, prescription, notes, id]);
    } else {
        db.run("INSERT INTO medical_records (patient_id,doctor_id,record_date,diagnosis,prescription,notes) VALUES (?,?,?,?,?,?)",
            [patientId, doctorId, date, diagnosis, prescription, notes]);
    }

    saveDB();
    closeModal('recordModal');
    document.getElementById('recordDoctor').disabled = false;
    loadRecords();
    showNotification('Medical record saved!');
}

function deleteRecord(id) {
    if (!confirm('Delete this medical record?')) return;
    db.run("DELETE FROM medical_records WHERE id=?", [id]);
    saveDB();
    loadRecords();
    showNotification('Record deleted', 'error');
}
