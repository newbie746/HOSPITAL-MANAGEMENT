/* ==========================================================
   Appointments - CRUD Operations
   ========================================================== */

function loadAppointments(search) {
    let query = `
        SELECT a.id, u_p.name, u_d.name, a.appointment_date, a.appointment_time,
               a.reason, a.status, a.patient_id, a.doctor_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u_p ON p.user_id = u_p.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u_d ON d.user_id = u_d.id
    `;
    const params = [];
    const conditions = [];

    if (currentUser.role === 'doctor') {
        conditions.push("a.doctor_id = ?");
        params.push(currentUser.doctorId);
    } else if (currentUser.role === 'patient') {
        conditions.push("a.patient_id = ?");
        params.push(currentUser.patientId);
    }
    if (search) {
        conditions.push("(u_p.name LIKE ? OR u_d.name LIKE ? OR a.reason LIKE ?)");
        params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY a.appointment_date DESC";

    const result = db.exec(query, params);
    const tbody = document.getElementById('appointmentsTable');
    if (result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No appointments found</td></tr>';
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
            <td><span class="badge badge-${r[6].toLowerCase()}">${esc(r[6])}</span></td>
            <td class="btn-group">
                ${canEdit ? `<button class="btn btn-warning btn-sm" onclick="editAppointment(${r[0]})"><i class="fas fa-edit"></i> Edit</button>` : ''}
                ${currentUser.role === 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteAppointment(${r[0]})"><i class="fas fa-trash"></i> Delete</button>` : ''}
                ${currentUser.role === 'patient' && r[6] === 'Pending' ? `<button class="btn btn-danger btn-sm" onclick="cancelAppointment(${r[0]})"><i class="fas fa-ban"></i> Cancel</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function searchAppointments(val) { loadAppointments(val); }

function openAppointmentModal() {
    document.getElementById('appointmentModalTitle').textContent = 'New Appointment';
    document.getElementById('appointmentId').value = '';
    document.getElementById('appointmentDate').value = '';
    document.getElementById('appointmentTime').value = '';
    document.getElementById('appointmentReason').value = '';
    document.getElementById('appointmentStatus').value = 'Pending';

    populatePatientDropdown('appointmentPatient');
    populateDoctorDropdown('appointmentDoctor');

    if (currentUser.role === 'patient') {
        setTimeout(() => {
            document.getElementById('appointmentPatient').value = currentUser.patientId;
            document.getElementById('appointmentPatient').disabled = true;
        }, 50);
    } else {
        document.getElementById('appointmentPatient').disabled = false;
    }

    document.getElementById('appointmentModal').classList.add('active');
}

function editAppointment(id) {
    const r = db.exec("SELECT * FROM appointments WHERE id=?", [id]);
    if (r.length === 0) return;
    const row = r[0].values[0];

    document.getElementById('appointmentModalTitle').textContent = 'Edit Appointment';
    document.getElementById('appointmentId').value = row[0];

    populatePatientDropdown('appointmentPatient');
    populateDoctorDropdown('appointmentDoctor');

    setTimeout(() => {
        document.getElementById('appointmentPatient').value = row[1];
        document.getElementById('appointmentDoctor').value = row[2];
        document.getElementById('appointmentDate').value = row[3];
        document.getElementById('appointmentTime').value = row[4] || '';
        document.getElementById('appointmentReason').value = row[5] || '';
        document.getElementById('appointmentStatus').value = row[6];
        document.getElementById('appointmentPatient').disabled = false;
    }, 50);

    document.getElementById('appointmentModal').classList.add('active');
}

function saveAppointment() {
    const id        = document.getElementById('appointmentId').value;
    const patientId = document.getElementById('appointmentPatient').value;
    const doctorId  = document.getElementById('appointmentDoctor').value;
    const date      = document.getElementById('appointmentDate').value;
    const time      = document.getElementById('appointmentTime').value;
    const reason    = document.getElementById('appointmentReason').value.trim();
    const status    = document.getElementById('appointmentStatus').value;

    if (!patientId || !doctorId || !date) { alert('Patient, Doctor, and Date are required'); return; }

    if (id) {
        db.run("UPDATE appointments SET patient_id=?, doctor_id=?, appointment_date=?, appointment_time=?, reason=?, status=? WHERE id=?",
            [patientId, doctorId, date, time, reason, status, id]);
    } else {
        db.run("INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status) VALUES (?,?,?,?,?,?)",
            [patientId, doctorId, date, time, reason, status]);
    }

    saveDB();
    closeModal('appointmentModal');
    document.getElementById('appointmentPatient').disabled = false;
    loadAppointments();
    showNotification('Appointment saved successfully!');
}

function deleteAppointment(id) {
    if (!confirm('Delete this appointment?')) return;
    db.run("DELETE FROM appointments WHERE id=?", [id]);
    saveDB();
    loadAppointments();
    showNotification('Appointment deleted', 'error');
}

function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return;
    db.run("UPDATE appointments SET status='Cancelled' WHERE id=?", [id]);
    saveDB();
    loadAppointments();
    showNotification('Appointment cancelled', 'warning');
}
