#!/usr/bin/env bun
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
    googleSheetCsvUrl,
    parseCsvCards,
    renderVocabCard,
    slugify,
} from '../src/lib/vocabCards.ts';
import { style } from '../src/lib/vocabCardTemplate.ts';

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
        '  - Adjust card layout in src/lib/vocabCardTemplate.ts.',
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

function renderIndex(files) {
    const links = files
        .map(
            (file) =>
                `<li><a href="./${escapeHtml(file.name)}">${escapeHtml(file.title)}</a></li>`
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
    background: ${style.background};
    color: ${style.ink};
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

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

async function main() {
    const args = parseArgs(process.argv);
    const csv = await readInputText(args.input);
    const records = parseCsvCards(csv).filter((card) => !card.usedAt?.trim());

    await mkdir(args.output, { recursive: true });

    const files = [];
    for (const [index, record] of records.entries()) {
        const basename = `${String(index + 1).padStart(3, '0')}-${slugify(record.phrase, 'card')}.svg`;
        await writeFile(
            path.join(args.output, basename),
            renderVocabCard(record),
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
