import { type HTMLAttributes, forwardRef } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'lg', className = '', children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'max-w-xl',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={`mx-auto px-4 sm:px-6 ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
