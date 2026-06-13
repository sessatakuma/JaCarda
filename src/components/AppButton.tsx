import type { JSX, ReactNode } from 'react';

import './AppButton.css';

export function AppButton({
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
            onClick={onClick}
            type={type}
        >
            {icon === undefined ? undefined : (
                <span className='button-icon'>{icon}</span>
            )}
            {children === undefined ? undefined : <span>{children}</span>}
        </button>
    );
}
