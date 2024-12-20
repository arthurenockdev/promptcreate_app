import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface ButtonProps {
  className?: string;
  disabledClassName?: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = memo(
  ({ 
    className, 
    disabledClassName, 
    disabled = false, 
    active = false, 
    children, 
    onClick,
    type = 'button'
  }: ButtonProps) => {
    return (
      <button
        type={type}
        className={classNames(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed',
          {
            [classNames('opacity-30', disabledClassName)]: disabled,
            'active-class': active,
          },
          className,
        )}
        disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            return;
          }
          onClick?.(event);
        }}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
