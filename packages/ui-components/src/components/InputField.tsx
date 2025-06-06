import React from 'react';
import { cn } from '../utils/cn';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || props.name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div>
      {/* Label */}
      <label 
        htmlFor={inputId} 
        className="block text-sm font-medium text-onSurface mb-2"
      >
        {label}
      </label>
      
      {/* Input */}
      <input
        id={inputId}
        className={cn(
          // Base styling
          'w-full px-4 py-3 rounded-lg',
          'bg-surface/30 border backdrop-blur-sm',
          'text-onSurface placeholder-onSurface/50',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Error styling
          hasError ? 'border-red-500/50' : 'border-outline/30',
          className
        )}
        {...props}
      />
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-onSurface/50">{helperText}</p>
      )}
    </div>
  );
};

export default InputField; 