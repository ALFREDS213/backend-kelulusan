const db = require('../config/db');
const response = require('../utils/response');


//Get & Update Announcement
exports.getAnnouncement = (req, res) => {
    db.query(
        'SELECT is_open, countdown, information FROM announcement LIMIT 1',
        (err, result) => {
            if (err) return response.error(res, 'Server error');

            const data = result[0];

            return response.success(res, {
                is_open: data?.is_open ?? false,
                countdown: data?.countdown ?? null,
                information: data?.information ?? '',
                server_time: new Date() // penting!
            });
        }
    );
};

exports.updateAnnouncement = (req, res) => {
    const { countdown, is_open, information } = req.body;

    db.query(
        'UPDATE announcement SET countdown = ?, is_open = ?, information = ? WHERE id = 1',
        [countdown, is_open, information],
        (err) => {
            if (err) return response.error(res, 'Server error');

            return response.success(res, {
                countdown,
                is_open,
                information
            }, 'Announcement berhasil diupdate');
        }
    );
};