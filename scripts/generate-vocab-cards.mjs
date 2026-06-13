#!/usr/bin/env bun
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CARD = {
    height: 1350,
    width: 1080,
};

const GRID = {
    columnGutter: 24,
    columns: 12,
    marginBottom: 36,
    marginLeft: 48,
    marginRight: 48,
    marginTop: 36,
    rowGutter: 24,
    rows: 16,
};

const GRID_WIDTH = CARD.width - GRID.marginLeft - GRID.marginRight;
const GRID_HEIGHT = CARD.height - GRID.marginTop - GRID.marginBottom;
const COLUMN_WIDTH =
    (GRID_WIDTH - (GRID.columns - 1) * GRID.columnGutter) / GRID.columns;
const ROW_HEIGHT = (GRID_HEIGHT - (GRID.rows - 1) * GRID.rowGutter) / GRID.rows;

const LAYOUT = {
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

const CONTENT_WIDTH = guideBox(LAYOUT.meaningBox).width;

const STYLE = {
    background: '#fbfbfb',
    ink: '#242b36',
    mutedInk: '#596579',
    accent: '#6da58e',
    accentSoft: '#dceee8',
    displayTypeface:
        '"Tsunagi Gothic", "TsunagiGothic", "A-OTF Shin Go Pr6N", "Hiragino Sans", "Yu Gothic", sans-serif',
    logoTypeface: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
    typeface: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
    logo: 'Sessatakuma',
};

const TYPE_SCALES = [
    { body: 32, display: 128, heading: 64, logo: 16, name: 'default' },
    { body: 29.33, display: 117.33, heading: 58.67, logo: 16, name: 'compact' },
    { body: 26.67, display: 106.67, heading: 53.33, logo: 16, name: 'dense' },
];

const REQUIRED_COLUMNS = ['phrase', 'meaning', 'sentence'];

const COLUMN_ALIASES = {
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
};

function usage() {
    return [
        'Usage: bun run cards <input.csv|google-sheet-url> [output-dir]',
        '',
        'CSV columns:',
        '  phrase, meaning, sentence',
        '',
        'Notes:',
        '  - Optional type and reading columns are supported.',
        '  - Phrase can include reading as 散歩（さんぽ）; output renders it separately.',
        '  - Google Sheets must be public, published, or otherwise exportable without login.',
        '  - 例句 and ©2026 Sessatakuma are fixed template text.',
        '  - Separate multiple meanings with newlines, semicolons, or pipes.',
        '  - Output is SVG so the cards stay editable and print-ready.',
    ].join('\n');
}

function parseArgs(argv) {
    const [, , input, output = 'dist/cards'] = argv;

    if (!input || input === '--help' || input === '-h') {
        console.log(usage());
        process.exit(input ? 0 : 1);
    }

    return {
        input: isHttpUrl(input) ? input : path.resolve(input),
        output: path.resolve(output),
    };
}

async function readInputText(input) {
    if (!isHttpUrl(input)) {
        return readFile(input, 'utf8');
    }

    const csvUrl = googleSheetCsvUrl(input) ?? input;
    const response = await fetch(csvUrl);

    if (!response.ok) {
        throw new Error(
            `Could not fetch input URL (${response.status} ${response.statusText}). ` +
                'If this is a Google Sheet, make it public or publish it to the web.'
        );
    }

    const text = await response.text();
    if (/^\s*<!doctype html/i.test(text) || /<html[\s>]/i.test(text)) {
        throw new Error(
            'Input URL returned HTML instead of CSV. For Google Sheets, use a shareable Sheet URL with public access or a published CSV URL.'
        );
    }

    return text;
}

function isHttpUrl(value) {
    return /^https?:\/\//i.test(value);
}

function googleSheetCsvUrl(value) {
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

function extractGid(hash) {
    const match = hash.match(/gid=(\d+)/);
    return match?.[1];
}

function parseCsv(content) {
    const rows = [];
    let field = '';
    let row = [];
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

function normalizeHeader(value) {
    return value.trim().replace(/^\uFEFF/, '');
}

function findColumn(headers, aliases) {
    return headers.findIndex((header) =>
        aliases.some((alias) => header.toLowerCase() === alias.toLowerCase())
    );
}

function recordsFromCsv(rows) {
    if (rows.length < 2) {
        throw new Error(
            'CSV must contain a header row and at least one card row.'
        );
    }

    const headerIndex = findHeaderRowIndex(rows);
    const headers = rows[headerIndex].map(normalizeHeader);
    const columns = Object.fromEntries(
        Object.entries(COLUMN_ALIASES).map(([key, aliases]) => [
            key,
            findColumn(headers, aliases),
        ])
    );

    const missing = REQUIRED_COLUMNS.filter((key) => columns[key] === -1);
    if (missing.length > 0) {
        throw new Error(
            `CSV is missing required column(s): ${missing.join(', ')}`
        );
    }

    return rows
        .slice(headerIndex + 1)
        .map((row, index) => {
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
                sentence: getCell(row, columns.sentence),
                type:
                    looksLikeReading(rawType) && !getCell(row, columns.reading)
                        ? ''
                        : rawType,
                usedAt: getCell(row, columns.usedAt),
                rowNumber: headerIndex + index + 2,
            };
        })
        .filter((record) => !record.usedAt);
}

function findHeaderRowIndex(rows) {
    const index = rows.findIndex((row) => {
        const headers = row.map(normalizeHeader);

        return REQUIRED_COLUMNS.every((key) =>
            COLUMN_ALIASES[key].some((alias) =>
                headers.some(
                    (header) => header.toLowerCase() === alias.toLowerCase()
                )
            )
        );
    });

    return index === -1 ? 0 : index;
}

function getCell(row, index) {
    return index >= 0 ? (row[index] ?? '').trim() : '';
}

function splitPhraseReading(value) {
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

function looksLikeReading(value) {
    return /^[\u3040-\u30ffー\s]+$/u.test(value.trim());
}

function escapeXml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

function characterWeight(char) {
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

function estimateTextWidth(text, fontSize) {
    return [...text].reduce(
        (width, char) => width + characterWeight(char) * fontSize,
        0
    );
}

function wrapText(text, fontSize, maxWidth) {
    const paragraphs = text
        .replaceAll('\\n', '\n')
        .split(/\n+/)
        .flatMap((paragraph) => paragraph.split(/\s*[;|]\s*/).filter(Boolean));
    const lines = [];

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

function meaningLines(meaning, scale) {
    const rawItems = meaning
        .replaceAll('\\n', '\n')
        .split(/\n+|[;|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    const items = rawItems.length > 0 ? rawItems : [meaning];
    const lines = [];

    for (const [index, item] of items.entries()) {
        const prefix = `${index + 1}. `;
        const wrapped = wrapText(item, scale.body, CONTENT_WIDTH - 24);
        for (const [lineIndex, line] of wrapped.entries()) {
            lines.push({
                prefix: lineIndex === 0 ? prefix : '   ',
                text: line,
            });
        }
    }

    return lines;
}

function textPlan(card, scale) {
    const meaning = meaningLines(card.meaning, scale);
    const sentence = wrapText(card.sentence, scale.body, CONTENT_WIDTH);
    const phraseWidth = estimateTextWidth(card.phrase, scale.display);
    const phraseFits = phraseWidth <= guideBox(LAYOUT.phrase).width;
    const meaningBox = guideBox(LAYOUT.meaningBox);
    const sentenceBox = guideBox(LAYOUT.sentenceBox);
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

function choosePlan(card) {
    for (const scale of TYPE_SCALES) {
        const plan = textPlan(card, scale);
        if (plan.fits) {
            return { ...plan, scale };
        }
    }

    const scale = TYPE_SCALES.at(-1);
    return { ...textPlan(card, scale), scale };
}

function lineNodes(lines, options) {
    return lines
        .map((line, index) => {
            const y = options.y + index * options.lineHeight;
            const prefix =
                typeof line === 'object' && 'prefix' in line ? line.prefix : '';
            const text =
                typeof line === 'object' && 'text' in line ? line.text : line;

            if (!prefix) {
                return `<text x="${options.x}" y="${y}" class="${options.className}">${escapeXml(text)}</text>`;
            }

            return [
                `<text x="${options.x}" y="${y}" class="${options.className}">`,
                `<tspan>${escapeXml(prefix)}</tspan>`,
                `<tspan>${escapeXml(text)}</tspan>`,
                '</text>',
            ].join('');
        })
        .join('\n');
}

function renderCard(card) {
    const plan = choosePlan(card);
    const { scale } = plan;
    const typeBox = guideBox(LAYOUT.type);
    const phraseBox = guideBox(LAYOUT.phrase);
    const phraseRuleBox = guideBox(LAYOUT.phraseRule);
    const meaningBox = guideBox(LAYOUT.meaningBox);
    const exampleTitleBox = guideBox(LAYOUT.exampleTitle);
    const sentenceBox = guideBox(LAYOUT.sentenceBox);
    const copyrightBox = guideBox(LAYOUT.copyright);
    const meaningStartY = meaningBox.y;
    const meaningLineHeight = lineHeight(scale.body);
    const sentenceStartY = sentenceBox.y;
    const phraseBlock = phraseBlockMetrics(scale);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CARD.width}" height="${CARD.height}" viewBox="0 0 ${CARD.width} ${CARD.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(card.phrase)} vocabulary card</title>
<desc id="desc">Vocabulary card generated from CSV row ${card.rowNumber}.</desc>
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
    font-family: ${STYLE.typeface};
    font-weight: 900;
    fill: ${STYLE.ink};
}
.type {
    font-family: ${STYLE.displayTypeface};
    font-weight: 900;
    font-size: ${scale.heading}px;
    fill: ${STYLE.accent};
    letter-spacing: 0;
}
.phrase {
    font-family: ${STYLE.displayTypeface};
    font-weight: 900;
    font-size: ${scale.display}px;
    line-height: 1;
    color: ${STYLE.ink};
    letter-spacing: 0;
    text-align: center;
    white-space: nowrap;
}
.phrase ruby {
    ruby-position: over;
}
.phrase rt {
    font-family: ${STYLE.displayTypeface};
    font-size: ${scale.body}px;
    line-height: 1;
}
.heading {
    font-family: ${STYLE.displayTypeface};
    font-weight: 900;
    font-size: ${scale.heading}px;
    fill: ${STYLE.mutedInk};
    letter-spacing: 0;
}
.body {
    font-size: ${scale.body}px;
    fill: ${STYLE.mutedInk};
    dominant-baseline: hanging;
}
.accent {
    fill: ${STYLE.accent};
}
.logo {
    font-family: ${STYLE.logoTypeface};
    font-size: ${scale.logo}px;
    fill: ${STYLE.mutedInk};
    font-weight: 700;
    letter-spacing: 0;
}
</style>
<rect width="${CARD.width}" height="${CARD.height}" fill="${STYLE.background}"/>
<text x="${typeBox.centerX}" y="${typeBox.centerY}" class="type" text-anchor="middle" dominant-baseline="middle">${escapeXml(card.type)}</text>
<rect x="${phraseRuleBox.x}" y="${phraseRuleBox.y}" width="${phraseRuleBox.width}" height="${phraseRuleBox.height}" rx="16" fill="${STYLE.accentSoft}"/>
${phraseRubyNode(card, {
    height: phraseBlock.height,
    width: phraseBox.width,
    x: phraseBox.x,
    y: phraseBox.centerY - phraseBlock.height / 2,
})}
${lineNodes(plan.meaning, {
    className: 'body',
    lineHeight: meaningLineHeight,
    x: meaningBox.x,
    y: meaningStartY,
})}
<text x="${exampleTitleBox.centerX}" y="${exampleTitleBox.centerY}" class="heading" text-anchor="middle" dominant-baseline="middle">例句</text>
${sentenceLineNodes(plan.sentence, card.phrase, {
    className: 'body',
    lineHeight: lineHeight(scale.body),
    x: sentenceBox.x,
    y: sentenceStartY,
})}
<text x="${copyrightBox.centerX}" y="${copyrightBox.y + copyrightBox.height}" class="logo" text-anchor="middle" dominant-baseline="text-after-edge">©2026 ${STYLE.logo}</text>
</svg>
`;
}

function lineHeight(fontSize) {
    return Math.round(fontSize * 1.35);
}

function sentenceLineNodes(lines, phrase, options) {
    return lines
        .map((line, index) => {
            const y = options.y + index * options.lineHeight;
            const highlightIndex = phrase ? line.indexOf(phrase) : -1;

            if (highlightIndex === -1) {
                return `<text x="${options.x}" y="${y}" class="${options.className}">${escapeXml(line)}</text>`;
            }

            const before = line.slice(0, highlightIndex);
            const highlighted = line.slice(
                highlightIndex,
                highlightIndex + phrase.length
            );
            const after = line.slice(highlightIndex + phrase.length);

            return [
                `<text x="${options.x}" y="${y}" class="${options.className}">`,
                `<tspan>${escapeXml(before)}</tspan>`,
                `<tspan class="accent">${escapeXml(highlighted)}</tspan>`,
                `<tspan>${escapeXml(after)}</tspan>`,
                '</text>',
            ].join('');
        })
        .join('\n');
}

function phraseBlockMetrics(scale) {
    const readingHeight = Math.round(scale.body * 1.35);
    const phraseHeight = Math.round(scale.display * 1.02);

    return {
        height: readingHeight + phraseHeight,
    };
}

function phraseRubyNode(card, options) {
    const reading = card.reading ? `<rt>${escapeXml(card.reading)}</rt>` : '';

    return [
        `<foreignObject x="${options.x}" y="${options.y}" width="${options.width}" height="${options.height}">`,
        '<div xmlns="http://www.w3.org/1999/xhtml" class="phrase">',
        `<ruby>${escapeXml(card.phrase)}${reading}</ruby>`,
        '</div>',
        '</foreignObject>',
    ].join('');
}

function guideX(position) {
    const track = Math.trunc(position);
    const fraction = position - track;

    return (
        GRID.marginLeft +
        track * (COLUMN_WIDTH + GRID.columnGutter) +
        fraction * COLUMN_WIDTH
    );
}

function guideY(position) {
    const track = Math.trunc(position);
    const fraction = position - track;

    return (
        GRID.marginTop +
        track * (ROW_HEIGHT + GRID.rowGutter) +
        fraction * ROW_HEIGHT
    );
}

function guideBox(box) {
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

function slugify(value, fallback) {
    const slug = value
        .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

    return slug || fallback;
}

function renderIndex(files) {
    const links = files
        .map(
            (file) =>
                `<li><a href="./${escapeXml(file.name)}">${escapeXml(file.title)}</a></li>`
        )
        .join('\n');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vocabulary Cards</title>
<style>
body {
    margin: 32px;
    font-family: sans-serif;
    background: ${STYLE.background};
    color: ${STYLE.ink};
}
a {
    color: inherit;
}
</style>
</head>
<body>
<h1>Vocabulary Cards</h1>
<ol>
${links}
</ol>
</body>
</html>
`;
}

async function main() {
    const args = parseArgs(process.argv);
    const csv = await readInputText(args.input);
    const records = recordsFromCsv(parseCsv(csv));

    await mkdir(args.output, { recursive: true });

    const files = [];
    for (const [index, record] of records.entries()) {
        const basename = `${String(index + 1).padStart(3, '0')}-${slugify(record.phrase, 'card')}.svg`;
        await writeFile(
            path.join(args.output, basename),
            renderCard(record),
            'utf8'
        );
        files.push({ name: basename, title: record.phrase });
    }

    await writeFile(
        path.join(args.output, 'index.html'),
        renderIndex(files),
        'utf8'
    );
    console.log(`Generated ${files.length} card(s) in ${args.output}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
