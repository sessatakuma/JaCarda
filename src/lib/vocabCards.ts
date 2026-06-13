/* eslint-disable */
export type VocabCard = {
    meaning: string;
    phrase: string;
    reading: string;
    rowNumber: number;
    sentence: string;
    type: string;
    usedAt?: string;
};

export const sampleCsv = `type,phrase,reading,meaning,sentence
夏日甜品,柳橙さご,オレンジさご,"以柳橙汁、果肉和西米製成的甜品|繪師柳橙西米露的暱稱(並不是)",今日は暑すぎるので、柳橙さごを買って涼もう。`;

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
    copyright: {
        xEnd: 11.5,
        xStart: 8.5,
        yEnd: 15.5,
        yStart: 15.25,
    },
    exampleTitle: {
        xEnd: 11.5,
        xStart: 0,
        yEnd: 12,
        yStart: 10.5,
    },
    meaningBox: {
        xEnd: 11,
        xStart: 0.5,
        yEnd: 10,
        yStart: 6.5,
    },
    phrase: {
        xEnd: 11.5,
        xStart: 0,
        yEnd: 5.5,
        yStart: 3,
    },
    phraseRule: {
        xEnd: 10.5,
        xStart: 1,
        yEnd: 5.5,
        yStart: 5,
    },
    sentenceBox: {
        xEnd: 11,
        xStart: 0.5,
        yEnd: 14.5,
        yStart: 12.5,
    },
    type: {
        xEnd: 11.5,
        xStart: 0,
        yEnd: 2,
        yStart: 0.5,
    },
};

const contentWidth = guideBox(layout.meaningBox).width;

const style = {
    accent: '#6da58e',
    accentSoft: '#dceee8',
    background: '#fbfbfb',
    displayTypeface:
        '"Tsunagi Gothic", "TsunagiGothic", "A-OTF Shin Go Pr6N", "Hiragino Sans", "Yu Gothic", sans-serif',
    ink: '#242b36',
    logo: 'Sessatakuma',
    logoTypeface: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
    mutedInk: '#596579',
    typeface: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
};

const typeScales = [
    { body: 24, display: 96, heading: 48, logo: 12, name: 'default' },
    { body: 22, display: 88, heading: 44, logo: 12, name: 'compact' },
    { body: 20, display: 80, heading: 40, logo: 12, name: 'dense' },
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
    reading: [
        'reading',
        'kana',
        'furigana',
        'ruby',
        'よみ',
        '読み',
        'ふりがな',
    ],
    sentence: ['sentence', 'example', 'examples', '例句', '例文'],
    type: ['type', 'category', '分類', '類型'],
    usedAt: ['usedAt', 'used_at', 'used date', 'used up date', 'generatedAt'],
} satisfies Record<CsvField, Array<string>>;

const requiredColumns = ['phrase', 'meaning', 'sentence'] as const;

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

    return rows.slice(headerIndex + 1).map((row, index) => {
        const rawPhrase = getCell(row, columns.phrase);
        const split = splitPhraseReading(rawPhrase);
        const rawType = getCell(row, columns.type);
        const reading =
            getCell(row, columns.reading) ||
            split.reading ||
            (looksLikeReading(rawType) ? rawType : '');

        return {
            meaning: getCell(row, columns.meaning),
            phrase: split.phrase,
            reading,
            rowNumber: headerIndex + index + 2,
            sentence: getCell(row, columns.sentence),
            type:
                looksLikeReading(rawType) && !getCell(row, columns.reading)
                    ? ''
                    : rawType,
            usedAt: getCell(row, columns.usedAt) || undefined,
        };
    });
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
    const typeBox = guideBox(layout.type);
    const phraseBox = guideBox(layout.phrase);
    const phraseRuleBox = guideBox(layout.phraseRule);
    const meaningBox = guideBox(layout.meaningBox);
    const exampleTitleBox = guideBox(layout.exampleTitle);
    const sentenceBox = guideBox(layout.sentenceBox);
    const copyrightBox = guideBox(layout.copyright);
    const meaningStartY = meaningBox.y;
    const meaningLineHeight = lineHeight(scale.body);
    const sentenceStartY = sentenceBox.y;
    const phraseBlock = phraseBlockMetrics(scale);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${card.width}" height="${card.height}" viewBox="0 0 ${card.width} ${card.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(cardData.phrase)} vocabulary card</title>
