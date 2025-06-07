import React from 'react';

import { cn } from '../utils/cn';

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: 'default' | 'compact';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className,
  variant = 'default',
}) => {
  if (!message) return null;

  const variantClasses = {
    default: 'mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20',
    compact: 'mt-1',
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
};

export default ErrorMessage; 