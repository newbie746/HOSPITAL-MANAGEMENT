/* ==========================================================
   Authentication - Login, Register, Logout
   ========================================================== */

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAlert('loginAlert', 'Please fill in all fields', 'error');
        return;
    }

    const result = db.exec("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
    if (result.length === 0 || result[0].values.length === 0) {
        showAlert('loginAlert', 'Invalid email or password', 'error');
        return;
    }

    const row = result[0].values[0];
    currentUser = {
        id: row[0],
        name: row[1],
        email: row[2],
        role: row[4]
    };

    if (currentUser.role === 'doctor') {
        const dr = db.exec("SELECT id FROM doctors WHERE user_id = ?", [currentUser.id]);
        if (dr.length > 0) currentUser.doctorId = dr[0].values[0][0];
    } else if (currentUser.role === 'patient') {
        const pt = db.exec("SELECT id FROM patients WHERE user_id = ?", [currentUser.id]);
        if (pt.length > 0) currentUser.patientId = pt[0].values[0][0];
    }

    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    setupDashboard();
}

function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    const phone = document.getElementById('regPhone').value.trim();

    if (!name || !email || !password) {
        showAlert('registerAlert', 'Please fill in all required fields', 'error');
        return;
    }

    const exists = db.exec("SELECT id FROM users WHERE email = ?", [email]);
    if (exists.length > 0 && exists[0].values.length > 0) {
        showAlert('registerAlert', 'Email already exists', 'error');
        return;
    }

    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [name, email, password, role]);
    const uid = db.exec("SELECT last_insert_rowid()")[0].values[0][0];

    if (role === 'doctor') {
        const spec = document.getElementById('regSpecialization').value.trim();
        db.run("INSERT INTO doctors (user_id,specialization,phone) VALUES (?,?,?)", [uid, spec, phone]);
    } else {
        db.run("INSERT INTO patients (user_id,phone) VALUES (?,?)", [uid, phone]);
    }

    saveDB();
    showAlert('registerAlert', 'Account created! You can now sign in.', 'success');
    setTimeout(() => showLogin(), 1500);
}

function logout() {
    currentUser = null;
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function showRegister() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'flex';
}

function showLogin() {
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}
