import React from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  disabled,
  onClick,
  ...props 
}) => {
  const baseStyles = "rounded-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variants = {
    // Dynamic Brand Color
    primary: "bg-brand text-brand-text shadow-lg shadow-brand/20 dark:shadow-none hover:brightness-105",
    // Sage Outline/Solid
    secondary: "bg-white dark:bg-navy-surface text-sage-dark dark:text-sage border-2 border-sage/30 hover:bg-sage/10",
    ghost: "bg-transparent text-warmGray dark:text-text-secondary hover:bg-warmGray-light/20",
    danger: "bg-peach-50 text-peach-600 hover:bg-peach-100 dark:bg-peach-500/10 dark:text-peach-300"
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Add haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available
    }
    
    // Call the original onClick handler
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
      ) : children}
    </button>
  );
};

export default Button;