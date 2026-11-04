import React from 'react';
import { audioSynthesizer } from '../../features/audio/audioSynthesizer';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      audioSynthesizer.playClick();
      onClick?.(e);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs font-semibold gap-1.5',
    lg: 'px-4 py-2.5 text-sm font-bold gap-2'
  }[size];

  const variantClasses = {
    default: 'win98-btn hover:bg-[#d4d0c8]',
    primary: 'win98-btn bg-[#000080] text-white hover:bg-[#1084d0] border-t-[#3b82f6] border-l-[#3b82f6]',
    danger: 'win98-btn bg-[#b91c1c] text-white hover:bg-[#dc2626] border-t-[#f87171] border-l-[#f87171]',
    gold: 'win98-btn bg-[#d97706] text-white hover:bg-[#f59e0b] border-t-[#fde047] border-l-[#fde047]'
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex items-center justify-center cursor-pointer select-none whitespace-nowrap active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
