/* eslint-disable */
export type VocabCard = {
    meaning: string;
    phrase: string;
    rowNumber: number;
    sentence: string;
    type: string;
    usedAt?: string;
};

export const sampleCsv = `type,phrase,meaning,sentence
夏日甜品,柳橙さご,"以柳橙汁、果肉和西米製成的甜品|繪師柳橙西米露的暱稱(並不是)",今天は暑すぎるので、柳橙さごを買って涼もう。`;

const card = {
    height: 1350,
    width: 1080,
};

const grid = {
    columnGutter: 24,
    columns: 12,
    marginBottom: 36,
    marginLeft: 48,
    marginRight: 48,
    marginTop: 36,
    rowGutter: 24,
    rows: 16,
};

const gridWidth = card.width - grid.marginLeft - grid.marginRight;
const gridHeight = card.height - grid.marginTop - grid.marginBottom;
const columnWidth =
    (gridWidth - (grid.columns - 1) * grid.columnGutter) / grid.columns;
const rowHeight = (gridHeight - (grid.rows - 1) * grid.rowGutter) / grid.rows;

const layout = {
    exampleBox: {
        columnEnd: 12,
        columnStart: 2,
        rowEnd: 15,
        rowStart: 13,
    },
    exampleTitle: {
        row: 12,
    },
    logo: {
        columnEnd: 12,
        columnStart: 10,
        row: 16,
    },
    meaningBox: {
        columnEnd: 12,
        columnStart: 2,
        rowEnd: 10,
        rowStart: 8,
    },
    phrase: {
        row: 5,
    },
    phraseRule: {
        columnEnd: 12,
        columnStart: 2,
        row: 6,
    },
    type: {
        row: 2,
    },
};

const contentWidth = gridBox(2, 12).width;

const style = {
    accent: '#6da58e',
    accentSoft: '#dceee8',
    background: '#fbfbfb',
    ink: '#242b36',
    logo: 'Sessatakuma',
    mutedInk: '#596579',
    typeface:
        '"A-OTF Shin Go Pr6N", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
};

const typeScales = [
    { body: 52, display: 160, heading: 84, name: 'default' },
    { body: 44, display: 136, heading: 72, name: 'compact' },
    { body: 36, display: 112, heading: 60, name: 'dense' },
];

type CsvField = Exclude<keyof VocabCard, 'rowNumber'>;

const columnAliases = {
    meaning: [
        'meaning',
        'meanings',
        'definition',
        'definitions',
        'explanation',
        '意思',
    ],
    phrase: ['phrase', 'word', 'vocab', 'term', '語彙', '詞'],
    sentence: ['sentence', 'example', 'examples', '例句', '例文'],
    type: ['type', 'category', 'reading', '分類', '類型'],
    usedAt: ['usedAt', 'used_at', 'used date', 'used up date', 'generatedAt'],
} satisfies Record<CsvField, Array<string>>;

const requiredColumns = ['type', 'phrase', 'meaning', 'sentence'] as const;

type MeaningLine = {
    prefix: string;
    text: string;
};

export function parseCsvCards(content: string): Array<VocabCard> {
    const rows = parseCsv(content);

    if (rows.length < 2) {
        throw new Error('Expected a header row and at least one card row.');
    }

    const headerIndex = findHeaderRowIndex(rows);
    const headers = rows[headerIndex].map(normalizeHeader);
    const columns = Object.fromEntries(
        Object.entries(columnAliases).map(([key, aliases]) => [
            key,
            findColumn(headers, aliases),
        ])
    ) as Record<CsvField, number>;
    const missing = requiredColumns.filter((key) => columns[key] === -1);

    if (missing.length > 0) {
        throw new Error(`Missing required column(s): ${missing.join(', ')}`);
    }

    return rows.slice(headerIndex + 1).map((row, index) => ({
        meaning: getCell(row, columns.meaning),
        phrase: getCell(row, columns.phrase),
        rowNumber: headerIndex + index + 2,
        sentence: getCell(row, columns.sentence),
        type: getCell(row, columns.type),
        usedAt: getCell(row, columns.usedAt) || undefined,
    }));
}

