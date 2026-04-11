const multer = require('multer');

const storage = multer.memoryStorage();

//Excel
const uploadExcel = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {

        // cek extension saja (lebih fleksibel)
        if (file.originalname.endsWith('.xlsx')) {
            cb(null, true);
        } else {
            cb(new Error('File harus Excel (.xlsx)'), false);
        }
    }
});

//CSV
const uploadCSV = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'text/csv' ||
            file.originalname.endsWith('.csv')
        ) {
            cb(null, true);
        } else {
            cb(new Error('File harus CSV'), false);
        }
    }
});

module.exports = {
    uploadExcel,
    uploadCSV
};