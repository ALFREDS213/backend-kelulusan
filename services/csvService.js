const csv = require('csv-parser');
const stream = require('stream');

exports.parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];

        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        bufferStream
            .pipe(csv({
                separator: ',',
                mapHeaders: ({ header }) =>
                    header
                        .replace('\ufeff', '')     // hapus BOM
                        .replace(/"+/g, '')        // hapus semua tanda kutip
                        .trim()
                        .toLowerCase(),
                mapValues: ({ value }) =>
                    value
                        .replace(/"+/g, '')        // hapus semua tanda kutip
                        .trim()
            }))
            .on('data', (data) => {
                // 🔥 HANDLE CSV RUSAK (jadi 1 kolom)
                if (Object.keys(data).length === 1) {
                    const raw = Object.values(data)[0];

                    if (raw && raw.includes(',')) {
                        const parts = raw.split(',').map(v =>
                            v.replace(/"+/g, '').trim()
                        );

                        if (parts.length === 4) {
                            results.push({
                                nis: parts[0],
                                nama: parts[1],
                                keterangan: parts[2],
                                jurusan: parts[3]
                            });
                        }
                    }
                } else {
                    results.push(data);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};