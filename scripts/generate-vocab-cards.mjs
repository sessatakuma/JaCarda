#!/usr/bin/env bun
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CARD = {
    height: 512,
    width: 408,
};

const GRID = {
    columnGap: 16,
    columns: 4,
    margin: 40,
    row: 4,
};

const CONTENT_WIDTH = CARD.width - GRID.margin * 2;

const STYLE = {
    background: '#fbfbfb',
    ink: '#242b36',
    mutedInk: '#596579',
    accent: '#6da58e',
    accentSoft: '#dceee8',
    typeface:
        '"A-OTF Shin Go Pr6N", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
    logo: 'Sessatakuma',
};

const TYPE_SCALES = [
    { body: 20, display: 56, heading: 32, name: 'default' },
    { body: 16, display: 48, heading: 28, name: 'compact' },
    { body: 16, display: 40, heading: 24, name: 'dense' },
];

const REQUIRED_COLUMNS = ['type', 'phrase', 'meaning', 'sentence'];

const COLUMN_ALIASES = {
    meaning: ['meaning', 'meanings', 'definition', 'definitions', '意思'],
    phrase: ['phrase', 'word', 'vocab', '語彙', '詞'],
    sentence: ['sentence', 'example', '例句', '例文'],
    type: ['type', 'category', '分類', '類型'],
};

function usage() {
    return [
        'Usage: bun run cards <input.csv> [output-dir]',
        '',
        'CSV columns:',
        '  type, phrase, meaning, sentence',
        '',
        'Notes:',
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
        input: path.resolve(input),
        output: path.resolve(output),
    };
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

    const headers = rows[0].map(normalizeHeader);
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

    return rows.slice(1).map((row, index) => ({
        meaning: getCell(row, columns.meaning),
        phrase: getCell(row, columns.phrase),
        sentence: getCell(row, columns.sentence),
        type: getCell(row, columns.type),
        rowNumber: index + 2,
    }));
}

function getCell(row, index) {
    return index >= 0 ? (row[index] ?? '').trim() : '';
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
    const phraseFits = phraseWidth <= CONTENT_WIDTH;
    const totalHeight =
        36 +
        scale.heading +
        12 +
        scale.display +
        64 +
        meaning.length * scale.body * 1.55 +
        56 +
        scale.heading +
        24 +
        sentence.length * scale.body * 1.55 +
        28;

    return {
        fits:
            phraseFits &&
            meaning.length <= 5 &&
            sentence.length <= 4 &&
            totalHeight <= 484,
        meaning,
        sentence,
        totalHeight,
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
    const meaningStartY = 228;
    const meaningLineHeight = snap(scale.body * 1.55);
    const exampleTitleY = Math.max(
        352,
        snap(meaningStartY + plan.meaning.length * meaningLineHeight + 52)
    );
    const sentenceStartY = snap(exampleTitleY + 48);
    const underlineWidth = Math.min(
        308,
        snap(Math.max(176, estimateTextWidth(card.phrase, scale.display) + 16))
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CARD.width}" height="${CARD.height}" viewBox="0 0 ${CARD.width} ${CARD.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(card.phrase)} vocabulary card</title>
<desc id="desc">Vocabulary card generated from CSV row ${card.rowNumber}.</desc>
<style>
text {
    font-family: ${STYLE.typeface};
    font-weight: 800;
    fill: ${STYLE.ink};
}
.type {
    font-size: ${scale.heading}px;
    fill: ${STYLE.accent};
    letter-spacing: 0.08em;
}
.phrase {
    font-size: ${scale.display}px;
    letter-spacing: 0.02em;
}
.heading {
    font-size: ${scale.heading}px;
    fill: ${STYLE.mutedInk};
    letter-spacing: 0.04em;
}
.body {
    font-size: ${scale.body}px;
    fill: ${STYLE.mutedInk};
}
.accent {
    fill: ${STYLE.accent};
}
.logo {
    font-size: 8px;
    fill: ${STYLE.mutedInk};
    font-weight: 700;
    letter-spacing: 0;
}
</style>
<rect width="${CARD.width}" height="${CARD.height}" fill="${STYLE.background}"/>
<text x="204" y="67" class="type" text-anchor="middle">${escapeXml(card.type)}</text>
<rect x="${(CARD.width - underlineWidth) / 2}" y="168" width="${underlineWidth}" height="22" rx="4" fill="${STYLE.accentSoft}"/>
<text x="204" y="156" class="phrase" text-anchor="middle">${escapeXml(card.phrase)}</text>
${lineNodes(plan.meaning, {
    className: 'body',
    lineHeight: meaningLineHeight,
    x: GRID.margin,
    y: meaningStartY,
})}
<text x="204" y="${exampleTitleY}" class="heading" text-anchor="middle">例句</text>
${lineNodes(plan.sentence, {
    className: 'body',
    lineHeight: snap(scale.body * 1.55),
    x: GRID.margin,
    y: sentenceStartY,
})}
<text x="300" y="496" class="logo">©2026 ${STYLE.logo}</text>
</svg>
`;
}

function snap(value) {
    return Math.round(value / GRID.row) * GRID.row;
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
    const csv = await readFile(args.input, 'utf8');
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
