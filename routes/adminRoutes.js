const express = require('express');
const router = express.Router();
const { uploadExcel, uploadCSV } = require('../middleware/uploadMiddleware');

const adminController = require('../controllers/adminController');
const studentController = require('../controllers/studentController');
const announcementController = require('../controllers/announcementController');
const { verifyToken } = require('../middleware/authMiddleware');

//Route Auth Admin
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);
router.post('/register', adminController.register);

//Token Protect
router.use(verifyToken); // 🔥 semua admin route kena auth

// Import & Export Excell
router.post('/students/import-excel', uploadExcel.single('file'), studentController.importStudentsExcel);
router.get('/students/export-excel', studentController.exportStudentsExcel);
router.get('/students/template-excel', studentController.exportTemplateExcel);

// Import & Export CSV
router.post('/students/import-csv', uploadCSV.single('file'), studentController.importStudentsCSV);
router.get('/students/export-csv', studentController.exportStudentsCSV);
router.get('/students/template-csv', studentController.exportTemplateCSV);

//Route CRUD Students
router.post('/students', studentController.createStudent);
router.get('/students', studentController.getAllStudents);
router.get('/students/jurusan/:jurusan', studentController.getByJurusan);
router.get('/students/:nis', studentController.getStudentByNIS);
router.put('/students/:nis', studentController.updateStudent);
router.delete('/students/:nis', studentController.deleteStudent);

//Route Annoucement Admin
router.get('/announcement', announcementController.getAnnouncement);
router.put('/announcement', announcementController.updateAnnouncement);

module.exports = router;