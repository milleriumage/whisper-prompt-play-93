import React, { useState, useCallback, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Gift, Star, Sparkles } from "lucide-react";
import { WishlistItem } from "@/hooks/useWishlist";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

interface GiftIconDisplayProps {
  gift: WishlistItem;
  senderName: string;
  timestamp: string;
  onGiftClick: () => void;
  isLoggedIn: boolean;
  isProcessing?: boolean;
}

const GiftIconDisplay = memo(({ 
  gift, 
  senderName, 
  timestamp, 
  onGiftClick,
  isLoggedIn,
  isProcessing = false
}: GiftIconDisplayProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { startRender, endRender } = usePerformanceMonitor('GiftIconDisplay');

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  React.useEffect(() => {
    startRender();
    return () => endRender();
  });

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all duration-200">
      {/* Gift Icon */}
      <div 
        className="relative cursor-pointer transform hover:scale-110 transition-all duration-200"
        onClick={onGiftClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-2 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
          <Gift className="w-5 h-5 text-primary-foreground" />
        </div>
        
        {/* Sparkle animation */}
        {isHovered && (
          <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
        )}
      </div>

      {/* Gift Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            🎁 {gift.name}
          </span>
          {gift.is_favorite && (
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>de {senderName}</span>
          <span>•</span>
          <span>💎 {gift.credits} créditos</span>
          <span>•</span>
          <span>{timestamp}</span>
        </div>
      </div>

      {/* Custom Button or Click Area */}
      {gift.show_custom_button && gift.button_text ? (
        <Button 
          onClick={onGiftClick}
          size="sm"
          className="bg-gradient-to-r from-primary to-accent hover:scale-105 transform transition-all duration-200"
          disabled={!isLoggedIn || isProcessing}
        >
          {isProcessing ? 'Processando...' : gift.button_text}
        </Button>
      ) : null}
    </div>
  );
});

GiftIconDisplay.displayName = 'GiftIconDisplay';

export { GiftIconDisplay };