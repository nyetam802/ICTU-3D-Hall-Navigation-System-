const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

const USERS_FILE = path.join(__dirname, 'users.json');
const LOGS_FILE = path.join(__dirname, 'activity_logs.json');

function readJSON(file, defaultVal) {
    if (!fs.existsSync(file)) return defaultVal;
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return defaultVal;
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
    writeJSON(USERS_FILE, [
        { username: "admin", password: "admin123", role: "Administrator" }
    ]);
} else {
    let users = readJSON(USERS_FILE, []);
    if (!users.some(u => u.username.toLowerCase() === 'admin')) {
        users.unshift({ username: "admin", password: "admin123", role: "Administrator" });
        writeJSON(USERS_FILE, users);
    }
}

if (!fs.existsSync(LOGS_FILE)) {
    writeJSON(LOGS_FILE, []);
}

// SIGN UP API
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.trim() === "" || password.trim() === "") {
        return res.status(400).json({ success: false, message: "Username and password cannot be empty." });
    }

    const users = readJSON(USERS_FILE, []);
    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername === 'admin') {
        return res.status(400).json({ success: false, message: "This username is reserved." });
    }

    const existingUser = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists. Please choose another." });
    }

    users.push({ username: cleanUsername, password: password.trim(), role: "Student" });
    writeJSON(USERS_FILE, users);

    res.json({ success: true, message: "Account created successfully! Redirecting..." });
});

// LOGIN API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Please fill in all fields." });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Check Admin Credentials
    if (cleanUsername.toLowerCase() === 'admin' && cleanPassword === 'admin123') {
        logActivity('admin', 'Administrator');
        return res.json({ success: true, role: "Administrator", redirect: "/admin.html" });
    }

    // Check Registered Student DB
    const users = readJSON(USERS_FILE, []);
    const foundUser = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.password === cleanPassword);

    if (foundUser) {
        logActivity(foundUser.username, 'Student');
        // Redirect regular students to their student dashboard
        return res.json({ success: true, role: "Student", redirect: "/student.html" });
    }

    res.status(401).json({ success: false, message: "Invalid username or password." });
});

function logActivity(username, role) {
    const logs = readJSON(LOGS_FILE, []);
    logs.unshift({
        username: username,
        role: role,
        time: new Date().toLocaleString()
    });
    if (logs.length > 100) logs.pop();
    writeJSON(LOGS_FILE, logs);
}

app.get('/api/admin/logs', (req, res) => {
    const logs = readJSON(LOGS_FILE, []);
    res.json(logs);
});

// Campus Room Database
const campusLayoutDB = [
    { id: "rm--101", name: "Pondi Hall", floor: "Floor -1", type: "Hall / Basement", position: { x: -6, y: -2, z: 0 }, dimensions: { w: 14, h: 3, d: 14 }, color: 0x94a3b8 },
    { id: "rm--102", name: "Campus Cantine", floor: "Floor -1", type: "Dining", position: { x: 8, y: -2, z: 0 }, dimensions: { w: 12, h: 3, d: 14 }, color: 0xc084fc },
    { id: "rm-101", name: "Campus Sickbay", floor: "Floor 1", type: "Medical", position: { x: -11, y: 3, z: -9 }, dimensions: { w: 8, h: 3, d: 7 }, color: 0xf43f5e },
    { id: "rm-103", name: "Administration Office", floor: "Floor 1", type: "Administration", position: { x: 5, y: 3, z: -9 }, dimensions: { w: 10, h: 3, d: 7 }, color: 0x60a5fa },
    { id: "rm-102", name: "Restroom (Floor 1)", floor: "Floor 1", type: "Toilet (Right Side)", position: { x: 13, y: 3, z: 9 }, dimensions: { w: 5, h: 3, d: 6 }, color: 0xe2e8f0 },
    { id: "rm-105", name: "Central Library", floor: "Floor 1", type: "Library", position: { x: 4, y: 3, z: 9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0xfde047 },
    { id: "rm-106", name: "Reception", floor: "Floor 1", type: "Front Reception", position: { x: -7, y: 3, z: 13 }, dimensions: { w: 9, h: 3, d: 4 }, color: 0xf472b6 },
    { id: "rm-104", name: "George Mbarika Hall", floor: "Floor 1", type: "Main Hall", position: { x: -7, y: 3, z: 8 }, dimensions: { w: 9, h: 3, d: 5 }, color: 0x38bdf8 },
    { id: "rm-201", name: "Chumbow Hall", floor: "Floor 2", type: "Lecture Hall", position: { x: -2, y: 8, z: 9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0x818cf8 },
    { id: "rm-202", name: "Terry and Lynda Hall", floor: "Floor 2", type: "Lecture Hall", position: { x: -2, y: 8, z: -9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0x34d399 },
    { id: "rm-205", name: "Computer Lab", floor: "Floor 2", type: "IT Lab", position: { x: 9, y: 8, z: -9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0x38bdf8 },
    { id: "rm-206", name: "Cisco Lab", floor: "Floor 2", type: "Networking Lab", position: { x: 9, y: 8, z: 9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0x0284c7 },
    { id: "rm-301", name: "Gaming Hall", floor: "Floor 3", type: "Hall", position: { x: -12, y: 13, z: -9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0xf472b6 },
    { id: "rm-303", name: "Eric Mbarika Hall", floor: "Floor 3", type: "Hall", position: { x: 8, y: 13, z: -9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0x2dd4bf },
    { id: "rm-404", name: "Vice Chancellor's Office", floor: "Floor 4", type: "Executive Office", position: { x: -5, y: 18, z: -9 }, dimensions: { w: 8, h: 3, d: 6 }, color: 0xf59e0b },
    { id: "rm-501", name: "University Chapel", floor: "Floor 5", type: "Chapel & Worship", position: { x: 0, y: 23, z: 0 }, dimensions: { w: 18, h: 4, d: 16 }, color: 0xfffbe1 }
];

app.get('/api/rooms', (req, res) => {
    res.json(campusLayoutDB);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running at http://localhost:${PORT}`));