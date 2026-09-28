const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { loadModels, getFaceDescriptor, compareFaces } = require('./faceService');

const app = express();
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/employees/register', upload.single('image'), async (req, res) => {
  try {
    const { name, employeeCode } = req.body;
    if (!name || !employeeCode || !req.file) {
      return res.status(400).json({ status: 'fail', message: 'الاسم وكود الموظف وصورة الوجه مطلوبة' });
    }

    const descriptor = await getFaceDescriptor(req.file.path);

    const stmt = db.prepare('INSERT INTO employees (name, employeeCode, faceDescriptor) VALUES (?, ?, ?)');
    const result = stmt.run(name, employeeCode, JSON.stringify(descriptor));

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      status: 'success',
      message: 'تم تسجيل الموظف وبصمة الوجه بنجاح',
      data: { id: result.lastInsertRowid, name, employeeCode }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ status: 'fail', message: 'كود الموظف مسجل بالفعل' });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/attendance/check-in', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'صورة الوجه مطلوبة للتحقق' });
    }

    const capturedDescriptor = await getFaceDescriptor(req.file.path);
    fs.unlinkSync(req.file.path);

    const employees = db.prepare('SELECT id, name, employeeCode, faceDescriptor FROM employees').all();
    if (employees.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'لا يوجد موظفين مسجلين بالنظام' });
    }

    let bestMatch = null;
    let minDistance = 1.0;

    for (const emp of employees) {
      const savedDescriptor = JSON.parse(emp.faceDescriptor);
      const { isMatch, distance } = compareFaces(capturedDescriptor, savedDescriptor, 0.55);

      if (isMatch && distance < minDistance) {
        minDistance = distance;
        bestMatch = emp;
      }
    }

    if (!bestMatch) {
      return res.status(401).json({ status: 'fail', message: 'لم يتم التعرف على الوجه، غير مسجل بالنظام' });
    }

    db.prepare('INSERT INTO attendance (employeeId, distance) VALUES (?, ?)').run(bestMatch.id, minDistance);

    res.json({
      status: 'success',
      message: `تم تسجيل الحضور بنجاح: مرحباً ${bestMatch.name}`,
      data: {
        employeeId: bestMatch.id,
        name: bestMatch.name,
        employeeCode: bestMatch.employeeCode,
        matchDistance: minDistance.toFixed(4)
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = 3000;
loadModels().then(() => {
  app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ http://localhost:${PORT}`));
});