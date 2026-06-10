/* ==========================================================
   Users Management (Admin) & Patient Profile
   ========================================================== */

function loadUsers(search) {
    let query = "SELECT id, name, email, role, created_at FROM users";
    const params = [];
    if (search) {
        query += " WHERE name LIKE ? OR email LIKE ? OR role LIKE ?";
        params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    }
    query += " ORDER BY id";

    const result = db.exec(query, params);
    const tbody = document.getElementById('usersTable');
    if (result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = result[0].values.map(r => `
        <tr>
            <td>${r[0]}</td>
            <td>${esc(r[1])}</td>
            <td>${esc(r[2])}</td>
            <td><span style="text-transform:capitalize">${esc(r[3])}</span></td>
            <td>${esc(r[4])}</td>
            <td>
                ${r[0] !== currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${r[0]})"><i class="fas fa-trash"></i> Delete</button>` : '<em>Current</em>'}
            </td>
        </tr>
    `).join('');
}

function searchUsers(val) { loadUsers(val); }

function deleteUser(id) {
    if (!confirm('Delete this user and all associated data?')) return;

    const doc = db.exec("SELECT id FROM doctors WHERE user_id=?", [id]);
    if (doc.length > 0 && doc[0].values.length > 0) {
        const docId = doc[0].values[0][0];
        db.run("DELETE FROM medical_records WHERE doctor_id=?", [docId]);
        db.run("DELETE FROM appointments WHERE doctor_id=?", [docId]);
        db.run("DELETE FROM doctors WHERE id=?", [docId]);
    }

    const pat = db.exec("SELECT id FROM patients WHERE user_id=?", [id]);
    if (pat.length > 0 && pat[0].values.length > 0) {
        const patId = pat[0].values[0][0];
        db.run("DELETE FROM medical_records WHERE patient_id=?", [patId]);
        db.run("DELETE FROM appointments WHERE patient_id=?", [patId]);
        db.run("DELETE FROM patients WHERE id=?", [patId]);
    }

    db.run("DELETE FROM users WHERE id=?", [id]);
    saveDB();
    loadUsers();
    showNotification('User deleted', 'error');
}

function loadProfile() {
    if (!currentUser.patientId) return;
    const r = db.exec(`
        SELECT u.name, u.email, p.phone, p.age, p.gender, p.address
        FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [currentUser.patientId]);
    if (r.length === 0) return;
    const row = r[0].values[0];

    document.getElementById('profileContent').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:600px;">
            <div><strong>Name:</strong><br>${esc(row[0])}</div>
            <div><strong>Email:</strong><br>${esc(row[1])}</div>
            <div><strong>Phone:</strong><br>${esc(row[2]) || '-'}</div>
            <div><strong>Age:</strong><br>${row[3] || '-'}</div>
            <div><strong>Gender:</strong><br>${esc(row[4]) || '-'}</div>
            <div><strong>Address:</strong><br>${esc(row[5]) || '-'}</div>
        </div>
    `;
}
