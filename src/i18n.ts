/* eslint-disable complete/require-ascii */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    'en': {
        translation: {
            actions: {
                cancel: 'Cancel',
                connect: 'Connect',
                connectSheet: 'Connect to Google Sheet',
                downloadPng: 'Download PNG',
                downloading: 'Downloading...',
                dismiss: 'Dismiss',
                markAsUsed: 'Mark "{{phrase}}" as used',
                notYet: 'Not yet',
                saveEdit: 'Save edit to sheet',
                saving: 'Saving...',
            },
            dialog: {
                connectBody:
                    'Paste a public or published Sheet URL. The deployed Apps Script writeback is already configured.',
                connectTitle: 'Connect Google Sheet',
                downloadedBody:
                    'Confirm this card was generated before marking it used in Google Sheets.',
                downloadedTitle: 'PNG downloaded',
            },
            edit: {
                meaning: 'Meaning',
                phraseReading: 'Phrase + Furigana',
                sentence: 'Sentence',
                title: 'Edit',
                type: 'Type',
            },
            errors: {
                connectSheet: 'Could not connect to the Sheet.',
                downloadPng: 'Could not download PNG.',
                pngCanceled: 'PNG download canceled.',
                saveSheet: 'Could not save edits back to Google Sheets.',
                usedAtSheet: 'Could not write used date back to Google Sheets.',
                webhookMissing:
                    'Add an Apps Script webhook in Connect Google Sheet before saving.',
            },
            footer: {
                about: 'Sessatakuma is developing tools for Japanese learning and planning a Japanese speaking practice community. By sharing the complete practice system our team members built in the past, along with tools designed for that system, we want to help learners make speaking practice more efficient and steadily build the confidence to speak Japanese.',
                emailLabel: 'Email: {{email}}',
                pendingAccount: 'We are working on this account.',
                socialLabel: 'Social media',
            },
            preview: {
                aria: 'Editable SVG preview',
                title: 'Preview',
            },
            prompts: {
                editField: 'Edit {{field}}',
            },
            rows: {
                aria: 'Sheet rows',
                noReading: 'No reading',
                title: 'Sheet',
                untitled: 'Untitled card',
            },
            sheet: {
                urlLabel: 'Sheet URL',
            },
            status: {
                markedUsed: 'Marked "{{phrase}}" as used.',
                markingUsed: 'Marking "{{phrase}}" as used...',
                saved: 'Saved "{{phrase}}".',
                saving: 'Saving "{{phrase}}" to Google Sheets...',
            },
            studio: {
                aria: 'Card studio',
            },
            usage: {
                aria: 'Usage guide',
                intro: 'Prepare one row per card, connect the Sheet URL, adjust the preview, then export the card.',
                meaningBody:
                    'A single meaning stays unnumbered. Multiple meanings become a numbered list when separated by new lines, semicolons, or pipes, such as <code>to study | to learn</code>.',
                meaningTitle: 'Split meaning lists',
                readingBody:
                    'Put furigana in the reading column, or append it to the phrase like <code>散歩（さんぽ）</code> or <code>散歩(さんぽ)</code>.',
                readingTitle: 'Write readings clearly',
                saveBody:
                    'Save edit writes text changes back to the same Sheet row. After downloading a PNG, Mark as used writes usedAt and removes the row from the unused list.',
                saveTitle: 'Save and mark used',
                sheetBody:
                    'Use a public or published Google Sheet with <code>phrase</code>, <code>meaning</code>, and <code>sentence</code> columns. Add <code>type</code>, <code>reading</code>, or <code>usedAt</code> when needed.',
                sheetTitle: 'Set up the Sheet',
                title: 'Usage',
            },
        },
    },
    'zh-Hant': {
        translation: {
            actions: {
                cancel: '取消',
                connect: '連接',
                connectSheet: '連接 Google 試算表',
                downloadPng: '下載 PNG',
                downloading: '下載中...',
                dismiss: '關閉',
                markAsUsed: '將「{{phrase}}」標記為已使用',
                notYet: '還不要',
                saveEdit: '儲存編輯到試算表',
                saving: '儲存中...',
            },
            dialog: {
                connectBody:
                    '貼上公開或已發布的試算表網址。Apps Script 回寫已預先設定。',
                connectTitle: '連接 Google 試算表',
                downloadedBody:
                    '確認這張卡片已經產生後，再將它標記為已在 Google 試算表中使用。',
                downloadedTitle: 'PNG 已下載',
            },
            edit: {
                meaning: '意思',
                phraseReading: '詞句 + 假名',
                sentence: '例句',
                title: '編輯',
                type: '類型',
            },
            errors: {
                connectSheet: '無法連接試算表。',
                downloadPng: '無法下載 PNG。',
                pngCanceled: '已取消 PNG 下載。',
                saveSheet: '無法將編輯儲存回 Google 試算表。',
                usedAtSheet: '無法將使用日期寫回 Google 試算表。',
                webhookMissing:
                    '儲存前，請先在連接 Google 試算表中加入 Apps Script webhook。',
            },
            footer: {
                about: 'Sessatakuma 正在開發日語學習工具，並規劃日語口說練習社群。我們希望分享團隊過去建立的完整練習系統，以及為這套系統設計的工具，幫助學習者更有效率地練習口說，穩定累積說日語的信心。',
                emailLabel: 'Email: {{email}}',
                pendingAccount: '這個帳號還在準備中。',
                socialLabel: '社群媒體',
            },
            preview: {
                aria: '可編輯 SVG 預覽',
                title: '預覽',
            },
            prompts: {
                editField: '編輯 {{field}}',
            },
            rows: {
                aria: '試算表列',
                noReading: '沒有讀音',
                title: '試算表',
                untitled: '未命名卡片',
            },
            sheet: {
                urlLabel: '試算表網址',
            },
            status: {
                markedUsed: '已將「{{phrase}}」標記為已使用。',
                markingUsed: '正在將「{{phrase}}」標記為已使用...',
                saved: '已儲存「{{phrase}}」。',
                saving: '正在將「{{phrase}}」儲存到 Google 試算表...',
            },
            studio: {
                aria: '卡片工作區',
            },
            usage: {
                aria: '使用方式說明',
                intro: '每列準備一張卡片，連接試算表網址，調整預覽後匯出卡片。',
                meaningBody:
                    '單一意思不會編號。多個意思可用換行、分號或直線分隔，產生時會變成編號列表，例如 <code>to study | to learn</code>。',
                meaningTitle: '分隔多個意思',
                readingBody:
                    '讀音可放在 reading 欄位，也可以接在詞句後方，例如 <code>散歩（さんぽ）</code> 或 <code>散歩(さんぽ)</code>。',
                readingTitle: '清楚填寫讀音',
                saveBody:
                    '儲存編輯會把文字變更寫回同一列。下載 PNG 後，標記為已使用會寫入 usedAt，並從未使用清單中移除該列。',
                saveTitle: '儲存並標記已使用',
                sheetBody:
                    '使用公開或已發布的 Google 試算表，並包含 <code>phrase</code>、<code>meaning</code>、<code>sentence</code> 欄位。需要時可加入 <code>type</code>、<code>reading</code> 或 <code>usedAt</code>。',
                sheetTitle: '設定試算表',
                title: '使用方式',
            },
        },
    },
} as const;

export const i18nReady = i18next.use(initReactI18next).init({
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    lng: 'zh-Hant',
    resources,
});
