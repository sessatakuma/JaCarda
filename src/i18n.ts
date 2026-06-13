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
                help: 'Help',
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
                meaningPlaceholder:
                    '- Orange juice, fruit, and sago dessert\n- Artist Orange Sago’s nickname (not really)',
                phraseReading: 'Phrase + Furigana',
                phraseReadingPlaceholder: '柳橙さご（オレンジさご）',
                sentence: 'Sentence',
                title: 'Edit',
                type: 'Type',
            },
            errors: {
                connectSheet: 'Could not connect to the Sheet.',
                downloadPng: 'Could not download PNG.',
                pngCanceled: 'PNG download canceled.',
                saveSheet: 'Could not save edits back to Google Sheets.',
                sheetMissing: 'Connect a Google Sheet before saving.',
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
                helpBody:
                    'Columns: phrase is the word, meaning is the definition, sentence is the example, type is the top label, reading is furigana, and usedAt hides used rows. Save syncs edits to Google Sheets.',
                helpTitle: 'Sheet help',
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
                help: '說明',
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
                meaning: '意思(請填寫中文)',
                meaningPlaceholder:
                    '- 以柳橙汁、果肉和西米製成的甜品\n- 繪師柳橙西米露的暱稱(並不是)',
                phraseReading: '詞句 + 假名',
                phraseReadingPlaceholder: '柳橙さご（オレンジさご）',
                sentence: '例句',
                title: '編輯',
                type: '類型',
            },
            errors: {
                connectSheet: '無法連接試算表。',
                downloadPng: '無法下載 PNG。',
                pngCanceled: '已取消 PNG 下載。',
                saveSheet: '無法將編輯儲存回 Google 試算表。',
                sheetMissing: '儲存前，請先連接 Google 試算表。',
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
                helpBody:
                    '欄位：phrase 是詞句，meaning 是意思，sentence 是例句，type 是上方標籤，reading 是假名來源，usedAt 會隱藏已使用列。儲存會同步回 Google 試算表。',
                helpTitle: '試算表說明',
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