<desc id="desc">Vocabulary card generated from Google Sheets or CSV.</desc>
<style>
@font-face {
    font-family: 'Tsunagi Gothic';
    font-weight: 900;
    src: url('/fonts/TsunagiGothic.ttf') format('truetype');
}
@font-face {
    font-family: 'Noto Sans JP';
    font-weight: 100 900;
    src: url('/fonts/NotoSansJP-VariableFont_wght.ttf') format('truetype');
}
text {
    font-family: ${style.typeface};
    font-weight: 900;
    fill: ${style.ink};
}
.type {
    font-family: ${style.displayTypeface};
    font-weight: 900;
    font-size: ${scale.heading}px;
    fill: ${style.accent};
    letter-spacing: 0;
}
.phrase {
    font-family: ${style.displayTypeface};
    font-weight: 900;
    font-size: ${scale.display}px;
    line-height: 1;
    color: ${style.ink};
    letter-spacing: 0;
    text-align: center;
    white-space: nowrap;
}
.phrase ruby {
    ruby-position: over;
}
.phrase rt {
    font-family: ${style.displayTypeface};
    font-size: ${scale.body}px;
    line-height: 1;
}
.heading {
    font-family: ${style.displayTypeface};
    font-weight: 900;
    font-size: ${scale.heading}px;
    fill: ${style.mutedInk};
    letter-spacing: 0;
}
.body {
    font-size: ${scale.body}px;
    fill: ${style.mutedInk};
    dominant-baseline: hanging;
}
.accent {
    fill: ${style.accent};
}
.logo {
    font-family: ${style.logoTypeface};
    font-size: ${scale.logo}px;
    fill: ${style.mutedInk};
    font-weight: 700;
    letter-spacing: 0;
}
text[data-field] {
    cursor: pointer;
}
[data-field] {
    cursor: pointer;
}
</style>
<rect width="${card.width}" height="${card.height}" fill="${style.background}"/>
<text x="${typeBox.centerX}" y="${typeBox.centerY}" class="type" data-field="type" text-anchor="middle" dominant-baseline="middle">${escapeXml(cardData.type)}</text>
<rect x="${phraseRuleBox.x}" y="${phraseRuleBox.y}" width="${phraseRuleBox.width}" height="${phraseRuleBox.height}" rx="16" fill="${style.accentSoft}"/>
${phraseRubyNode(cardData, {
    height: phraseBlock.height,
    width: phraseBox.width,
    x: phraseBox.x,
    y: phraseBox.centerY - phraseBlock.height / 2,
})}
${lineNodes(plan.meaning, {
    className: 'body',
    field: 'meaning',
    lineHeight: meaningLineHeight,
    x: meaningBox.x,
    y: meaningStartY,
})}
<text x="${exampleTitleBox.centerX}" y="${exampleTitleBox.centerY}" class="heading" text-anchor="middle" dominant-baseline="middle">例句</text>
${sentenceLineNodes(plan.sentence, cardData.phrase, {
    className: 'body',
    field: 'sentence',
    lineHeight: lineHeight(scale.body),
    x: sentenceBox.x,
    y: sentenceStartY,
})}
<text x="${copyrightBox.centerX}" y="${copyrightBox.y + copyrightBox.height}" class="logo" text-anchor="middle" dominant-baseline="text-after-edge">©2026 ${style.logo}</text>
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
    const lines: Array<MeaningLine> = [];

    for (const [index, item] of rawItems.entries()) {
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
    const phraseFits = phraseWidth <= guideBox(layout.phrase).width;
    const meaningBox = guideBox(layout.meaningBox);
    const sentenceBox = guideBox(layout.sentenceBox);
    const meaningHeight = meaning.length * lineHeight(scale.body);
    const sentenceHeight = sentence.length * lineHeight(scale.body);

    return {
        fits:
            phraseFits &&
            meaningHeight <= meaningBox.height &&
            sentenceHeight <= sentenceBox.height,
        meaning,
        sentence,
    };
}

