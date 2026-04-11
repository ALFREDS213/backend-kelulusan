const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const announcementController = require('../controllers/announcementController');

// PUBLIC API
router.get('/announcement/status', announcementController.getAnnouncement);
router.post('/students/check', studentController.checkKelulusan);

module.exports = router;