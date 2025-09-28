import React from 'react';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  logo?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = "DreamLink",
  logo
}) => {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40",
      "bg-background/95 backdrop-blur-md border-b border-border/50",
      "animate-fade-in"
    )}>
      <div className="flex items-center h-16 px-6">
        {logo && (
          <img 
            src={logo} 
            alt="Logo" 
            className="h-8 w-auto mr-3"
          />
        )}
        <h1 className="text-xl font-semibold text-foreground">
          {title}
        </h1>
      </div>
    </header>
  );
};