function findHeaderRowIndex(rows: Array<Array<string>>): number {
    const index = rows.findIndex((row) => {
        const headers = row.map(normalizeHeader);

        return requiredColumns.every((key) =>
            columnAliases[key].some((alias) =>
                headers.some(
                    (header) => header.toLowerCase() === alias.toLowerCase()
                )
            )
        );
    });

    return index === -1 ? 0 : index;
}

export async function fetchSheetCards(
    sheetUrl: string
): Promise<Array<VocabCard>> {
    const csvUrl = googleSheetCsvUrl(sheetUrl) ?? sheetUrl;
    const response = await fetch(csvUrl);

    if (!response.ok) {
        throw new Error(
            `Could not fetch Sheet (${response.status} ${response.statusText}). Make sure it is public or published.`
        );
    }

    const text = await response.text();
    if (/^\s*<!doctype html/i.test(text) || /<html[\s>]/i.test(text)) {
        throw new Error(
            'The URL returned HTML instead of CSV. Use a public Sheet URL or a published CSV URL.'
        );
    }

    return parseCsvCards(text);
}

export function googleSheetCsvUrl(value: string): string | undefined {
    const url = new URL(value);

    if (url.hostname !== 'docs.google.com') {
        return undefined;
    }

    if (!url.pathname.includes('/spreadsheets/')) {
        return undefined;
    }

    const gid = url.searchParams.get('gid') ?? extractGid(url.hash) ?? '0';
    const publishedIdMatch = url.pathname.match(
        /\/spreadsheets\/d\/e\/([^/]+)/
    );

    if (publishedIdMatch) {
        return `https://docs.google.com/spreadsheets/d/e/${publishedIdMatch[1]}/pub?output=csv&gid=${encodeURIComponent(gid)}`;
    }

    const sheetIdMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
    if (!sheetIdMatch) {
        return undefined;
    }

    return `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

export function renderVocabCard(cardData: VocabCard): string {
    const plan = choosePlan(cardData);
    const { scale } = plan;
    const centerX = card.width / 2;
    const meaningBox = gridArea(
        layout.meaningBox.columnStart,
        layout.meaningBox.columnEnd,
        layout.meaningBox.rowStart,
        layout.meaningBox.rowEnd
    );
    const exampleBox = gridArea(
        layout.exampleBox.columnStart,
        layout.exampleBox.columnEnd,
        layout.exampleBox.rowStart,
        layout.exampleBox.rowEnd
    );
    const logoBox = gridBox(layout.logo.columnStart, layout.logo.columnEnd);
    const phraseRuleBox = gridBox(
        layout.phraseRule.columnStart,
        layout.phraseRule.columnEnd
    );
    const meaningStartY = meaningBox.y + scale.body;
    const exampleTitleY =
        rowCenterY(layout.exampleTitle.row) + scale.heading / 3;
    const sentenceStartY = exampleBox.y + scale.body;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${card.width}" height="${card.height}" viewBox="0 0 ${card.width} ${card.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(cardData.phrase)} vocabulary card</title>
<desc id="desc">Vocabulary card generated from Google Sheets or CSV.</desc>
<style>
text {
    font-family: ${style.typeface};
    font-weight: 800;
    fill: ${style.ink};
}
.type {
    font-size: ${scale.heading}px;
    fill: ${style.accent};
    letter-spacing: 0.08em;
}
.phrase {
    font-size: ${scale.display}px;
    letter-spacing: 0.02em;
}
.heading {
    font-size: ${scale.heading}px;
    fill: ${style.mutedInk};
    letter-spacing: 0.04em;
}
.body {
    font-size: ${scale.body}px;
    fill: ${style.mutedInk};
}
.logo {
    font-size: 28px;
    fill: ${style.mutedInk};
    font-weight: 700;
    letter-spacing: 0;
}
text[data-field] {
    cursor: pointer;
}
</style>
<rect width="${card.width}" height="${card.height}" fill="${style.background}"/>
<text x="${centerX}" y="${rowLineY(layout.type.row) + scale.heading}" class="type" data-field="type" text-anchor="middle">${escapeXml(cardData.type)}</text>
<rect x="${phraseRuleBox.x}" y="${rowLineY(layout.phraseRule.row)}" width="${phraseRuleBox.width}" height="${rowHeight}" rx="16" fill="${style.accentSoft}"/>
<text x="${centerX}" y="${rowLineY(layout.phrase.row) + scale.display * 0.8}" class="phrase" data-field="phrase" text-anchor="middle">${escapeXml(cardData.phrase)}</text>
${lineNodes(plan.meaning, {
    className: 'body',
    field: 'meaning',
    lineHeight: lineHeight(scale.body),
    x: meaningBox.x,
    y: meaningStartY,
})}
<text x="${centerX}" y="${exampleTitleY}" class="heading" text-anchor="middle">例句</text>
${lineNodes(plan.sentence, {
    className: 'body',
    field: 'sentence',
    lineHeight: lineHeight(scale.body),
    x: exampleBox.x,
    y: sentenceStartY,
})}
<text x="${logoBox.x}" y="${rowLineY(layout.logo.row) + rowHeight}" class="logo">©2026 ${style.logo}</text>
</svg>
`;
}

