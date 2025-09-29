import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveMainContentProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export const ResponsiveMainContent: React.FC<ResponsiveMainContentProps> = ({
  children,
  height = '100vh',
  className
}) => {
  // Determine layout mode based on height
  const isAutoFit = height === 'fit-content';
  const isCalculated = height?.includes('calc');
  
  // Create dynamic styles
  const contentStyles = {
    height: isAutoFit ? 'auto' : height,
    minHeight: isAutoFit ? '60vh' : isCalculated ? height : '100vh',
    maxHeight: isAutoFit ? 'none' : '100vh',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  return (
    <div 
      className={cn(
        "w-full flex flex-col overflow-hidden",
        isAutoFit ? "relative" : "fixed inset-0",
        className
      )}
      style={contentStyles}
    >
      {/* Content wrapper with proper spacing */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center",
        isAutoFit && "py-8 min-h-[60vh]"
      )}>
        {children}
      </div>
      
      {/* Bottom spacer for auto-fit mode */}
      {isAutoFit && (
        <div className="h-20 flex-shrink-0" />
      )}
    </div>
  );
};