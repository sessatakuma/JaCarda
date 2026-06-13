/* eslint-disable */
import { useEffect, useState, type JSX, type MouseEvent } from 'react';
import { BookOpenText, Download, Github, RefreshCw } from 'lucide-react';

import {
    fetchSheetCards,
    googleSheetCsvUrl,
    parseCsvCards,
    renderVocabCard,
    sampleCsv,
    slugify,
    type VocabCard,
} from '../lib/vocabCards.js';

const defaultSheetUrl =
    'https://docs.google.com/spreadsheets/d/17l4NXhq_qJJvo8UMAdxNhhjkgfX9HlI0rRopcgdK_cQ/edit?gid=0#gid=0';
const sampleCards = parseCsvCards(sampleCsv);

type ConnectionState = 'error' | 'loading' | 'ready';

export function App(): JSX.Element {
    const [sheetUrl, setSheetUrl] = useState(defaultSheetUrl);
    const [draftSheetUrl, setDraftSheetUrl] = useState(defaultSheetUrl);
    const [cards, setCards] = useState<Array<VocabCard>>(sampleCards);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [connectionState, setConnectionState] =
        useState<ConnectionState>('loading');
    const [connectionMessage, setConnectionMessage] = useState(
        'Connecting to the default Sheet...'
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const selectedCard = cards[selectedIndex] ?? sampleCards[0];
    const previewSvg = renderVocabCard(selectedCard);
    const csvUrl = safeCsvUrl(sheetUrl);

    useEffect(() => {
        void connectToSheet(defaultSheetUrl);
    }, []);

    async function connectToSheet(nextSheetUrl: string): Promise<void> {
        setConnectionState('loading');
        setConnectionMessage('Connecting to Google Sheets...');

        try {
            const nextCards = await fetchSheetCards(nextSheetUrl);
            setCards(nextCards);
            setSelectedIndex(0);
            setSheetUrl(nextSheetUrl);
            setDraftSheetUrl(nextSheetUrl);
            setConnectionState('ready');
            setConnectionMessage(`Connected ${nextCards.length} row(s).`);
            setIsDialogOpen(false);
        } catch (error) {
            setConnectionState('error');
            setConnectionMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not connect to the Sheet.'
            );
        }
    }

    function updateSelectedCard(field: keyof VocabCard, value: string): void {
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
    }

    function editSvgText(event: MouseEvent<HTMLDivElement>): void {
        const target = event.target as Element;
        const textNode = target.closest('text[data-field]');
        const field = textNode?.getAttribute('data-field') as
            | keyof VocabCard
            | null;

        if (!field) {
            return;
        }

        const nextValue = window.prompt(`Edit ${field}`, selectedCard[field]);

        if (nextValue === null) {
            return;
        }

        updateSelectedCard(field, nextValue);
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
        <>
            <Nav
                isLoading={connectionState === 'loading'}
                onConnectClick={() => {
                    setIsDialogOpen(true);
                }}
            />
            <main className='app' id='main-content'>
                <section className='studio-shell' aria-label='Card studio'>
                    <div className='studio-toolbar'>
                        <div>
                            <p className='studio-eyebrow'>Vocabulary Cards</p>
                            <h1>{selectedCard.phrase}</h1>
                        </div>
                        <button
                            className='button button--primary'
                            type='button'
                            onClick={downloadCurrent}
                        >
                            <Download size={20} aria-hidden='true' />
                            Download SVG
                        </button>
                    </div>

                    <div className='studio-grid'>
                        <aside className='row-panel' aria-label='Sheet rows'>
                            <div
                                className={`sheet-status sheet-status--${connectionState}`}
                            >
                                <span
                                    className='sheet-status-dot'
                                    aria-hidden='true'
                                />
                                <p>{connectionMessage}</p>
                            </div>
                            <div className='row-list'>
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
                            className='preview-panel'
                            aria-label='Editable SVG preview'
                        >
                            <div className='preview-panel-header'>
                                <p>Double-click text on the SVG to edit it.</p>
                                <p>1080 x 1350</p>
                            </div>
                            <div
                                className='svg-preview'
                                dangerouslySetInnerHTML={{ __html: previewSvg }}
                                onDoubleClick={editSvgText}
                            />
                        </section>
                    </div>
                </section>

                <ReferenceSection csvUrl={csvUrl} />
            </main>
            <Footer />

            {isDialogOpen ? (
                <div className='sheet-dialog-backdrop'>
                    <dialog className='sheet-dialog' open>
                        <form
                            method='dialog'
                            onSubmit={(event) => {
                                event.preventDefault();
                                void connectToSheet(draftSheetUrl.trim());
                            }}
                        >
                            <h2>Connect Google Sheet</h2>
                            <p>
                                The default Sheet is prefilled. Use a public or
                                published Sheet URL.
                            </p>
                            <label className='sheet-dialog-field'>
                                <span>Sheet URL</span>
                                <input
                                    value={draftSheetUrl}
                                    onChange={(event) => {
                                        setDraftSheetUrl(event.target.value);
                                    }}
                                />
                            </label>
                            <div className='sheet-dialog-actions'>
                                <button
                                    className='button button--ghost'
                                    type='button'
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        setDraftSheetUrl(sheetUrl);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className='button button--primary'
                                    type='submit'
                                    disabled={connectionState === 'loading'}
                                >
                                    <RefreshCw size={20} aria-hidden='true' />
                                    Connect
                                </button>
                            </div>
                        </form>
                    </dialog>
                </div>
            ) : null}
        </>
    );
}