export function slugify(value: string, fallback: string): string {
    const slug = value
        .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

    return slug || fallback;
}

function parseCsv(content: string): Array<Array<string>> {
    const rows: Array<Array<string>> = [];
    let field = '';
    let row: Array<string> = [];
    let inQuotes = false;

    for (let index = 0; index < content.length; index += 1) {
        const char = content[index];
        const next = content[index + 1];

        if (char === '"' && inQuotes && next === '"') {
            field += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(field);
            field = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') {
                index += 1;
            }

            row.push(field);
            if (row.some((value) => value.trim() !== '')) {
                rows.push(row);
            }
            row = [];
            field = '';
            continue;
        }

        field += char;
    }

    row.push(field);
    if (row.some((value) => value.trim() !== '')) {
        rows.push(row);
    }

    if (inQuotes) {
        throw new Error('CSV has an unclosed quoted field.');
    }

    return rows;
}

function normalizeHeader(value: string): string {
    return value.trim().replace(/^\uFEFF/, '');
}

function findColumn(headers: Array<string>, aliases: Array<string>): number {
    return headers.findIndex((header) =>
        aliases.some((alias) => header.toLowerCase() === alias.toLowerCase())
    );
}

function getCell(row: Array<string>, index: number): string {
    return index >= 0 ? (row[index] ?? '').trim() : '';
}

function extractGid(hash: string): string | undefined {
    const match = hash.match(/gid=(\d+)/);
    return match?.[1];
}

function escapeXml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

function characterWeight(char: string): number {
    if (/\s/.test(char)) {
        return 0.33;
    }

    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(char)) {
        return 1;
    }

    if (/[A-Z]/.test(char)) {
        return 0.72;
    }

    if (/[a-z0-9]/.test(char)) {
        return 0.56;
    }

    return 0.62;
}

function estimateTextWidth(text: string, fontSize: number): number {
    return [...text].reduce(
        (width, char) => width + characterWeight(char) * fontSize,
        0
    );
}

function wrapText(
    text: string,
    fontSize: number,
    maxWidth: number
): Array<string> {
    const paragraphs = text
        .replaceAll('\\n', '\n')
        .split(/\n+/)
        .flatMap((paragraph) => paragraph.split(/\s*[;|]\s*/).filter(Boolean));
    const lines: Array<string> = [];

    for (const paragraph of paragraphs) {
        let line = '';

        for (const char of [...paragraph.trim()]) {
            const candidate = `${line}${char}`;
            if (line && estimateTextWidth(candidate, fontSize) > maxWidth) {
                lines.push(line);
                line = char.trimStart();
                continue;
            }

            line = candidate;
        }

        if (line) {
            lines.push(line);
        }
    }

    return lines.length > 0 ? lines : [''];
}

