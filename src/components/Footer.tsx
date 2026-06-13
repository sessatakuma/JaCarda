import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import './Footer.css';

export function Footer(): JSX.Element {
    const { t } = useTranslation();
    const emailAddress = 'contact@sessatakuma.dev';
    const socialLinks = [
        {
            icon: <InstagramIcon size={24} />,
            label: 'Instagram',
            pending: true,
        },
        {
            icon: <ThreadsIcon size={24} />,
            label: 'Threads',
            pending: true,
        },
        {
            icon: <FacebookIcon size={24} />,
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
        // eslint-disable-next-line no-alert
        globalThis.alert(t('footer.pendingAccount'));
    };

    return (
        <footer className='site-footer'>
            <div className='site-footer-inner'>
                <div className='site-footer-top'>
                    <a
                        aria-label='Sessatakuma'
                        className='site-footer-brand'
                        href='#main-content'
                    >
                        <img
                            alt=''
                            aria-hidden='true'
                            className='site-footer-logo'
                            height='128'
                            sizes='64px'
                            src='images/logo-128.png'
                            srcSet='images/logo-64.png 64w, images/logo-128.png 128w, images/logo.png 650w'
                            width='128'
                        />
                    </a>
                    <nav
                        aria-label={t('footer.socialLabel')}
                        className='site-footer-social'
                    >
                        <div className='site-footer-social-links'>
                            {socialLinks.map((link) =>
                                'pending' in link && link.pending === true ? (
                                    <button
                                        aria-label={link.label}
                                        className='site-footer-social-link'
                                        key={link.label}
                                        onClick={showPendingAccountDialog}
                                        type='button'
                                    >
                                        {link.icon}
                                    </button>
                                ) : (
                                    <a
                                        aria-label={link.label}
                                        className='site-footer-social-link'
                                        href={link.href}
                                        key={link.label}
                                    >
                                        {link.icon}
                                    </a>
                                )
                            )}
                        </div>
                        <a
                            aria-label={t('footer.emailLabel', {
                                email: emailAddress,
                            })}
                            className='site-footer-email-link'
                            href={`mailto:${emailAddress}`}
                        >
                            {emailAddress}
                        </a>
                    </nav>
                </div>

                <section aria-label='Sessatakuma' className='site-footer-about'>
                    <p>{t('footer.about')}</p>
                </section>
            </div>
            <p aria-label='Sessatakuma' className='site-footer-wordmark'>
                <span>Sessa</span>
                <span>takuma</span>
            </p>
        </footer>
    );
}

function InstagramIcon({ size = 24 }: { size?: number }): JSX.Element {
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
                d='M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm4.5 3.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5Zm5-2.25a1.25 1.25 0 1 1 0 2.5a1.25 1.25 0 0 1 0-2.5Z'
                fill='currentColor'
            />
        </svg>
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

function FacebookIcon({ size = 24 }: { size?: number }): JSX.Element {
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
                d='M14 8.25V6.5c0-.48.39-.875.875-.875H17V2h-3.125A4.875 4.875 0 0 0 9 6.875V8.25H6v4h3V22h5v-9.75h3.125l.625-4H14Z'
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
