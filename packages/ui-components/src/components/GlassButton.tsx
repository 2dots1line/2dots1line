import React from 'react';
import { cn } from '../utils/cn';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  isLoading = false,
  loadingText,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    // Glass panel base styling
    'glass-panel',
    'font-brand',
    'transition-colors duration-300',
    'focus:outline-none focus:ring-2 focus:ring-primary/50',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const variantClasses = {
    default: 'text-onBackground hover:bg-white/10',
    primary: 'bg-primary text-onPrimary hover:bg-primary/90',
    secondary: 'bg-surface text-onSurface hover:bg-surface/80',
  };

  const sizeClasses = {
    sm: 'px-4 py-1.5 text-xs rounded-md',
    md: 'px-6 py-2 text-sm rounded-lg',
    lg: 'px-8 py-3 text-base rounded-xl',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (loadingText || 'Loading...') : children}
    </button>
  );
};

export default GlassButton; 