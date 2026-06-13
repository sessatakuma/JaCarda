function doPost(event) {
    const payload = JSON.parse(event.postData.contents || '{}');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const rowNumber = Number(payload.rowNumber);

    if (!Number.isFinite(rowNumber) || rowNumber < 2) {
        return jsonResponse({ ok: false, error: 'Invalid rowNumber' });
    }

    const headerRow = findHeaderRow(sheet);
    const headers = getHeaders(sheet, headerRow);
    const updated = {};

    const editableColumns = {
        type: ['type', 'category', 'reading', '分類', '類型'],
        phrase: ['phrase', 'word', 'vocab', 'term', '語彙', '詞'],
        meaning: [
            'meaning',
            'meanings',
            'definition',
            'definitions',
            'explanation',
            '意思',
        ],
        sentence: ['sentence', 'example', 'examples', '例句', '例文'],
    };

    Object.keys(editableColumns).forEach((field) => {
        if (payload[field] === undefined) {
            return;
        }

        const column = findColumn(headers, editableColumns[field]);
        if (column === -1) {
            return;
        }

        sheet.getRange(rowNumber, column + 1).setValue(payload[field]);
        updated[field] = payload[field];
    });

    if (payload.usedAt) {
        const usedAtColumn = findOrCreateUsedAtColumn(sheet, headerRow);
        sheet.getRange(rowNumber, usedAtColumn).setValue(payload.usedAt);
        updated.usedAt = payload.usedAt;
    }

    return jsonResponse({
        ok: true,
        rowNumber,
        updated,
    });
}

function findHeaderRow(sheet) {
    const maxRows = Math.min(sheet.getLastRow(), 10);

    for (let row = 1; row <= maxRows; row += 1) {
        const values = sheet
            .getRange(row, 1, 1, sheet.getLastColumn())
            .getValues()[0]
            .map((value) => String(value).trim().toLowerCase());

        if (values.includes('term') || values.includes('phrase')) {
            return row;
        }
    }

    return 1;
}

function findOrCreateUsedAtColumn(sheet, headerRow) {
    const headers = getHeaders(sheet, headerRow);
    const existingIndex = headers.findIndex((header) =>
        [
            'usedat',
            'used_at',
            'used date',
            'used up date',
            'generatedat',
        ].includes(header)
    );

    if (existingIndex !== -1) {
        return existingIndex + 1;
    }

    const nextColumn = sheet.getLastColumn() + 1;
    sheet.getRange(headerRow, nextColumn).setValue('usedAt');

    return nextColumn;
}

function getHeaders(sheet, headerRow) {
    return sheet
        .getRange(headerRow, 1, 1, sheet.getLastColumn())
        .getValues()[0]
        .map(normalizeHeader);
}

function findColumn(headers, aliases) {
    const normalizedAliases = aliases.map(normalizeHeader);

    return headers.findIndex((header) => normalizedAliases.includes(header));
}

function normalizeHeader(value) {
    return String(value).trim().toLowerCase();
}

function jsonResponse(payload) {
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
        ContentService.MimeType.JSON
    );
}