function meaningLines(meaning: string, scale: (typeof typeScales)[number]) {
    const rawItems = meaning
        .replaceAll('\\n', '\n')
        .split(/\n+|[;|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    const items = rawItems.length > 0 ? rawItems : [meaning];
    const lines: Array<MeaningLine> = [];

    for (const [index, item] of items.entries()) {
        const prefix = `${index + 1}. `;
        const wrapped = wrapText(item, scale.body, contentWidth - 24);
        for (const [lineIndex, line] of wrapped.entries()) {
            lines.push({
                prefix: lineIndex === 0 ? prefix : '   ',
                text: line,
            });
        }
    }

    return lines;
}

function textPlan(cardData: VocabCard, scale: (typeof typeScales)[number]) {
    const meaning = meaningLines(cardData.meaning, scale);
    const sentence = wrapText(cardData.sentence, scale.body, contentWidth);
    const phraseWidth = estimateTextWidth(cardData.phrase, scale.display);
    const phraseFits = phraseWidth <= contentWidth;
    const meaningBox = rowBox(
        layout.meaningBox.rowStart,
        layout.meaningBox.rowEnd
    );
    const exampleBox = rowBox(
        layout.exampleBox.rowStart,
        layout.exampleBox.rowEnd
    );
    const meaningHeight = meaning.length * lineHeight(scale.body);
    const sentenceHeight = sentence.length * lineHeight(scale.body);

    return {
        fits:
            phraseFits &&
            meaningHeight <= meaningBox.height &&
            sentenceHeight <= exampleBox.height,
        meaning,
        sentence,
    };
}

function choosePlan(cardData: VocabCard) {
    for (const scale of typeScales) {
        const plan = textPlan(cardData, scale);
        if (plan.fits) {
            return { ...plan, scale };
        }
    }

    const scale = typeScales.at(-1);

    if (scale === undefined) {
        throw new Error('Expected at least one typography scale.');
    }

    return { ...textPlan(cardData, scale), scale };
}

function lineNodes(
    lines: Array<string> | Array<MeaningLine>,
    options: {
        className: string;
        field?: keyof VocabCard;
        lineHeight: number;
        x: number;
        y: number;
    }
): string {
    return lines
        .map((line, index) => {
            const y = options.y + index * options.lineHeight;
            const prefix =
                typeof line === 'object' && 'prefix' in line ? line.prefix : '';
            const text =
                typeof line === 'object' && 'text' in line ? line.text : line;
            const dataField =
                options.field === undefined
                    ? ''
                    : ` data-field="${options.field}"`;

            if (!prefix) {
                return `<text x="${options.x}" y="${y}" class="${options.className}"${dataField}>${escapeXml(text)}</text>`;
            }

            return [
                `<text x="${options.x}" y="${y}" class="${options.className}"${dataField}>`,
                `<tspan>${escapeXml(prefix)}</tspan>`,
                `<tspan>${escapeXml(text)}</tspan>`,
                '</text>',
            ].join('');
        })
        .join('\n');
}

function lineHeight(fontSize: number): number {
    return Math.round(fontSize * 1.35);
}

function gridLineX(column: number): number {
    return grid.marginLeft + (column - 1) * (columnWidth + grid.columnGutter);
}

function gridBox(columnStart: number, columnEnd: number) {
    const x = gridLineX(columnStart);
    const endX = gridLineX(columnEnd) + columnWidth;

    return {
        width: endX - x,
        x,
    };
}

function rowLineY(row: number): number {
    return grid.marginTop + (row - 1) * (rowHeight + grid.rowGutter);
}

function rowCenterY(row: number): number {
    return rowLineY(row) + rowHeight / 2;
}

function rowBox(rowStart: number, rowEnd: number) {
    const y = rowLineY(rowStart);
    const endY = rowLineY(rowEnd) + rowHeight;

    return {
        height: endY - y,
        y,
    };
}

function gridArea(
    columnStart: number,
    columnEnd: number,
    rowStart: number,
    rowEnd: number
) {
    return {
        ...gridBox(columnStart, columnEnd),
        ...rowBox(rowStart, rowEnd),
    };
}
