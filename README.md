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
`sentence` columns. `例句` and `©2026 Sessatakuma` are fixed template text.

The source Affinity file is a private binary document. It was opened in the
macOS Affinity app after direct parsing failed; the script follows the exposed
408x512 preview geometry and snaps layout values to the card grid. Each card
uses exactly three non-logo font sizes by switching between whole-card
typography scales when text gets longer.
