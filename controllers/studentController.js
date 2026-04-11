const ExcelJS = require('exceljs');
const db = require('../config/db');
const response = require('../utils/response');
const { Parser } = require('json2csv');
const { parseCSV } = require('../services/csvService');

//Check NIS Students
exports.checkKelulusan = (req, res) => {
    const {nis} = req.body;

    if (!nis) {
        return response.error(res, 'NIS wajib diisi', 400);
    }

    db.query(
        'SELECT nis, nama, keterangan, jurusan FROM students WHERE nis = ?',
        [nis],
        (err, result) => {
            if (err) return response.error(res, 'Server error');

            if (result.length === 0) {
                return response.error(res, 'Data tidak ditemukan', 404);
            }

            return response.success(res, result[0]);
        }
    );
}


//Get All Student
exports.getAllStudents = (req, res) => {
    db.query('SELECT * FROM students', (err, result) => {
        if(err) return response.error(res, 'Server Error');

        return response.success(res, result);
    });
};


//Get By NIS
exports.getStudentByNIS = (req, res) => {
    const { nis } = req.params;

    console.log("NIS DITERIMA:", nis); // DEBUG

    db.query(
        'SELECT * FROM students WHERE nis = ?',
        [nis],
        (err, result) => {
            console.log("HASIL QUERY:", result); // 🔥 DEBUG
            if (err) return response.error(res, 'Server Error');

            if (result.length === 0){
                return response.error(res, 'Data Tidak Ditemukan', 404);
            }

            return response.success(res, result[0]);
        }
    );
};


//Get By Jurusan
exports.getByJurusan = (req, res) => {
    const { jurusan } = req.params;

    db.query(
        'SELECT * FROM students WHERE jurusan = ?',
        [jurusan],
        (err, result) => {
            if (err) return response.error(res, 'Server error');

            return response.success(res, result);
        }
    );
};


//Create
exports.createStudent = (req, res) => {
    const { nis, nama, keterangan, jurusan } = req.body;

    if (!nis || !nama || !keterangan || !jurusan) {
        return response.error(res, 'Semua field wajib diisi', 400);
    }

    db.query(
        'INSERT INTO students (nis, nama, keterangan, jurusan) VALUES (?, ?, ?, ?)',
        [nis, nama, keterangan, jurusan],
        (err) => {
            if (err) {
                console.log(err);
                return response.error(res, 'Gagal tambah data');
            }

            return response.success(res, {
                nis,
                nama,
                keterangan,
                jurusan
            }, 'Data berhasil ditambahkan');
        }
    );
};


//Update
exports.updateStudent = (req, res) => {
    const { nis } = req.params;
    const { nama, keterangan, jurusan } = req.body;

    db.query(
        'UPDATE students SET nama = ?, keterangan = ?, jurusan = ? WHERE nis = ?',
        [nama, keterangan, jurusan, nis],
        (err, result) => {
            if (err) return response.error(res, 'Server error');

            return response.success(res, {
                nis,
                nama,
                keterangan,
                jurusan
            }, 'Data berhasil diupdate');
        }
    );
};


//Delete
exports.deleteStudent = (req, res) => {
    const { nis } = req.params;

    db.query(
        'DELETE FROM students WHERE nis = ?',
        [nis],
        (err) => {
            if (err) return response.error(res, 'Server error');

            return response.success(res, null, 'Data berhasil dihapus');
        }
    );
};


//Import Excel
exports.importStudentsExcel = async (req, res) => {
    if (!req.file) {
        return response.error(res, 'File Excel wajib diupload', 400);
    }

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return response.error(res, 'Sheet tidak ditemukan');
        }

        const validStatus = ['Lulus', 'TidakLulus'];
        const values = [];

        worksheet.eachRow((row, rowNumber) => {

            // 🔥 VALIDASI HEADER + SKIP
            if (rowNumber === 1) {
                const headers = [
                    String(row.getCell(1).value || '').trim().toLowerCase(),
                    String(row.getCell(2).value || '').trim().toLowerCase(),
                    String(row.getCell(3).value || '').trim().toLowerCase(),
                    String(row.getCell(4).value || '').trim().toLowerCase()
                ];

                if (
                    headers[0] !== 'nis' ||
                    headers[1] !== 'nama' ||
                    headers[2] !== 'keterangan' ||
                    headers[3] !== 'jurusan'
                ) {
                    throw new Error('Format header harus: nis, nama, keterangan, jurusan');
                }

                return; // skip header
            }

            // 🔥 AMAN DARI NULL / UNDEFINED
            const nis = String(row.getCell(1).value || '').trim();
            const nama = String(row.getCell(2).value || '').trim();
            const keterangan = String(row.getCell(3).value || '').trim();
            const jurusan = String(row.getCell(4).value || '').trim();

            // 🔥 VALIDASI DATA
            if (!nis || !nama || !keterangan || !jurusan) {
                throw new Error(`Data kosong di baris ${rowNumber}`);
            }

            if (!validStatus.includes(keterangan)) {
                throw new Error(`Keterangan tidak valid di baris ${rowNumber}`);
            }

            values.push([nis, nama, keterangan, jurusan]);
        });

        if (values.length === 0) {
            return response.error(res, 'Tidak ada data valid');
        }

        // 🔥 TRANSACTION
        db.beginTransaction((err) => {
            if (err) return response.error(res, 'Gagal transaksi');

            db.query('DELETE FROM students', (err) => {
                if (err) {
                    return db.rollback(() =>
                        response.error(res, 'Gagal hapus data lama')
                    );
                }

                db.query(
                    'INSERT INTO students (nis, nama, keterangan, jurusan) VALUES ?',
                    [values],
                    (err) => {
                        if (err) {
                            return db.rollback(() =>
                                response.error(res, 'Gagal import data')
                            );
                        }

                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() =>
                                    response.error(res, 'Commit gagal')
                                );
                            }

                            return response.success(res, {
                                total: values.length
                            }, 'Import Excel berhasil');
                        });
                    }
                );
            });
        });

    } catch (err) {
        console.log(err);
        return response.error(res, err.message);
    }
};


