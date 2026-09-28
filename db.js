const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'attendance.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    employeeCode TEXT UNIQUE NOT NULL,
    faceDescriptor TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId INTEGER NOT NULL,
    checkInTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    distance REAL NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees (id)
  );
`);

module.exports = db;