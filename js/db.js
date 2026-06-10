/* ==========================================================
   Database Initialization & Schema
   ========================================================== */

let db = null;
let currentUser = null;

async function initDB() {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const saved = localStorage.getItem('hms_database');
    if (saved) {
        const buf = new Uint8Array(JSON.parse(saved));
        db = new SQL.Database(buf);
    } else {
        db = new SQL.Database();
        createTables();
        seedData();
    }
}

function saveDB() {
    const data = db.export();
    localStorage.setItem('hms_database', JSON.stringify(Array.from(data)));
}

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin','doctor','patient')),
            created_at TEXT DEFAULT (datetime('now'))
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            specialization TEXT,
            phone TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            phone TEXT,
            age INTEGER,
            gender TEXT,
            address TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT,
            reason TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            record_date TEXT NOT NULL,
            diagnosis TEXT,
            prescription TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );
    `);
}

function seedData() {
    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        ["Administrator", "admin@hms.com", "admin123", "admin"]);

    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        ["Dr. Sarah Smith", "sarah@hms.com", "doctor123", "doctor"]);
    db.run("INSERT INTO doctors (user_id,specialization,phone) VALUES (?,?,?)",
        [2, "Cardiology", "555-0101"]);

    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        ["Dr. James Wilson", "james@hms.com", "doctor123", "doctor"]);
    db.run("INSERT INTO doctors (user_id,specialization,phone) VALUES (?,?,?)",
        [3, "Neurology", "555-0102"]);

    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        ["Dr. Emily Brown", "emily@hms.com", "doctor123", "doctor"]);
    db.run("INSERT INTO doctors (user_id,specialization,phone) VALUES (?,?,?)",
        [4, "Orthopedics", "555-0103"]);

    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        ["John Doe", "john@hms.com", "patient123", "patient"]);
    db.run("INSERT INTO patients (user_id,phone,age,gender,address) VALUES (?,?,?,?,?)",
        [5, "555-0201", 35, "Male", "123 Main St"]);

    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        ["Jane Miller", "jane@hms.com", "patient123", "patient"]);
    db.run("INSERT INTO patients (user_id,phone,age,gender,address) VALUES (?,?,?,?,?)",
        [6, "555-0202", 28, "Female", "456 Oak Ave"]);

    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        ["Bob Johnson", "bob@hms.com", "patient123", "patient"]);
    db.run("INSERT INTO patients (user_id,phone,age,gender,address) VALUES (?,?,?,?,?)",
        [7, "555-0203", 45, "Male", "789 Pine Rd"]);

    db.run("INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status) VALUES (?,?,?,?,?,?)",
        [1, 1, "2026-04-10", "10:00", "Chest Pain", "Confirmed"]);
    db.run("INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status) VALUES (?,?,?,?,?,?)",
        [2, 2, "2026-04-11", "14:30", "Headaches", "Pending"]);
    db.run("INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status) VALUES (?,?,?,?,?,?)",
        [3, 3, "2026-04-12", "09:00", "Knee Pain", "Pending"]);
    db.run("INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status) VALUES (?,?,?,?,?,?)",
        [1, 2, "2026-04-08", "11:00", "Follow-up", "Completed"]);

    db.run("INSERT INTO medical_records (patient_id,doctor_id,record_date,diagnosis,prescription,notes) VALUES (?,?,?,?,?,?)",
        [1, 1, "2026-04-01", "Mild Arrhythmia", "Beta Blockers", "Follow up in 2 weeks"]);
    db.run("INSERT INTO medical_records (patient_id,doctor_id,record_date,diagnosis,prescription,notes) VALUES (?,?,?,?,?,?)",
        [2, 2, "2026-03-28", "Tension Headache", "Ibuprofen, Rest", "Avoid screen time"]);

    saveDB();
}
