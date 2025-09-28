import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { EnhancedChat } from './EnhancedChat';
import { Card } from '@/components/ui/card';

interface ChatPopupButtonProps {
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
  messages?: any[];
  onSendMessage?: (username: string, message: string, color: string) => void;
  onEditMessage?: (message: any) => void;
}

export const ChatPopupButton: React.FC<ChatPopupButtonProps> = ({
  onToggle,
  className = "",
  creatorId,
  passwordProtected = false,
  onPasswordVerify,
  onTrialCheck,
  onSubtractCredits,
  credits = 0,
  isLoggedIn = false,
  visibilitySettings,
  messages = [],
  onSendMessage = () => {},
  onEditMessage = () => {}
}) => {
  const [showChatPopup, setShowChatPopup] = useState(false);

  const handleToggle = () => {
    const newState = !showChatPopup;
    console.log(`[CHAT POPUP DEBUG] Alterando estado: ${showChatPopup} -> ${newState}`);
    setShowChatPopup(newState);
    onToggle?.(newState);

    toast({
      title: newState ? "💬 Chat Pop-up aberto" : "💬 Chat Pop-up fechado",
      description: newState ? "Janela flutuante ativa" : "Janela flutuante fechada",
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
              className={`h-10 w-10 p-0 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl ${className}`}
            >
              <MessageCircle className={`w-5 h-5 ${showChatPopup ? 'text-blue-400' : 'text-white'}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>💬 {showChatPopup ? 'Fechar Chat Pop-up' : 'Abrir Chat Pop-up'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Chat Pop-up - Floating window in bottom right */}
      {showChatPopup && (
        <Card className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-card border shadow-2xl rounded-lg overflow-hidden">
          <div className="h-full">
            <EnhancedChat
              messages={messages}
              onSendMessage={onSendMessage}
              onEditMessage={onEditMessage}
              passwordProtected={passwordProtected}
              onPasswordVerify={onPasswordVerify}
              onTrialCheck={onTrialCheck}
              onSubtractCredits={onSubtractCredits}
              credits={credits}
              isLoggedIn={isLoggedIn}
              visibilitySettings={visibilitySettings}
              creatorId={creatorId}
              isPopupMode={true}
              onClose={() => {
                setShowChatPopup(false);
                onToggle?.(false);
              }}
            />
          </div>
        </Card>
      )}
    </>
  );
};