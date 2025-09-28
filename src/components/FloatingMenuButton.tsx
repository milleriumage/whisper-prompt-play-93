import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingMenuButtonProps {
  onClick: () => void;
  onMouseEnter: () => void;
}

export const FloatingMenuButton: React.FC<FloatingMenuButtonProps> = ({
  onClick,
  onMouseEnter
}) => {
  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        size="icon"
        className={cn(
          "rounded-full shadow-lg transition-all duration-300",
          "bg-background border border-border/50 hover:bg-accent",
          "hover:scale-110 active:scale-95",
          "backdrop-blur-md"
        )}
      >
        <Menu size={20} className="text-foreground" />
      </Button>
    </div>
  );
};