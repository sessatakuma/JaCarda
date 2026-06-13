/* eslint-disable */
import {
    useEffect,
    useState,
    type JSX,
    type MouseEvent,
    type ReactNode,
} from 'react';
import {
    BookOpenText,
    Download,
    Facebook,
    Instagram,
    RefreshCw,
    Settings,
} from 'lucide-react';

import {
    fetchSheetCards,
    formatPhraseWithReading,
    parseCsvCards,
    renderVocabCard,
    sampleCsv,
    slugify,
    splitPhraseReading,
    type VocabCard,
} from '../lib/vocabCards.js';

const sheetStorageKey = 'jacarda-sheet-url';
const webhookStorageKey = 'jacarda-sheet-webhook-url';
const sampleCards = parseCsvCards(sampleCsv);

type ConnectionState = 'error' | 'loading' | 'ready';

export function App(): JSX.Element {
    const [sheetUrl, setSheetUrl] = useState(
        () => window.localStorage.getItem(sheetStorageKey) ?? ''
    );
    const [draftSheetUrl, setDraftSheetUrl] = useState(sheetUrl);
    const [cards, setCards] = useState<Array<VocabCard>>(sampleCards);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [webhookUrl, setWebhookUrl] = useState(
        () => window.localStorage.getItem(webhookStorageKey) ?? ''
    );
    const [draftWebhookUrl, setDraftWebhookUrl] = useState(webhookUrl);
    const [connectionState, setConnectionState] = useState<ConnectionState>(
        () => (sheetUrl ? 'loading' : 'ready')
    );
    const [connectionMessage, setConnectionMessage] = useState(() =>
        sheetUrl
            ? 'Connecting to Google Sheets...'
            : 'No Google Sheet connected.'
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [usedMessage, setUsedMessage] = useState('');

    const unusedCards = cards.filter((card) => !card.usedAt?.trim());
    const selectedCard =
        unusedCards[selectedIndex] ??
        unusedCards[0] ??
        cards[0] ??
        sampleCards[0];
    const previewSvg = renderVocabCard(selectedCard);
    const sheetStatusState =
        connectionState === 'ready' && !sheetUrl
            ? 'disconnected'
            : connectionState;

    useEffect(() => {
        if (sheetUrl) {
            void connectToSheet(sheetUrl);
        }
    }, []);

    async function connectToSheet(nextSheetUrl: string): Promise<void> {
        const normalizedSheetUrl = nextSheetUrl.trim();

        if (!normalizedSheetUrl) {
            setCards(sampleCards);
            setSelectedIndex(0);
            setSheetUrl('');
            setDraftSheetUrl('');
            window.localStorage.removeItem(sheetStorageKey);
            setConnectionState('ready');
            setConnectionMessage('No Google Sheet connected.');
            setIsDialogOpen(false);
            return;
        }

        setConnectionState('loading');
        setConnectionMessage('Connecting to Google Sheets...');

        try {
            const nextCards = await fetchSheetCards(normalizedSheetUrl);
            setCards(nextCards);
            setSelectedIndex(0);
            setSheetUrl(normalizedSheetUrl);
            setDraftSheetUrl(normalizedSheetUrl);
            window.localStorage.setItem(sheetStorageKey, normalizedSheetUrl);
            window.localStorage.setItem(webhookStorageKey, draftWebhookUrl);
            setWebhookUrl(draftWebhookUrl);
            setConnectionState('ready');
            const unusedCount = nextCards.filter(
                (card) => !card.usedAt?.trim()
            ).length;
            setConnectionMessage(
                `Google Sheet connected: ${unusedCount} unused phrases`
            );
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
            currentCards.map((card) =>
                card.rowNumber === selectedCard.rowNumber
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

        const nextValue = window.prompt(
            `Edit ${field}`,
            String(selectedCard[field] ?? '')
        );

        if (nextValue === null) {
            return;
        }

        if (field === 'phrase') {
            updatePhraseWithReading(nextValue);
            return;
        }

        updateSelectedCard(field, nextValue);
    }

    function updatePhraseWithReading(value: string): void {
        const split = splitPhraseReading(value);

        setCards((currentCards) =>
            currentCards.map((card) =>
                card.rowNumber === selectedCard.rowNumber
                    ? {
                          ...card,
                          phrase: split.phrase,
                          reading: split.reading,
                      }
                    : card
            )
        );
    }

    async function writeSheetRow(
        payload: Partial<VocabCard> & { rowNumber: number }
    ): Promise<void> {
        if (!webhookUrl.trim()) {
            throw new Error(
                'Add an Apps Script webhook in Connect Google Sheet before saving.'
            );
        }

        const response = await fetch(webhookUrl.trim(), {
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(
                `Webhook returned ${response.status} ${response.statusText}`
            );
        }
    }

    async function saveEditedCard(): Promise<void> {
        setIsSaving(true);
        setUsedMessage(`Saving "${selectedCard.phrase}" to Google Sheets...`);

        try {
            await writeSheetRow({
                meaning: selectedCard.meaning,
                phrase: selectedCard.phrase,
                reading: selectedCard.reading,
                rowNumber: selectedCard.rowNumber,
                sentence: selectedCard.sentence,
                type: selectedCard.type,
            });
            setUsedMessage(`Saved "${selectedCard.phrase}".`);
        } catch (error) {
            setUsedMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not save edits back to Google Sheets.'
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function markSelectedCardAsUsed(): Promise<void> {
        const cardToMark = selectedCard;
        const usedAt = new Date().toISOString();

        setIsSaving(true);
        setUsedMessage(`Marking "${cardToMark.phrase}" as used...`);

        try {
            await writeSheetRow({
                meaning: cardToMark.meaning,
                phrase: cardToMark.phrase,
                reading: cardToMark.reading,
                rowNumber: cardToMark.rowNumber,
                sentence: cardToMark.sentence,
                type: cardToMark.type,
                usedAt,
            });
            setCards((currentCards) =>
                currentCards.map((card) =>
                    card.rowNumber === cardToMark.rowNumber
                        ? {
                              ...card,
                              usedAt,
                          }
                        : card
                )
            );
            const nextUnusedCount = cards.filter(
                (card) =>
                    card.rowNumber !== cardToMark.rowNumber &&
                    !card.usedAt?.trim()
            ).length;

            setConnectionMessage(
                `Google Sheet connected: ${nextUnusedCount} unused phrases`
            );
            setIsMarkDialogOpen(false);
            setSelectedIndex(0);
            setUsedMessage(`Marked "${cardToMark.phrase}" as used.`);
        } catch (error) {
            setUsedMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not write used date back to Google Sheets.'
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function downloadCurrentPng(): Promise<void> {
        const filename = `${String(selectedIndex + 1).padStart(3, '0')}-${slugify(
            selectedCard.phrase,
            'card'
        )}.png`;

        setIsDownloading(true);
        setUsedMessage('');

        try {
            const blob = await svgToPngBlob(previewSvg);
            await savePngBlob(blob, filename);
            setIsMarkDialogOpen(true);
        } catch (error) {
            setUsedMessage(
                error instanceof DOMException && error.name === 'AbortError'
                    ? 'PNG download canceled.'
                    : error instanceof Error
                      ? error.message
                      : 'Could not download PNG.'
            );
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <>
            <Nav />
            <main className='app' id='main-content'>
                <section className='studio-shell' aria-label='Card studio'>
                    <div className='studio-grid'>
                        <aside className='row-panel' aria-label='Sheet rows'>
                            <PanelTitle>Sheet</PanelTitle>
                            <div className='row-list'>
                                {unusedCards.map((card, index) => (
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
                                        <small>
                                            {card.reading ||
                                                card.type ||
                                                'No reading'}
                                        </small>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <section className='edit-panel' aria-label='Text edit'>
                            <PanelTitle>Edit</PanelTitle>
                            <label className='edit-field'>
                                <span>Type</span>
                                <input
                                    value={selectedCard.type}
                                    onChange={(event) => {
                                        updateSelectedCard(
                                            'type',
                                            event.target.value
                                        );
                                    }}
                                />
                            </label>
                            <label className='edit-field'>
                                <span>Phrase + Furigana</span>
                                <input
                                    value={formatPhraseWithReading(
                                        selectedCard
                                    )}
                                    onChange={(event) => {
                                        updatePhraseWithReading(
                                            event.target.value
                                        );
                                    }}
                                />
                            </label>
                            <label className='edit-field'>
                                <span>Meaning</span>
                                <textarea
                                    rows={5}
                                    value={selectedCard.meaning}
                                    onChange={(event) => {
                                        updateSelectedCard(
                                            'meaning',
                                            event.target.value
                                        );
                                    }}
                                />
                            </label>
                            <label className='edit-field'>
                                <span>Sentence</span>
                                <textarea
                                    rows={4}
                                    value={selectedCard.sentence}
                                    onChange={(event) => {
                                        updateSelectedCard(
                                            'sentence',
                                            event.target.value
                                        );
                                    }}
                                />
                            </label>
                            <AppButton
                                disabled={isSaving}
                                onClick={() => {
                                    void saveEditedCard();
                                }}
                            >
                                {isSaving ? 'Saving...' : 'Save edit to sheet'}
                            </AppButton>
                            {usedMessage ? (
                                <p className='used-message'>{usedMessage}</p>
                            ) : null}
                        </section>

                        <section
                            className='preview-panel'
                            aria-label='Editable SVG preview'
                        >
                            <PanelTitle>Preview</PanelTitle>
                            <div
                                className='svg-preview'
                                dangerouslySetInnerHTML={{ __html: previewSvg }}
                                onDoubleClick={editSvgText}
                            />
                            <AppButton
                                className='preview-download'
                                disabled={isDownloading}
                                icon={<Download size={20} />}
                                onClick={() => {
                                    void downloadCurrentPng();
                                }}
                            >
                                {isDownloading
                                    ? 'Downloading...'
                                    : 'Download PNG'}
                            </AppButton>
                        </section>
                    </div>
                </section>
            </main>
            <Footer />
            <div className={`sheet-status sheet-status--${sheetStatusState}`}>
                <span className='sheet-status-dot' aria-hidden='true' />
                <p>{connectionMessage}</p>
                <AppButton
                    ariaLabel='Sheet settings'
                    className='sheet-settings-button'
                    icon={<Settings size={18} aria-hidden='true' />}
                    variant='ghost'
                    onClick={() => {
                        setIsDialogOpen(true);
                    }}
                />
            </div>

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
                                Use a public or published Sheet URL. This stays
                                on this device.
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
                            <label className='sheet-dialog-field'>
                                <span>Apps Script write webhook URL</span>
                                <input
                                    placeholder='https://script.google.com/macros/s/.../exec'
                                    value={draftWebhookUrl}
                                    onChange={(event) => {
                                        setDraftWebhookUrl(event.target.value);
                                    }}
                                />
                            </label>
                            <div className='sheet-dialog-actions'>
                                <AppButton
                                    variant='ghost'
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        setDraftSheetUrl(sheetUrl);
                                    }}
                                >
                                    Cancel
                                </AppButton>
                                <AppButton
                                    type='submit'
                                    disabled={connectionState === 'loading'}
                                    icon={<RefreshCw size={20} />}
                                >
                                    Connect
                                </AppButton>
                            </div>
                        </form>
                    </dialog>
                </div>
            ) : null}
            {isMarkDialogOpen ? (
                <div className='sheet-dialog-backdrop'>
                    <dialog className='sheet-dialog' open>
                        <div className='sheet-dialog-content'>
                            <h2>PNG downloaded</h2>
                            <p>
                                Confirm this card was generated before marking
                                it used in Google Sheets.
                            </p>
                            <div className='sheet-dialog-actions'>
                                <AppButton
                                    variant='ghost'
                                    onClick={() => {
                                        setIsMarkDialogOpen(false);
                                    }}
                                >
                                    Not yet
                                </AppButton>
                                <AppButton
                                    disabled={isSaving}
                                    onClick={() => {
                                        void markSelectedCardAsUsed();
                                    }}
                                >
                                    Mark "{selectedCard.phrase}" as used
                                </AppButton>
                            </div>
                        </div>
                    </dialog>
                </div>
            ) : null}
        </>
    );
}

function PanelTitle({ children }: { children: ReactNode }): JSX.Element {
    return <h2 className='panel-title'>{children}</h2>;
}

function AppButton({
    ariaLabel,
    children,
    className,
    disabled,
    icon,
    onClick,
    type = 'button',
    variant = 'primary',
}: {
    ariaLabel?: string;
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    icon?: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'ghost' | 'primary';
}): JSX.Element {
    const classNames = ['button', `button--${variant}`, className]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            aria-label={ariaLabel}
            className={classNames}
            disabled={disabled}
            type={type}
            onClick={onClick}
        >
            {icon ? <span className='button-icon'>{icon}</span> : null}
            {children ? <span>{children}</span> : null}
        </button>
    );
}

async function svgToPngBlob(svg: string): Promise<Blob> {
    const image = new Image();
    const svgBlob = new Blob([svg], {
        type: 'image/svg+xml;charset=utf-8',
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
        await new Promise<void>((resolve, reject) => {
            image.addEventListener('load', () => {
                resolve();
            });
            image.addEventListener('error', () => {
                reject(new Error('Could not render SVG for PNG export.'));
            });
            image.src = svgUrl;
        });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = 1080;
        canvas.height = 1350;

        if (!context) {
            throw new Error('Canvas is unavailable for PNG export.');
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                    return;
                }

                reject(new Error('Could not encode PNG download.'));
            }, 'image/png');
        });
    } finally {
        URL.revokeObjectURL(svgUrl);
    }
}

async function savePngBlob(blob: Blob, filename: string): Promise<void> {
    const fileWindow = window as FilePickerWindow;

    if (fileWindow.showSaveFilePicker) {
        const handle = await fileWindow.showSaveFilePicker({
            suggestedName: filename,
            types: [
                {
                    accept: {
                        'image/png': ['.png'],
                    },
                    description: 'PNG image',
                },
            ],
        });
        const writable = await handle.createWritable();

        await writable.write(blob);
        await writable.close();
        return;
    }

    triggerDownload(blob, filename);
    await waitForBrowserDownloadHandoff();
}

function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

async function waitForBrowserDownloadHandoff(): Promise<void> {
    await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 600);
    });
}

type FilePickerWindow = Window & {
    showSaveFilePicker?: (options: {
        suggestedName: string;
        types: Array<{
            accept: Record<string, Array<string>>;
            description: string;
        }>;
    }) => Promise<FileSystemFileHandle>;
};

type FileSystemFileHandle = {
    createWritable: () => Promise<FileSystemWritableFileStream>;
};

type FileSystemWritableFileStream = {
    close: () => Promise<void>;
    write: (data: Blob) => Promise<void>;
};

function Nav(): JSX.Element {
    return (
        <header className='nav'>
            <div className='nav-brand' aria-label='JaCarda'>
                <a className='nav-title' href='#main-content'>
                    <img
                        className='logo'
                        src='images/logo-64.png'
                        srcSet='images/logo-64.png 64w, images/logo-128.png 128w, images/logo.png 650w'
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
                href='#main-content'
                title='Usage'
                aria-label='Usage: Sheet rows, editable SVG, export-ready cards.'
            >
                <BookOpenText size={20} aria-hidden='true' />
                <span className='nav-guide-button-label'>Guide</span>
            </a>
        </header>
    );
}

function ThreadsIcon({ size = 24 }: { size?: number }): JSX.Element {
    return (
        <svg
            aria-hidden='true'
            className='footer-social-svg'
            focusable='false'
            height={size}
            viewBox='0 0 24 24'
            width={size}
        >
            <path
                d='M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z'
                fill='currentColor'
            />
        </svg>
    );
}

function GithubIcon({ size = 24 }: { size?: number }): JSX.Element {
    return (
        <svg
            aria-hidden='true'
            className='footer-social-svg'
            focusable='false'
            height={size}
            viewBox='0 0 1024 1024'
            width={size}
        >
            <path
                clipRule='evenodd'
                d='M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z'
                fill='currentColor'
                fillRule='evenodd'
                transform='scale(64)'
            />
        </svg>
    );
}

function Footer(): JSX.Element {
    const emailAddress = 'contact@sessatakuma.dev';
    const socialLinks = [
        {
            icon: <Instagram size={24} />,
            label: 'Instagram',
            pending: true,
        },
        {
            icon: <ThreadsIcon size={24} />,
            label: 'Threads',
            pending: true,
        },
        {
            icon: <Facebook size={24} />,
            label: 'Facebook',
            pending: true,
        },
        {
            href: 'https://github.com/sessatakuma',
            icon: <GithubIcon size={24} />,
            label: 'GitHub',
        },
    ];
    const showPendingAccountDialog = (): void => {
        window.alert('We are working on this account.');
    };

    return (
        <footer className='site-footer'>
            <div className='site-footer-inner'>
                <div className='site-footer-top'>
                    <a
                        className='site-footer-brand'
                        href='#main-content'
                        aria-label='Sessatakuma'
                    >
                        <img
                            className='site-footer-logo'
                            src='images/logo-128.png'
                            srcSet='images/logo-64.png 64w, images/logo-128.png 128w, images/logo.png 650w'
                            sizes='64px'
                            width='128'
                            height='128'
                            alt=''
                            aria-hidden='true'
                        />
                    </a>
                    <nav
                        className='site-footer-social'
                        aria-label='Social media'
                    >
                        <div className='site-footer-social-links'>
                            {socialLinks.map((link) =>
                                link.pending ? (
                                    <button
                                        key={link.label}
                                        className='site-footer-social-link'
                                        type='button'
                                        aria-label={link.label}
                                        onClick={showPendingAccountDialog}
                                    >
                                        {link.icon}
                                    </button>
                                ) : (
                                    <a
                                        key={link.label}
                                        className='site-footer-social-link'
                                        href={link.href}
                                        aria-label={link.label}
                                    >
                                        {link.icon}
                                    </a>
                                )
                            )}
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

                <section className='site-footer-about' aria-label='Sessatakuma'>
                    <p>
                        Sessatakuma is developing tools for Japanese learning
                        and planning a Japanese speaking practice community. By
                        sharing the complete practice system our team members
                        built in the past, along with tools designed for that
                        system, we want to help learners make speaking practice
                        more efficient and steadily build the confidence to
                        speak Japanese.
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
