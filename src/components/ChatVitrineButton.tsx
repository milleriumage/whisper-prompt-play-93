import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { ChatOverlay } from './ChatOverlay';

interface ChatVitrineButtonProps {
  onToggle?: (isOpen: boolean) => void;
  className?: string;
  creatorId?: string;
  passwordProtected?: boolean;
  onPasswordVerify?: (callback: () => void) => void;
  onTrialCheck?: () => boolean;
  onSubtractCredits?: (amount: number, action?: string) => void;
  credits?: number;
  isLoggedIn?: boolean;
  visibilitySettings?: {
    showChatEditing?: boolean;
    showChatCloseIcon?: boolean;
  };
}

export const ChatVitrineButton: React.FC<ChatVitrineButtonProps> = ({
  onToggle,
  className = "",
  creatorId,
  passwordProtected = false,
  onPasswordVerify,
  onTrialCheck,
  onSubtractCredits,
  credits = 0,
  isLoggedIn = false,
  visibilitySettings
}) => {
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  const handleToggle = () => {
    const newState = !showChatOverlay;
    console.log(`[CHAT VITRINE DEBUG] Alterando estado: ${showChatOverlay} -> ${newState}`);
    setShowChatOverlay(newState);
    onToggle?.(newState);

    toast({
      title: newState ? "📺 Chat Vitrine ativado" : "📺 Chat Vitrine desativado",
      description: newState ? "Chat sobrepõe a vitrine" : "Vitrine restaurada",
      duration: 3000
    });
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleToggle}
              size="sm"
              variant="ghost"
              className={`h-10 w-10 p-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl ${className}`}
            >
              <Monitor className={`w-5 h-5 ${showChatOverlay ? 'text-purple-400' : 'text-white'}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>📺 {showChatOverlay ? 'Fechar Chat Vitrine' : 'Abrir Chat Vitrine'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Chat Overlay - Covers the showcase/vitrine */}
      {showChatOverlay && (
        <ChatOverlay
          onClose={() => {
            setShowChatOverlay(false);
            onToggle?.(false);
          }}
          creatorId={creatorId}
          passwordProtected={passwordProtected}
          onPasswordVerify={onPasswordVerify}
          onTrialCheck={onTrialCheck}
          onSubtractCredits={onSubtractCredits}
          credits={credits}
          isLoggedIn={isLoggedIn}
          visibilitySettings={visibilitySettings}
        />
      )}
    </>
  );
};