import React from 'react';

interface RetroWindowProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  headerRight?: React.ReactNode;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({
  title,
  icon = '🎰',
  children,
  onClose,
  className = '',
  headerRight
}) => {
  return (
    <div className={`bg-[#c0c0c0] text-black win98-box p-1 font-sans flex flex-col select-none ${className}`}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] via-[#1084d0] to-[#000080] text-white px-2 py-1 flex items-center justify-between text-xs font-bold shadow-sm">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-sm shrink-0">{icon}</span>
          <span className="tracking-wide truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {headerRight}
          {onClose && (
            <button
              onClick={onClose}
              className="win98-btn w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none cursor-pointer hover:bg-red-600 hover:text-white"
              title="Đóng cửa sổ"
              aria-label="Đóng"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Body content */}
      <div className="p-2 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
