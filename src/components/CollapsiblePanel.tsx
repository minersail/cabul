'use client';

import { ReactNode, useState } from 'react';

interface CollapsiblePanelProps {
  startOpen?: boolean;
  direction: 'horizontal' | 'vertical';
  children: ReactNode;
  
  // Horizontal-specific props
  collapsedWidth?: string;
  expandedWidth?: string;
  
  // Vertical-specific props
  maxHeight?: string;
  
  // Styling props
  className?: string;
  toggleButtonClassName?: string;
  contentClassName?: string;
  arrowSize?: 'sm' | 'md' | 'lg';
}

export default function CollapsiblePanel({
  startOpen = false,
  direction,
  children,
  collapsedWidth = 'w-8',
  expandedWidth = 'w-64',
  maxHeight = 'max-h-96',
  className = '',
  toggleButtonClassName = '',
  contentClassName = '',
  arrowSize = 'md'
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(startOpen);
  const arrowSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getArrowPath = () => {
    if (direction === 'horizontal') {
      return isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7";
    } else {
      return "M19 9l-7 7-7-7";
    }
  };

  const getArrowClasses = () => {
    const baseClasses = `${arrowSizes[arrowSize]} transition-transform duration-300`;
    if (direction === 'vertical' && isOpen) {
      return `${baseClasses} rotate-180`;
    }
    return baseClasses;
  };

  const getContainerClasses = () => {
    const baseClasses = `transition-all duration-300 ${className}`;
    if (direction === 'horizontal') {
      return `${baseClasses} ${isOpen ? expandedWidth : collapsedWidth} shrink-0 relative`;
    } else {
      return baseClasses;
    }
  };

  const getContentClasses = () => {
    if (direction === 'horizontal') {
      return `${expandedWidth} ${contentClassName}`;
    } else {
      return `transition-all duration-300 overflow-hidden ${isOpen ? `${maxHeight} opacity-100` : 'max-h-0 opacity-0'} ${contentClassName}`;
    }
  };

  const getToggleButtonClasses = () => {
    const baseClasses = `w-full hover:bg-gray-200 transition-colors ${toggleButtonClassName}`;
    if (direction === 'horizontal') {
      return `${baseClasses} p-2 ${isOpen ? 'mb-2' : ''}`;
    } else {
      return `${baseClasses} p-4 text-left`;
    }
  };

  return (
    <div className={getContainerClasses()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={getToggleButtonClasses()}
        style={{ fontFamily: 'var(--font-playfair-display)' }}
      >
        <div className="flex justify-center items-center">
          <svg 
            className={getArrowClasses()}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={getArrowPath()} 
            />
          </svg>
        </div>
      </button>
      
      {/* Horizontal collapse removes the component altogether */}
      {(direction === 'horizontal' ? isOpen : true) && (
        <div className={getContentClasses()}>
          {direction === 'vertical' && (
            <div 
              className="p-1 max-h-400 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: #f3f4f6;
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #d1d5db;
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af;
                }
              `}</style>
              {children}
            </div>
          )}
          {direction === 'horizontal' && children}
        </div>
      )}
    </div>
  );
} 