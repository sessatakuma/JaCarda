# jacarda

Created from the Vite frontend template.

## Install

```bash
bun install
```

## Develop

```bash
bun run dev
```

The web app can connect to a public/exportable Google Sheet, preview generated
cards, save edits back to the selected Sheet row, and download the current card
as PNG.

To write edits and generated/used dates back to the Sheet, deploy
`scripts/google-sheet-used-webhook.gs` as a Google Apps Script web app bound to
the spreadsheet, then paste the web app URL into **Connect Google Sheet**. The
app posts the selected Sheet row number, edited `type`, `phrase`, `meaning`, and
`sentence` fields, plus an ISO timestamp when a downloaded card is marked used.
Rows with a `usedAt`, `used date`, or `used up date` value are hidden from the
unused list.

## Check

```bash
bun run check
```

This project includes `bunfig.toml` with `minimumReleaseAge = 604800`.

## Generate Vocabulary Cards

```bash
bun run cards examples/vocab-cards.csv dist/cards
```

The card generator reads CSV rows with `type`, `phrase`, `meaning`, and
`sentence` columns. The input can be a local CSV file, a direct CSV URL, or a
public/exportable Google Sheet URL:

```bash
bun run cards "https://docs.google.com/spreadsheets/d/<sheet-id>/edit#gid=0" dist/cards
```

Google Sheets must be public, published to the web, or otherwise exportable
without browser login. `例句` and `©2026 Sessatakuma` are fixed template text.

The source Affinity file is a private binary document. It was opened in the
macOS Affinity app after direct parsing failed; the script follows the exposed
1080x1350 document geometry and the configured guide grid: 12 columns, 16 rows,
24px gutters, 48px left/right margins, and 36px top/bottom margins. Each card
uses exactly three non-logo font sizes by switching between whole-card
typography scales when text gets longer.
