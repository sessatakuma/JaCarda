/* eslint-disable */
import { useEffect, useState, type JSX, type ReactNode } from 'react';
import {
    CircleHelp,
    CloudUpload,
    Download,
    FileSpreadsheet,
    RefreshCw,
    X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
import { Footer } from './Footer.js';
import { Nav } from './Nav.js';

import './App.css';

const sheetStorageKey = 'jacarda-sheet-url';
const webhookStorageKey = 'jacarda-sheet-webhook-url';
const defaultWebhookUrl =
    'https://script.google.com/macros/s/AKfycby55n93Iru6e6_NOEzDAnMDemveexvXmR0XH6vV0j-mvIYBtH1cVQASxvV-9us1ALc/exec';
const sampleCards = parseCsvCards(sampleCsv);

type ConnectionState = 'error' | 'loading' | 'ready';

export function App(): JSX.Element {
    const { t } = useTranslation();
    const [sheetUrl, setSheetUrl] = useState(
        () => window.localStorage.getItem(sheetStorageKey) ?? ''
    );
    const [draftSheetUrl, setDraftSheetUrl] = useState(sheetUrl);
    const [cards, setCards] = useState<Array<VocabCard>>(sampleCards);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [webhookUrl, setWebhookUrl] = useState(
        () =>
            window.localStorage.getItem(webhookStorageKey)?.trim() ||
            defaultWebhookUrl
    );
    const [draftWebhookUrl, setDraftWebhookUrl] = useState(webhookUrl);
    const [connectionState, setConnectionState] = useState<ConnectionState>(
        () => (sheetUrl ? 'loading' : 'ready')
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
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
    useEffect(() => {
        if (sheetUrl) {
            void connectToSheet(sheetUrl);
        }
    }, []);

    function closeConnectDialog(): void {
        setIsDialogOpen(false);
        setDraftSheetUrl(sheetUrl);
        setDraftWebhookUrl(webhookUrl);
    }

    async function connectToSheet(nextSheetUrl: string): Promise<void> {
        const normalizedSheetUrl = nextSheetUrl.trim();

        if (!normalizedSheetUrl) {
            setCards(sampleCards);
            setSelectedIndex(0);
            setSheetUrl('');
            setDraftSheetUrl('');
            window.localStorage.removeItem(sheetStorageKey);
            setConnectionState('ready');
            setIsDialogOpen(false);
            return;
        }

        setConnectionState('loading');

        try {
            const normalizedWebhookUrl =
                draftWebhookUrl.trim() || defaultWebhookUrl;
            const nextCards = await fetchSheetCards(normalizedSheetUrl);
            setCards(nextCards);
            setSelectedIndex(0);
            setSheetUrl(normalizedSheetUrl);
            setDraftSheetUrl(normalizedSheetUrl);
            window.localStorage.setItem(sheetStorageKey, normalizedSheetUrl);
            window.localStorage.setItem(
                webhookStorageKey,
                normalizedWebhookUrl
            );
            setDraftWebhookUrl(normalizedWebhookUrl);
            setWebhookUrl(normalizedWebhookUrl);
            setConnectionState('ready');
            setIsDialogOpen(false);
        } catch (error) {
            setConnectionState('error');
            setUsedMessage(
                error instanceof Error
                    ? error.message
                    : t('errors.connectSheet')
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
        if (!sheetUrl.trim()) {
            throw new Error(t('errors.sheetMissing'));
        }

        if (!webhookUrl.trim()) {
            throw new Error(t('errors.webhookMissing'));
        }

        const response = await fetch(webhookUrl.trim(), {
            body: JSON.stringify({
                sheetUrl,
                ...payload,
            }),
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
        setUsedMessage(t('status.saving', { phrase: selectedCard.phrase }));

        try {
            await writeSheetRow({
                meaning: selectedCard.meaning,
                phrase: selectedCard.phrase,
                reading: selectedCard.reading,
                rowNumber: selectedCard.rowNumber,
                sentence: selectedCard.sentence,
                type: selectedCard.type,
            });
            setUsedMessage(t('status.saved', { phrase: selectedCard.phrase }));
        } catch (error) {
            setUsedMessage(
                error instanceof Error ? error.message : t('errors.saveSheet')
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function markSelectedCardAsUsed(): Promise<void> {
        const cardToMark = selectedCard;
        const usedAt = new Date().toISOString();

        setIsSaving(true);
        setUsedMessage(t('status.markingUsed', { phrase: cardToMark.phrase }));

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
            setIsMarkDialogOpen(false);
            setSelectedIndex(0);
            setUsedMessage(
                t('status.markedUsed', { phrase: cardToMark.phrase })
            );
        } catch (error) {
            setUsedMessage(
                error instanceof Error ? error.message : t('errors.usedAtSheet')
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
                    ? t('errors.pngCanceled')
                    : error instanceof Error
                      ? error.message
                      : t('errors.downloadPng')
            );
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <>
            <Nav />
            <main className='app' id='main-content'>
                <section className='studio-shell' aria-label={t('studio.aria')}>
                    <div className='studio-grid'>
                        <aside
                            className='row-panel'
                            aria-label={t('rows.aria')}
                        >
                            <div className='panel-title-row'>
                                <PanelTitle>{t('rows.title')}</PanelTitle>
                                <AppButton
                                    ariaLabel={t('actions.help')}
                                    className='panel-help-button'
                                    icon={
                                        <CircleHelp
                                            size={20}
                                            aria-hidden='true'
                                        />
                                    }
                                    variant='ghost'
                                    onClick={() => {
                                        setIsHelpDialogOpen(true);
                                    }}
                                />
                            </div>
                            {sheetUrl ? (
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
                                                {String(index + 1).padStart(
                                                    2,
                                                    '0'
                                                )}
                                            </span>
                                            <strong>
                                                {card.phrase ||
                                                    t('rows.untitled')}
                                            </strong>
                                            <small>
                                                {card.reading ||
                                                    card.type ||
                                                    t('rows.noReading')}
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className='sheet-connect-empty'>
                                    <AppButton
                                        icon={
                                            <FileSpreadsheet
                                                size={20}
                                                aria-hidden='true'
                                            />
                                        }
                                        onClick={() => {
                                            setIsDialogOpen(true);
                                        }}
                                    >
                                        {t('actions.connectSheet')}
                                    </AppButton>
                                </div>
                            )}
                        </aside>

                        <section
                            className='edit-panel'
                            aria-label={t('edit.title')}
                        >
                            <PanelTitle>{t('edit.title')}</PanelTitle>
                            <label className='edit-field'>
                                <span>{t('edit.type')}</span>
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
                                <span>{t('edit.phraseReading')}</span>
                                <input
                                    placeholder={t(
                                        'edit.phraseReadingPlaceholder'
                                    )}
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
                                <span>{t('edit.meaning')}</span>
                                <textarea
                                    placeholder={t('edit.meaningPlaceholder')}
                                    rows={4}
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
                                <span>{t('edit.sentence')}</span>
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
                                className='edit-save-button'
                                disabled={isSaving}
                                icon={
                                    <CloudUpload size={20} aria-hidden='true' />
                                }
                                onClick={() => {
                                    void saveEditedCard();
                                }}
                            >
                                {isSaving
                                    ? t('actions.saving')
                                    : t('actions.saveEdit')}
                            </AppButton>
                        </section>

                        <section
                            className='preview-panel'
                            aria-label={t('preview.aria')}
                        >
                            <PanelTitle>{t('preview.title')}</PanelTitle>
                            <div
                                className='svg-preview'
                                dangerouslySetInnerHTML={{ __html: previewSvg }}
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
                                    ? t('actions.downloading')
                                    : t('actions.downloadPng')}
                            </AppButton>
                        </section>
                    </div>
                    {usedMessage ? (
                        <p className='studio-message' role='status'>
                            {usedMessage}
                        </p>
                    ) : null}
                </section>
            </main>
            <Footer />

            {isHelpDialogOpen ? (
                <div className='sheet-dialog-backdrop'>
                    <dialog className='sheet-dialog' open>
                        <div className='sheet-dialog-content'>
                            <div className='sheet-dialog-header'>
                                <h2>{t('rows.helpTitle')}</h2>
                                <AppButton
                                    ariaLabel={t('actions.dismiss')}
                                    className='sheet-dialog-dismiss'
                                    icon={<X size={20} aria-hidden='true' />}
                                    variant='ghost'
                                    onClick={() => {
                                        setIsHelpDialogOpen(false);
                                    }}
                                />
                            </div>
                            <p>{t('rows.helpBody')}</p>
                        </div>
                    </dialog>
                </div>
            ) : null}

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
                            <div className='sheet-dialog-header'>
                                <h2>{t('dialog.connectTitle')}</h2>
                                <AppButton
                                    ariaLabel={t('actions.dismiss')}
                                    className='sheet-dialog-dismiss'
                                    icon={<X size={20} aria-hidden='true' />}
                                    variant='ghost'
                                    onClick={closeConnectDialog}
                                />
                            </div>
                            <p>{t('dialog.connectBody')}</p>
                            <label className='sheet-dialog-field'>
                                <span>{t('sheet.urlLabel')}</span>
                                <input
                                    value={draftSheetUrl}
                                    onChange={(event) => {
                                        setDraftSheetUrl(event.target.value);
                                    }}
                                />
                            </label>
                            <div className='sheet-dialog-actions'>
                                <AppButton
                                    variant='ghost'
                                    onClick={closeConnectDialog}
                                >
                                    {t('actions.cancel')}
                                </AppButton>
                                <AppButton
                                    type='submit'
                                    disabled={connectionState === 'loading'}
                                    icon={<RefreshCw size={20} />}
                                >
                                    {t('actions.connect')}
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
                            <h2>{t('dialog.downloadedTitle')}</h2>
                            <p>{t('dialog.downloadedBody')}</p>
                            <div className='sheet-dialog-actions'>
                                <AppButton
                                    variant='ghost'
                                    onClick={() => {
                                        setIsMarkDialogOpen(false);
                                    }}
                                >
                                    {t('actions.notYet')}
                                </AppButton>
                                <AppButton
                                    disabled={isSaving}
                                    onClick={() => {
                                        void markSelectedCardAsUsed();
                                    }}
                                >
                                    {t('actions.markAsUsed', {
                                        phrase: selectedCard.phrase,
                                    })}
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
    const exportSvg = await inlineSvgAssets(svg);
    const svgBlob = new Blob([exportSvg], {
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

const assetDataUrlCache = new Map<string, Promise<string>>();

async function inlineSvgAssets(svg: string): Promise<string> {
    const assetUrls = Array.from(
        svg.matchAll(/url\((['"]?)([^'")]+)\1\)/g),
        (match) => match[2]
    ).filter((url) => !url.startsWith('data:'));

    let inlinedSvg = svg;

    for (const assetUrl of new Set(assetUrls)) {
        const dataUrl = await fetchAssetDataUrl(assetUrl);
        inlinedSvg = inlinedSvg.replaceAll(assetUrl, dataUrl);
    }

    return inlinedSvg;
}

function fetchAssetDataUrl(assetUrl: string): Promise<string> {
    const cached = assetDataUrlCache.get(assetUrl);

    if (cached) {
        return cached;
    }

    const promise = fetch(assetUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Could not load ${assetUrl} for PNG export (${response.status} ${response.statusText}).`
                );
            }

            return response.blob();
        })
        .then(blobToDataUrl);

    assetDataUrlCache.set(assetUrl, promise);

    return promise;
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener('load', () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Could not read SVG asset for PNG export.'));
                return;
            }

            resolve(reader.result);
        });
        reader.addEventListener('error', () => {
            reject(new Error('Could not read SVG asset for PNG export.'));
        });
        reader.readAsDataURL(blob);
    });
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
