import React from 'react';

import { cn } from '../utils/cn';

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: 'default' | 'compact' | 'glassmorphic';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className,
  variant = 'glassmorphic',
}) => {
  if (!message) return null;

  const variantClasses = {
    default: 'mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20',
    compact: 'mt-1',
    glassmorphic: 'mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 backdrop-blur-sm',
  };

  const textClasses = {
    default: 'text-red-400 text-sm',
    compact: 'text-red-400 text-xs',
    glassmorphic: 'text-red-200 text-sm font-medium',
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      <p className={cn(textClasses[variant])}>{message}</p>
    </div>
  );
};

export default ErrorMessage; 