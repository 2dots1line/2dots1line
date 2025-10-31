import React from 'react';
import { cn } from '../utils/cn';

export interface GlassmorphicPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass-panel' | 'custom';
  opacity?: number;
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  border?: boolean;
  borderOpacity?: number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'mobile';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// Convert to forwardRef so consumers can pass `ref`
const GlassmorphicPanel = React.forwardRef<HTMLDivElement, GlassmorphicPanelProps>(function GlassmorphicPanel(
  {
    children,
    className = '',
    variant = 'glass-panel',
    opacity = 15,
    blur = 'lg',
    border = true,
    borderOpacity = 20,
    rounded = 'lg',
    padding = 'md',
    shadow = 'md',
    ...rest
  },
  ref
) {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    mobile: 'p-1',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  const backgroundOpacity = `bg-white/${opacity}`;
  const borderClass = border ? `border border-white/${borderOpacity}` : '';

  return (
    <div
      ref={ref}
      className={cn(
        backgroundOpacity,
        blurClasses[blur],
        borderClass,
        roundedClasses[rounded],
        paddingClasses[padding],
        shadowClasses[shadow],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export default GlassmorphicPanel;