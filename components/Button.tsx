import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface BaseButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

type ButtonProps = BaseButtonProps & (
  (Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled'> & { as?: 'button' }) |
  (Omit<LinkProps, 'className'> & { as: typeof Link }) |
  (Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & { as: 'a' })
);

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  as,
  disabled,
  ...props
}) => {
  const effectiveDisabled = isLoading || disabled;

  const baseStyle =
    'font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group hover:shadow-xl dark:focus:ring-offset-gumball-dark-deep'; // Added dark mode focus offset

  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-gumball-blue text-white hover:bg-gumball-blue/90 focus:ring-gumball-blue hover:shadow-gumball-blue/40 dark:hover:bg-gumball-blue/80';
      break;
    case 'secondary':
      variantStyle = 'bg-gumball-pink text-white hover:bg-gumball-pink/90 focus:ring-gumball-pink hover:shadow-gumball-pink/40 dark:hover:bg-gumball-pink/80';
      break;
    case 'ghost':
      // Ensure good contrast for ghost button text in dark mode
      variantStyle = 'bg-transparent text-gumball-blue hover:bg-gumball-blue/10 focus:ring-gumball-blue dark:text-gumball-blue/90 dark:hover:bg-gumball-blue/20';
      break;
    case 'danger':
      variantStyle = 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 hover:shadow-red-500/40 dark:hover:bg-red-600/90';
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      break;
    case 'md':
      sizeStyle = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyle = 'px-6 py-3 text-lg';
      break;
  }

  const commonContent = (
    <>
      {isLoading && (
        <svg className="animate-spin -ms-1 me-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="me-2 group-hover:animate-wiggleSoft inline-block">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ms-2 group-hover:animate-wiggleSoft inline-block">{rightIcon}</span>}
    </>
  );

  const combinedClassName = `${baseStyle} ${variantStyle} ${sizeStyle} ${className}`;
  const disabledStylesManual = 'opacity-50 cursor-not-allowed transform-none hover:scale-100';

  if (as === Link) {
    const linkSpecificProps = props as Omit<LinkProps, 'className' | 'children'>;
    if (effectiveDisabled) {
      return (
        <span
          className={`${combinedClassName} ${disabledStylesManual}`}
          aria-disabled="true"
        >
          {commonContent}
        </span>
      );
    }
    return (
      <Link {...linkSpecificProps} className={combinedClassName}>
        {commonContent}
      </Link>
    );
  }

  if (as === 'a') {
    const anchorSpecificProps = props as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>;
     if (effectiveDisabled) {
      return (
        <a
          {...anchorSpecificProps}
          href={undefined}
          onClick={(e) => {
            e.preventDefault(); 
            if (anchorSpecificProps.onClick) {
                anchorSpecificProps.onClick(e);
            }
          }}
          className={`${combinedClassName} ${disabledStylesManual}`}
          aria-disabled="true"
          tabIndex={-1}
        >
          {commonContent}
        </a>
      );
    }
    return (
      <a {...anchorSpecificProps} className={combinedClassName}>
        {commonContent}
      </a>
    );
  }

  const buttonSpecificProps = props as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'disabled'>;
  return (
    <button
      {...buttonSpecificProps}
      className={combinedClassName}
      disabled={effectiveDisabled}
    >
      {commonContent}
    </button>
  );
};