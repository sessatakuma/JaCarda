/* eslint-disable */
import { useState, type ChangeEvent, type JSX } from 'react';

import {
    fetchSheetCards,
    googleSheetCsvUrl,
    parseCsvCards,
    renderVocabCard,
    sampleCsv,
    slugify,
    type VocabCard,
} from '../lib/vocabCards.js';

type Connection = {
    csvUrl?: string;
    message: string;
    source: 'sample' | 'sheet';
    state: 'error' | 'idle' | 'loading' | 'ready';
};

const sampleCards = parseCsvCards(sampleCsv);

export function App(): JSX.Element {
    const [sheetUrl, setSheetUrl] = useState('');
    const [cards, setCards] = useState<Array<VocabCard>>(sampleCards);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [connection, setConnection] = useState<Connection>({
        message: 'Using bundled sample data.',
        source: 'sample',
        state: 'idle',
    });

    const selectedCard = cards[selectedIndex] ?? sampleCards[0];
    const previewSvg = renderVocabCard(selectedCard);

    async function connectSheet(): Promise<void> {
        const trimmedUrl = sheetUrl.trim();

        if (!trimmedUrl) {
            setConnection({
                message: 'Paste a Google Sheet URL first.',
                source: 'sheet',
                state: 'error',
            });
            return;
        }

        setConnection({
            csvUrl: safeCsvUrl(trimmedUrl),
            message: 'Connecting to Google Sheets...',
            source: 'sheet',
            state: 'loading',
        });

        try {
            const nextCards = await fetchSheetCards(trimmedUrl);
            setCards(nextCards);
            setSelectedIndex(0);
            setConnection({
                csvUrl: safeCsvUrl(trimmedUrl),
                message: `Connected ${nextCards.length} row(s).`,
                source: 'sheet',
                state: 'ready',
            });
        } catch (error) {
            setConnection({
                csvUrl: safeCsvUrl(trimmedUrl),
                message:
                    error instanceof Error
                        ? error.message
                        : 'Could not connect to the Sheet.',
                source: 'sheet',
                state: 'error',
            });
        }
    }

    function loadSample(): void {
        setCards(sampleCards);
        setSelectedIndex(0);
        setConnection({
            message: 'Using bundled sample data.',
            source: 'sample',
            state: 'idle',
        });
    }

    function updateCard(field: keyof VocabCard) {
        return (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ): void => {
            const value = event.target.value;
            setCards((currentCards) =>
                currentCards.map((card, index) =>
                    index === selectedIndex
                        ? {
                              ...card,
                              [field]: value,
                          }
                        : card
                )
            );
        };
    }

    function downloadCurrent(): void {
        const filename = `${String(selectedIndex + 1).padStart(3, '0')}-${slugify(
            selectedCard.phrase,
            'card'
        )}.svg`;
        const blob = new Blob([previewSvg], {
            type: 'image/svg+xml;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className='app'>
            <section className='hero'>
                <div className='hero__brand'>
                    <p className='hero__eyebrow'>JaCarda Studio</p>
                    <div className='palette-strip' aria-label='Active palette'>
                        <span className='palette-strip__swatch palette-strip__swatch--ink' />
                        <span className='palette-strip__swatch palette-strip__swatch--slate' />
                        <span className='palette-strip__swatch palette-strip__swatch--mint' />
                        <span className='palette-strip__swatch palette-strip__swatch--soft' />
                        <span className='palette-strip__swatch palette-strip__swatch--guide' />
                    </div>
                </div>
                <div className='hero__copy'>
                    <h1 className='hero__title'>
                        Make sheet-powered cards feel coolorful.
                    </h1>
                    <p className='hero__description'>
                        Connect a public Sheet, edit a row ad hoc, preview the
                        Affinity-aligned SVG, then download the current card.
                    </p>
                    <div className='hero__chips' aria-label='Studio features'>
                        <span>Sheet sync</span>
                        <span>Live preview</span>
                        <span>SVG export</span>
                    </div>
                </div>
            </section>

            <section className='workspace'>
                <aside
                    className='panel panel--source'
                    aria-label='Sheet source'
                >
                    <div className='panel__header'>
                        <p className='panel__eyebrow'>Connected Sheet</p>
                        <button
                            className='button button--ghost'
                            type='button'
                            onClick={loadSample}
                        >
                            Load sample
                        </button>
                    </div>

                    <label className='field'>
                        <span className='field__label'>Google Sheet URL</span>
                        <input
                            className='field__control'
                            type='url'
                            placeholder='https://docs.google.com/spreadsheets/d/...'
                            value={sheetUrl}
                            onChange={(event) => {
                                setSheetUrl(event.target.value);
                            }}
                        />
                    </label>

                    <button
                        className='button button--primary'
                        type='button'
                        disabled={connection.state === 'loading'}
                        onClick={() => {
                            void connectSheet();
                        }}
                    >
                        {connection.state === 'loading'
                            ? 'Connecting...'
                            : 'Connect Sheet'}
                    </button>

                    <div className={`status status--${connection.state}`}>
                        <span className='status__dot' aria-hidden='true' />
                        <p>{connection.message}</p>
                    </div>

                    {connection.csvUrl ? (
                        <p className='source-url'>
                            CSV export: <span>{connection.csvUrl}</span>
                        </p>
                    ) : null}

                    <div className='row-list' aria-label='Sheet rows'>
                        {cards.map((card, index) => (
                            <button
                                className={
                                    index === selectedIndex
                                        ? 'row-card row-card--active'
                                        : 'row-card'
                                }
                                key={`${card.phrase}-${index}`}
                                type='button'
                                onClick={() => {
                                    setSelectedIndex(index);
                                }}
                            >
                                <span>
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <strong>
                                    {card.phrase || 'Untitled card'}
                                </strong>
                                <small>{card.type || 'No type'}</small>
                            </button>
                        ))}
                    </div>
                </aside>

                <section
                    className='panel panel--editor'
                    aria-label='Ad hoc edit'
                >
                    <div className='panel__header'>
                        <p className='panel__eyebrow'>Ad Hoc Text Edit</p>
                        <p className='panel__meta'>
                            Row {selectedIndex + 1} of {cards.length}
                        </p>
                    </div>

                    <label className='field'>
                        <span className='field__label'>Type</span>
                        <input
                            className='field__control'
                            value={selectedCard.type}
                            onChange={updateCard('type')}
                        />
                    </label>

                    <label className='field'>
                        <span className='field__label'>Phrase</span>
                        <input
                            className='field__control field__control--phrase'
                            value={selectedCard.phrase}
                            onChange={updateCard('phrase')}
                        />
                    </label>

                    <label className='field'>
                        <span className='field__label'>Meaning</span>
                        <textarea
                            className='field__control'
                            rows={5}
                            value={selectedCard.meaning}
                            onChange={updateCard('meaning')}
                        />
                    </label>

                    <label className='field'>
                        <span className='field__label'>Sentence</span>
                        <textarea
                            className='field__control'
                            rows={4}
                            value={selectedCard.sentence}
                            onChange={updateCard('sentence')}
                        />
                    </label>

                    <button
                        className='button button--primary'
                        type='button'
                        onClick={downloadCurrent}
                    >
                        Download current SVG
                    </button>
                </section>

                <section className='preview-shell' aria-label='Card preview'>
                    <div className='preview-shell__header'>
                        <div>
                            <p className='panel__eyebrow'>Live Preview</p>
                            <h2>{selectedCard.phrase || 'Untitled card'}</h2>
                        </div>
                        <p>1080 × 1350 SVG</p>
                    </div>
                    <iframe
                        className='preview'
                        title='Generated vocabulary card preview'
                        srcDoc={previewSvg}
                    />
                </section>
            </section>
        </main>
    );
}

function safeCsvUrl(sheetUrl: string): string | undefined {
    try {
        return googleSheetCsvUrl(sheetUrl) ?? sheetUrl;
    } catch {
        return undefined;
    }
}
