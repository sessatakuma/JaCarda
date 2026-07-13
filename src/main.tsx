import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './components/App.js';
import { i18nReady } from './i18n.js';

import './global.css';

const rootElement = document.querySelector('#root');

if (rootElement === null) {
    throw new Error('Expected #root to exist before mounting the app.');
}

await i18nReady;

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
