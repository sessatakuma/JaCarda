import type { JSX } from 'react';

import './Nav.css';

export function Nav(): JSX.Element {
    return (
        <header className='nav'>
            <div aria-label='JaCarda' className='nav-brand'>
                <a className='nav-title' href='#main-content'>
                    <img
                        alt=''
                        aria-hidden='true'
                        className='logo'
                        height='64'
                        sizes='32px'
                        src='images/logo-64.png'
                        srcSet='images/logo-64.png 64w, images/logo-128.png 128w, images/logo.png 650w'
                        width='64'
                    />
                    <span className='title'>JaCarda</span>
                </a>
            </div>
        </header>
    );
}