export function formatPhraseWithReading(cardData: VocabCard): string {
    return cardData.reading
        ? `${cardData.phrase}（${cardData.reading}）`
        : cardData.phrase;
}

export function splitPhraseReading(value: string): {
    phrase: string;
    reading: string;
} {
    const trimmed = value.trim();
    const match = trimmed.match(/^(.*?)\s*[（(]([^()（）]+)[）)]\s*$/);

    if (!match) {
        return {
            phrase: trimmed,
            reading: '',
        };
    }

    return {
        phrase: match[1].trim(),
        reading: match[2].trim(),
    };
}

function looksLikeReading(value: string): boolean {
    return /^[\u3040-\u30ffー\s]+$/u.test(value.trim());
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

function sentenceLineNodes(
    lines: Array<string>,
    phrase: string,
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
            const dataField =
                options.field === undefined
                    ? ''
                    : ` data-field="${options.field}"`;
            const highlightIndex = phrase ? line.indexOf(phrase) : -1;

            if (highlightIndex === -1) {
                return `<text x="${options.x}" y="${y}" class="${options.className}"${dataField}>${escapeXml(line)}</text>`;
            }

            const before = line.slice(0, highlightIndex);
            const highlighted = line.slice(
                highlightIndex,
                highlightIndex + phrase.length
            );
            const after = line.slice(highlightIndex + phrase.length);

            return [
                `<text x="${options.x}" y="${y}" class="${options.className}"${dataField}>`,
                `<tspan>${escapeXml(before)}</tspan>`,
                `<tspan class="accent">${escapeXml(highlighted)}</tspan>`,
                `<tspan>${escapeXml(after)}</tspan>`,
                '</text>',
            ].join('');
        })
        .join('\n');
}

function lineHeight(fontSize: number): number {
    return Math.round(fontSize * 1.35);
}

function phraseBlockMetrics(scale: (typeof typeScales)[number]) {
    const readingHeight = Math.round(scale.body * 1.35);
    const phraseHeight = Math.round(scale.display * 1.02);

    return {
        height: readingHeight + phraseHeight,
    };
}

function phraseRubyNode(
    cardData: VocabCard,
    options: {
        height: number;
        width: number;
        x: number;
        y: number;
    }
): string {
    const reading = cardData.reading
        ? `<rt>${escapeXml(cardData.reading)}</rt>`
        : '';

    return [
        `<foreignObject x="${options.x}" y="${options.y}" width="${options.width}" height="${options.height}" data-field="phrase">`,
        '<div xmlns="http://www.w3.org/1999/xhtml" class="phrase">',
        `<ruby>${escapeXml(cardData.phrase)}${reading}</ruby>`,
        '</div>',
        '</foreignObject>',
    ].join('');
}

function guideX(position: number): number {
    const track = Math.trunc(position);
    const fraction = position - track;

    return (
        grid.marginLeft +
        track * (columnWidth + grid.columnGutter) +
        fraction * columnWidth
    );
}

function guideY(position: number): number {
    const track = Math.trunc(position);
    const fraction = position - track;

    return (
        grid.marginTop +
        track * (rowHeight + grid.rowGutter) +
        fraction * rowHeight
    );
}

function guideBox(box: {
    xEnd: number;
    xStart: number;
    yEnd: number;
    yStart: number;
}) {
    const x = guideX(box.xStart);
    const y = guideY(box.yStart);
    const endX = guideX(box.xEnd);
    const endY = guideY(box.yEnd);

    return {
        centerX: x + (endX - x) / 2,
        centerY: y + (endY - y) / 2,
        height: endY - y,
        width: endX - x,
        x,
        y,
    };
}
