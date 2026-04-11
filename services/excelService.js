const ExcelJS = require('exceljs');

exports.parseExcel = async (buffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);

    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        rows.push({
            nis: row.getCell(1).value?.toString(),
            nama: row.getCell(2).value,
            keterangan: row.getCell(3).value,
            jurusan: row.getCell(4).value
        });
    });

    return rows;
};