//Export Excel
exports.exportStudentsExcel = (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // HEADER
    worksheet.columns = [
        { header: 'nis', key: 'nis', width: 15 },
        { header: 'nama', key: 'nama', width: 25 },
        { header: 'keterangan', key: 'keterangan', width: 15 },
        { header: 'jurusan', key: 'jurusan', width: 20 }
    ];

    db.query('SELECT nis, nama, keterangan, jurusan FROM students', async (err, result) => {
        if (err) return response.error(res, 'Server error');

        result.forEach(row => {
            worksheet.addRow(row);
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=students.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    });
};

exports.exportTemplateExcel = async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    worksheet.columns = [
        { header: 'nis', key: 'nis' },
        { header: 'nama', key: 'nama' },
        { header: 'keterangan', key: 'keterangan' },
        { header: 'jurusan', key: 'jurusan' }
    ];

    // contoh baris
    worksheet.addRow({
        nis: '12345',
        nama: 'Nama Siswa',
        keterangan: 'Lulus',
        jurusan: 'RPL'
    });

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
        'Content-Disposition',
        'attachment; filename=template_students.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
};


//Import CSV
exports.importStudentsCSV = async (req, res) => {
    if (!req.file) {
        return response.error(res, 'File CSV wajib diupload', 400);
    }

    try {
        const rows = await parseCSV(req.file.buffer);

        if (!rows || rows.length === 0) {
            return response.error(res, 'CSV kosong atau tidak valid', 400);
        }

        const validStatus = ['Lulus', 'TidakLulus'];

        // 🔥 VALIDASI HEADER
        const headers = Object.keys(rows[0]);
        const requiredHeaders = ['nis', 'nama', 'keterangan', 'jurusan'];

        if (!requiredHeaders.every(h => headers.includes(h))) {
            return response.error(
                res,
                'Format header CSV harus: nis, nama, keterangan, jurusan',
                400
            );
        }

        // 🔥 VALIDASI DATA
        const values = rows.map((row, index) => {
            const nis = (row.nis || '').toString().trim();
            const nama = (row.nama || '').toString().trim();
            const keterangan = (row.keterangan || '').toString().trim();
            const jurusan = (row.jurusan || '').toString().trim();

            if (!nis || !nama || !keterangan || !jurusan) {
                throw new Error(`Data kosong di baris ${index + 2}`);
            }

            if (!validStatus.includes(keterangan)) {
                throw new Error(
                    `Keterangan harus "Lulus" atau "TidakLulus" di baris ${index + 2}`
                );
            }

            return [nis, nama, keterangan, jurusan];
        });

        // 🔥 TRANSACTION (REPLACE)
        db.beginTransaction((err) => {
            if (err) return response.error(res, 'Gagal memulai transaksi');

            db.query('DELETE FROM students', (err) => {
                if (err) {
                    return db.rollback(() =>
                        response.error(res, 'Gagal menghapus data lama')
                    );
                }

                db.query(
                    'INSERT INTO students (nis, nama, keterangan, jurusan) VALUES ?',
                    [values],
                    (err) => {
                        if (err) {
                            return db.rollback(() =>
                                response.error(res, 'Gagal import data')
                            );
                        }

                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() =>
                                    response.error(res, 'Gagal commit data')
                                );
                            }

                            return response.success(
                                res,
                                { total: values.length },
                                'Import CSV berhasil (replace data)'
                            );
                        });
                    }
                );
            });
        });

    } catch (err) {
        console.log(err);
        return response.error(res, err.message || 'Error parsing CSV');
    }
};


//Export CSV
exports.exportStudentsCSV = (req, res) => {
    db.query(
        'SELECT nis, nama, keterangan, jurusan FROM students',
        (err, result) => {
            if (err) return response.error(res, 'Server error');

            const fields = ['nis', 'nama', 'keterangan', 'jurusan'];

            const parser = new Parser({
                fields,
                quote: '' // 🔥 nonaktifkan tanda kutip
            });

            const csv = parser.parse(result);

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=students.csv'
            );

            return res.send('\ufeff' + csv); // 🔥 BOM supaya Excel aman
        }
    );
};


//Template CSV
exports.exportTemplateCSV = (req, res) => {
    try {
        const fields = ['nis', 'nama', 'keterangan', 'jurusan'];

        const data = [
            {
                nis: '12345',
                nama: 'Nama Siswa',
                keterangan: 'Lulus',
                jurusan: 'RPL'
            }
        ];

        const parser = new Parser({
            fields,
            quote: '' // 🔥 penting
        });

        const csv = parser.parse(data);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=template_students.csv'
        );

        return res.send('\ufeff' + csv);
    } catch (err) {
        console.log(err);
        return response.error(res, 'Gagal generate template CSV');
    }
};