function Nav({
    isLoading,
    onConnectClick,
}: {
    isLoading: boolean;
    onConnectClick: () => void;
}): JSX.Element {
    return (
        <header className='nav'>
            <div className='nav-brand' aria-label='JaCarda'>
                <a className='nav-title' href='#main-content'>
                    <img
                        className='logo'
                        src='/favicon.png'
                        sizes='32px'
                        width='64'
                        height='64'
                        alt=''
                        aria-hidden='true'
                    />
                    <span className='title'>JaCarda</span>
                </a>
            </div>
            <a
                className='nav-guide-button'
                href='#reference'
                title='Reference'
                aria-label='Reference: how this page works'
            >
                <BookOpenText size={20} aria-hidden='true' />
                <span className='nav-guide-button-label'>Reference</span>
            </a>
            <button
                className='nav-guide-button nav-sheet-button'
                type='button'
                onClick={onConnectClick}
            >
                {isLoading ? 'Connecting...' : 'Connect Google Sheet'}
            </button>
        </header>
    );
}

function ReferenceSection({ csvUrl }: { csvUrl?: string }): JSX.Element {
    return (
        <section
            className='usage-section'
            id='reference'
            aria-labelledby='reference-heading'
        >
            <div className='usage-section-inner'>
                <div className='usage-pitch-primer'>
                    <div className='usage-pitch-intro'>
                        <div className='usage-section-copy'>
                            <h2 id='reference-heading'>
                                Sheet rows, editable SVG, export-ready cards.
                            </h2>
                        </div>
                        <div className='usage-pitch-copy'>
                            <p>
                                JaCarda reads type, phrase, meaning, and
                                sentence columns from Google Sheets, then
                                renders the 1080x1350 Affinity-aligned SVG card.
                            </p>
                        </div>
                    </div>
                    <div className='usage-pitch-states'>
                        <article className='usage-pitch-state'>
                            <div
                                className='usage-pitch-mark'
                                aria-hidden='true'
                            >
                                1
                            </div>
                            <h4>Connect</h4>
                            <p>
                                Use the default Sheet or paste a published Sheet
                                URL.
                            </p>
                        </article>
                        <article className='usage-pitch-state'>
                            <div
                                className='usage-pitch-mark'
                                aria-hidden='true'
                            >
                                2
                            </div>
                            <h4>Edit</h4>
                            <p>
                                Double-click SVG text to make local ad hoc
                                changes.
                            </p>
                        </article>
                        <article className='usage-pitch-state'>
                            <div
                                className='usage-pitch-mark'
                                aria-hidden='true'
                            >
                                3
                            </div>
                            <h4>Download</h4>
                            <p>
                                Export the selected card as an editable SVG
                                file.
                            </p>
                        </article>
                    </div>
                </div>
                <div className='usage-guide' aria-label='Reference details'>
                    <article className='usage-guide-card'>
                        <div className='usage-guide-preview' aria-hidden='true'>
                            <span className='reference-preview-token'>CSV</span>
                        </div>
                        <div className='usage-guide-copy'>
                            <h3>Current CSV export</h3>
                            <p>
                                {csvUrl ??
                                    'Connect a Sheet to show its CSV export URL.'}
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}

function Footer(): JSX.Element {
    const emailAddress = 'contact@sessatakuma.dev';

    return (
        <footer className='site-footer'>
            <div className='site-footer-inner'>
                <div className='site-footer-top'>
                    <a
                        className='site-footer-brand'
                        href='#main-content'
                        aria-label='JaCarda'
                    >
                        <img
                            className='site-footer-logo'
                            src='/favicon.png'
                            width='128'
                            height='128'
                            alt=''
                            aria-hidden='true'
                        />
                    </a>
                    <nav
                        className='site-footer-social'
                        aria-label='Social links'
                    >
                        <div className='site-footer-social-links'>
                            <a
                                className='site-footer-social-link'
                                href='https://github.com/sessatakuma'
                                aria-label='GitHub'
                            >
                                <Github size={24} aria-hidden='true' />
                            </a>
                        </div>
                        <a
                            className='site-footer-email-link'
                            href={`mailto:${emailAddress}`}
                            aria-label={`Email: ${emailAddress}`}
                        >
                            {emailAddress}
                        </a>
                    </nav>
                </div>

                <section className='site-footer-about' aria-label='JaCarda'>
                    <p>
                        A small Sessatakuma tool for generating clean vocabulary
                        cards from Google Sheets.
                    </p>
                </section>
            </div>
            <p className='site-footer-wordmark' aria-label='Sessatakuma'>
                <span>Sessa</span>
                <span>takuma</span>
            </p>
        </footer>
    );
}

function safeCsvUrl(sheetUrl: string): string | undefined {
    try {
        return googleSheetCsvUrl(sheetUrl) ?? sheetUrl;
    } catch {
        return undefined;
    }
}
