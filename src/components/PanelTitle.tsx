import type { JSX, ReactNode } from 'react';

import './PanelTitle.css';

export function PanelTitle({ children }: { children: ReactNode }): JSX.Element {
    return <h2 className='panel-title'>{children}</h2>;
}
