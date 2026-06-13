function doPost(event) {
    const payload = JSON.parse(event.postData.contents || '{}');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const rowNumber = Number(payload.rowNumber);
    const usedAt = payload.usedAt || new Date().toISOString();

    if (!Number.isFinite(rowNumber) || rowNumber < 2) {
        return jsonResponse({ ok: false, error: 'Invalid rowNumber' });
    }

    const headerRow = findHeaderRow(sheet);
    const usedAtColumn = findOrCreateUsedAtColumn(sheet, headerRow);

    sheet.getRange(rowNumber, usedAtColumn).setValue(usedAt);

    return jsonResponse({
        ok: true,
        rowNumber,
        usedAt,
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
    const headers = sheet
        .getRange(headerRow, 1, 1, sheet.getLastColumn())
        .getValues()[0]
        .map((value) => String(value).trim().toLowerCase());
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

function jsonResponse(payload) {
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
        ContentService.MimeType.JSON
    );
}
