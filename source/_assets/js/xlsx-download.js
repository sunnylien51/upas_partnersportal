function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
        crc ^= bytes[i];
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
    return [value & 0xff, (value >> 8) & 0xff];
}

function u32(value) {
    return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff];
}

function zipStore(files) {
    const encoder = new TextEncoder();
    const locals = [];
    const centrals = [];
    let offset = 0;

    files.forEach((file) => {
        const name = encoder.encode(file.name);
        const data = encoder.encode(file.data);
        const crc = crc32(data);
        const local = Uint8Array.from([
            ...u32(0x04034b50),
            ...u16(20),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u32(crc),
            ...u32(data.length),
            ...u32(data.length),
            ...u16(name.length),
            ...u16(0),
            ...name,
            ...data,
        ]);
        const central = Uint8Array.from([
            ...u32(0x02014b50),
            ...u16(20),
            ...u16(20),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u32(crc),
            ...u32(data.length),
            ...u32(data.length),
            ...u16(name.length),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u32(0),
            ...u32(offset),
            ...name,
        ]);
        locals.push(local);
        centrals.push(central);
        offset += local.length;
    });

    const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
    const end = Uint8Array.from([
        ...u32(0x06054b50),
        ...u16(0),
        ...u16(0),
        ...u16(files.length),
        ...u16(files.length),
        ...u32(centralSize),
        ...u32(offset),
        ...u16(0),
    ]);
    const bytes = new Uint8Array(offset + centralSize + end.length);
    let cursor = 0;
    [...locals, ...centrals, end].forEach((part) => {
        bytes.set(part, cursor);
        cursor += part.length;
    });
    return bytes;
}

function xmlEscape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function columnName(index) {
    let n = index + 1;
    let name = '';
    while (n > 0) {
        const rem = (n - 1) % 26;
        name = String.fromCharCode(65 + rem) + name;
        n = Math.floor((n - 1) / 26);
    }
    return name;
}

function worksheetXml(rows) {
    const body = rows.map((row, rowIndex) => {
        const cells = row.map((value, columnIndex) => {
            const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
        }).join('');
        return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

export function buildXlsx(sheetName, rows) {
    const safeName = xmlEscape(String(sheetName || 'Sheet1').slice(0, 31));
    return zipStore([
        {
            name: '[Content_Types].xml',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
        },
        {
            name: '_rels/.rels',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        },
        {
            name: 'xl/workbook.xml',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeName}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        },
        {
            name: 'xl/_rels/workbook.xml.rels',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
        },
        {
            name: 'xl/worksheets/sheet1.xml',
            data: worksheetXml(rows),
        },
    ]);
}

export function downloadXlsx(filename, sheetName, rows) {
    const bytes = buildXlsx(sheetName, rows);
    const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
