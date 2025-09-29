import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Upload, Mic, Send, Edit, Plus, X, DoorOpen, Heart, Crown, Move, RotateCcw, Minimize2, Maximize2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useChatControls } from "@/hooks/useChatControls";
import { UserLinkDisplay } from "@/components/UserLinkDisplay";
import { useChatConfiguration } from "@/hooks/useChatConfiguration";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { useCreatorPermissions } from "@/hooks/useCreatorPermissions";
import { OnlineUsersDialog } from "@/components/OnlineUsersDialog";
import { GuestProfileDialog } from './GuestProfileDialog';
import { useGuestData } from '@/hooks/useGuestData';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useDraggableWindow } from '@/hooks/useDraggableWindow';
import { ResizeHandles } from './ResizeHandles';
import { ChatGiftSelector } from './ChatGiftSelector';
import { ChatGiftMessage } from './ChatGiftMessage';
import { GiftOpenDialog } from './GiftOpenDialog';
import { WishlistItem } from '@/hooks/useWishlist';

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
  const [currentMessage, setCurrentMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string>("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [messageLikes, setMessageLikes] = useState<{[key: string]: number}>({});
  const [messageReactions, setMessageReactions] = useState<{[key: string]: {[emoji: string]: number}}>({});
  const [isMinimalTheme, setIsMinimalTheme] = useState(false);
  const [showProfileImageDialog, setShowProfileImageDialog] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showGuestProfile, setShowGuestProfile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [openedGift, setOpenedGift] = useState<WishlistItem | null>(null);
  const [showGiftOpen, setShowGiftOpen] = useState(false);

  const {
    windowRef,
    windowStyle,
    isDragging,
    isResizing,
    handleDragStart,
    handleResizeStart,
    resetWindow,
    centerWindow,
  } = useDraggableWindow({
    initialPosition: { x: window.innerWidth - 340, y: 16 },
    initialSize: { width: 320, height: 400 },
    minSize: { width: 280, height: 300 },
    maxSize: { width: 600, height: 800 },
    storageKey: 'chatPopup'
  });

  const { controls } = useChatControls();
  const { config, saveConfig } = useChatConfiguration();
  const { user } = useGoogleAuth();
  const { onlineUsers } = useOnlinePresence(user?.id || 'global');
  const { blockUser, isUserBlocked } = useBlockedUsers();
  const { isCreator: userIsCreator, canEdit } = useCreatorPermissions(creatorId);
  const { guestData, updateGuestProfile } = useGuestData();
  
  // Use the same hook as ChatOverlay for real-time sync
  const { messages: realtimeMessages, sendMessage, updateMessageSpeech, clearMessages, isLoading, error } = useRealtimeMessages(creatorId);

  const [guestProfile, setGuestProfile] = useState({
    displayName: guestData.displayName,
    avatarUrl: guestData.avatarUrl,
  });

  useEffect(() => {
    setGuestProfile({
      displayName: guestData.displayName,
      avatarUrl: guestData.avatarUrl,
    });
  }, [guestData.displayName, guestData.avatarUrl]);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      setGuestProfile(prev => ({
        displayName: detail.displayName ?? prev.displayName ?? guestData.displayName,
        avatarUrl: detail.avatarUrl ?? prev.avatarUrl ?? guestData.avatarUrl,
      }));
    };
    window.addEventListener('guest-profile-updated', handler);
    return () => window.removeEventListener('guest-profile-updated', handler);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [realtimeMessages]);

  // Check if is visitor
  const isVisitor = !user || (creatorId && user.id !== creatorId);
  const isCreator = user && creatorId && user.id === creatorId;

  const handleToggle = () => {
    const newState = !showChatPopup;
    console.log(`[CHAT POPUP DEBUG] Alterando estado: ${showChatPopup} -> ${newState}`);
    setShowChatPopup(newState);
    onToggle?.(newState);

    toast.success(newState ? "💬 Chat Pop-up aberto" : "💬 Chat Pop-up fechado");
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim()) {
      const userName = isCreator 
        ? (config.userName || "Criador") 
        : (guestProfile.displayName || `Guest ${guestData.sessionId.slice(-4)}`);
      
      await sendMessage(userName, currentMessage, config.chatColor, `💬 ${userName}: ${currentMessage}`);
      setCurrentMessage("");
      
      // Auto scroll after sending
      setTimeout(scrollToBottom, 100);
    }
  };

  // Handle gift selection and sending
  const handleSelectGift = async (gift: WishlistItem) => {
    const userName = isCreator 
      ? (config.userName || "Criador") 
      : (guestProfile.displayName || `Guest ${guestData.sessionId.slice(-4)}`);
    
    // Send gift message with gift data
    await sendMessage(
      userName, 
      `🎁 Enviou um presente: ${gift.name}`, 
      config.chatColor, 
      `🎁 ${userName} enviou um presente: ${gift.name}`,
      undefined, // no whisper
      gift // gift data
    );
    
    setShowGiftSelector(false);
    toast.success(`🎁 Presente "${gift.name}" enviado!`);
    
    // Auto scroll after sending
    setTimeout(scrollToBottom, 100);
  };

  // Handle opening received gifts
  const handleOpenGift = (gift: WishlistItem) => {
    setOpenedGift(gift);
    setShowGiftOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const imageUrl = e.target?.result as string;
        sendMessage(config.userName || "You", `<img src="${imageUrl}" alt="Shared image" class="max-w-32 h-20 object-cover rounded cursor-pointer" data-expandable="true" />`, config.chatColor, `📸 ${config.userName || "You"} shared an image`);
        toast.success("📸 Image sent to chat!");
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    if (onTrialCheck && !onTrialCheck()) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Configure MediaRecorder for MP3 format
      const options = { mimeType: 'audio/webm' }; // Will convert to MP3 later
      const recorder = new MediaRecorder(stream, options);
      
      const audioChunks: Blob[] = [];
      
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const audioBase64 = reader.result as string;
          const userName = isCreator 
            ? (config.userName || "Criador") 
            : (guestProfile.displayName || `Guest ${guestData.sessionId.slice(-4)}`);
          
          // Send audio message with player
          const audioMessage = `<div class="audio-message flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
            <button onclick="this.nextElementSibling.play(); this.style.display='none'; this.nextElementSibling.nextElementSibling.style.display='block'" class="play-btn bg-primary text-white rounded-full p-2 hover:bg-primary/90 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 10 8L7 20V4z"/></svg>
            </button>
            <audio controls class="hidden" preload="metadata">
              <source src="${audioBase64}" type="audio/webm">
              Seu navegador não suporta áudio.
            </audio>
            <button onclick="this.previousElementSibling.pause(); this.previousElementSibling.currentTime=0; this.style.display='none'; this.previousElementSibling.previousElementSibling.style.display='block'" class="stop-btn bg-gray-500 text-white rounded-full p-2 hover:bg-gray-600 transition-colors hidden">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
            </button>
            <span class="text-sm text-gray-600">🎤 Mensagem de voz</span>
          </div>`;
          
          await sendMessage(userName, audioMessage, config.chatColor, `🎤 ${userName} enviou uma mensagem de voz`);
          toast.success("🎤 Mensagem de voz enviada!");
        };
        reader.readAsDataURL(audioBlob);
      };
      
      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
      
      // Auto stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      toast.error("❌ Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleEditMessage = (message: any) => {
    if (passwordProtected && onPasswordVerify) {
      onPasswordVerify(() => {});
    }
  };

  const handleEmojiReaction = (messageId: string, emoji: string) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [emoji]: (prev[messageId]?.[emoji] || 0) + 1
      }
    }));
    toast.success(`Reação ${emoji} adicionada!`);
  };

  const handleLikeMessage = (messageId: string) => {
    setMessageLikes(prev => ({
      ...prev,
      [messageId]: (prev[messageId] || 0) + 1
    }));
    toast.success("❤️ Message liked!");
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const newAvatar = e.target?.result as string;
          
          if (isCreator) {
            await saveConfig({ userAvatar: newAvatar });
            toast.success('✅ Avatar do criador salvo!');
          } else {
            updateGuestProfile({ avatarUrl: newAvatar });
            setGuestProfile(prev => ({ ...prev, avatarUrl: newAvatar }));
            window.dispatchEvent(new CustomEvent('guest-profile-updated', { detail: { avatarUrl: newAvatar } }));
            toast.success('✅ Avatar do visitante atualizado!');
          }
          
          setShowProfileImageDialog(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Erro no upload:', error);
        toast.error('❌ Erro inesperado no upload');
      }
    }
  };

  const handleImageClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLImageElement;
    if (target.tagName === 'IMG' && target.dataset.expandable) {
      setExpandedImage(target.src);
      setShowImageDialog(true);
    }
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

      {/* Chat Pop-up - Advanced floating window */}
      {showChatPopup && (
        <div ref={windowRef} style={windowStyle}>
          <div className={`flex flex-col overflow-hidden shadow-xl relative ${config.fleffyMode ? 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border-2 border-pink-200 rounded-3xl shadow-pink-100/50 shadow-2xl' : config.glassMorphism ? 'bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg' : isMinimalTheme ? 'bg-white border border-gray-200 rounded-xl' : 'bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl'} ${isDragging ? 'shadow-2xl scale-105' : ''} transition-all duration-200`} 
            style={{ height: '100%', backgroundColor: config.chatBackgroundColor !== "transparent" ? config.chatBackgroundColor : undefined }}>
            
            {/* Resize Handles */}
            <ResizeHandles onResizeStart={handleResizeStart} />
            
            {/* Header */}
            <div 
              className={`flex items-center justify-between p-2 border-b cursor-move select-none ${config.fleffyMode ? 'border-pink-200/50 bg-gradient-to-r from-pink-50/80 to-purple-50/80' : isMinimalTheme ? 'border-gray-200 bg-gray-50' : 'border-border/30 bg-muted/30'}`}
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Move className="w-3 h-3 text-muted-foreground" />
                <span className={`text-sm font-medium ${config.fleffyMode ? 'text-pink-700' : isMinimalTheme ? 'text-gray-900' : 'text-foreground'}`}>Chat Pop-up</span>
                <button 
                  onClick={() => setShowOnlineUsers(true)}
                  className={`text-xs ${config.fleffyMode ? 'text-purple-600 hover:text-purple-700' : isMinimalTheme ? 'text-gray-500 hover:text-gray-600' : 'text-muted-foreground hover:text-foreground'} transition-colors cursor-pointer hover:underline`}
                >
                  ({onlineUsers} online)
                </button>
              </div>
              <div className="flex items-center gap-1">
                {/* Exibir créditos atuais */}
                {isLoggedIn && (
                  <div className={`text-xs px-2 py-1 rounded-full border ${config.fleffyMode ? 'bg-pink-100 border-pink-200 text-pink-700' : isMinimalTheme ? 'bg-green-50 border-green-200 text-green-700' : 'bg-green-100 border-green-300 text-green-700'}`}>
                    {credits} créditos
                  </div>
                )}
                <UserLinkDisplay className="" />
                
                {/* Window Controls */}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsCollapsed(!isCollapsed)} 
                  className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 transition-colors"
                  title={isCollapsed ? "Expandir" : "Minimizar"}
                >
                  {isCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={centerWindow} 
                  className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 transition-colors"
                  title="Centralizar"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setShowChatPopup(false);
                    onToggle?.(false);
                  }} 
                  className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Messages Area - Hidden when collapsed */}
            {!isCollapsed && (
              <>
                <div 
                  ref={messagesContainerRef}
                  className={`flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40 ${config.fleffyMode ? 'bg-gradient-to-b from-pink-25/30 to-purple-25/30' : isMinimalTheme ? 'bg-white' : config.glassMorphism ? 'bg-transparent' : 'bg-gray-50'}`}
                  onClick={handleImageClick}
                >
                  {(() => {
                    const shouldShowMessages = !isVisitor || !config.hideHistoryFromVisitors || realtimeMessages.length > 0;
                    
                    if (!shouldShowMessages && isVisitor && realtimeMessages.length === 0) {
                      return (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          <p>Chat vazio - histórico oculto para visitantes</p>
                          <p className="text-xs mt-1">Apenas mensagens novas aparecerão aqui</p>
                        </div>
                      );
                    }
                    
                    return realtimeMessages.map(msg => (
                      <div key={msg.id} className="group animate-fade-in" data-message-id={msg.id}>
                        <div className={`flex ${
                          (msg.username === (config.userName || "Criador")) 
                            ? 'justify-start' : 'justify-end'
                        } mb-4`}>
                          <div className={`flex flex-col gap-1 max-w-[70%] ${
                              (msg.username === (config.userName || "Criador"))
                                ? 'items-start' : 'items-end'
                          }`}>
                            
                            {/* Gift message rendering */}
                            {msg.gift_data && (
                              <ChatGiftMessage 
                                gift={msg.gift_data as unknown as WishlistItem}
                                senderName={msg.username}
                                timestamp={new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                                creatorId={creatorId || ''}
                                isLoggedIn={isLoggedIn}
                                showPurchaseButton={true}
                              />
                            )}
                            
                            <div className={`px-4 py-2 rounded-2xl shadow-sm max-w-full break-words relative group ${
                              (msg.username === (config.userName || "Criador"))
                                ? `${config.fleffyMode ? 'bg-gradient-to-br from-pink-100 to-purple-100 text-pink-800' : config.glassMorphism ? 'bg-white/20 text-white backdrop-blur-sm' : isMinimalTheme ? 'bg-gray-100 text-gray-900' : 'bg-primary text-primary-foreground'}`
                                : `${config.fleffyMode ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-800' : config.glassMorphism ? 'bg-black/20 text-white backdrop-blur-sm' : isMinimalTheme ? 'bg-white border text-gray-900' : 'bg-muted text-muted-foreground'}`
                            }`}>
                              
                              <div className="flex items-start gap-2">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                  <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${config.fleffyMode ? 'border-pink-300' : 'border-white/50'}`}>
                                    <img 
                                      src={
                                        (msg.username === (config.userName || "Criador"))
                                          ? config.userAvatar || "/lovable-uploads/c747f540-792e-4d66-b664-9eb7295699f9.png"
                                          : guestProfile.avatarUrl || "/lovable-uploads/c747f540-792e-4d66-b664-9eb7295699f9.png"
                                      } 
                                      alt="Avatar" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  {/* Username */}
                                  <div className={`text-xs mb-1 font-medium ${config.fleffyMode ? 'text-pink-600' : 'text-current opacity-70'}`}>
                                    {msg.username}
                                    {msg.username === (config.userName || "Criador") && <Crown className="w-3 h-3 inline ml-1" />}
                                  </div>
                                  
                                  {/* Message content */}
                                  <div 
                                    className="text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: msg.message }}
                                  />
                                  
                                  {/* Timestamp */}
                                  <div className={`text-xs mt-1 ${config.fleffyMode ? 'text-pink-500' : 'text-current opacity-50'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Message actions */}
                              <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLikeMessage(msg.id)}
                                  className="h-6 w-6 p-0 bg-white/80 hover:bg-white rounded-full shadow-sm"
                                >
                                  <Heart className="w-3 h-3 text-red-500" />
                                </Button>
                                {messageLikes[msg.id] > 0 && (
                                  <span className="text-xs text-red-500 font-medium">{messageLikes[msg.id]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={`border-t p-3 ${config.fleffyMode ? 'border-pink-200/50 bg-gradient-to-r from-pink-50/80 to-purple-50/80' : isMinimalTheme ? 'border-gray-200 bg-gray-50' : 'border-border/30 bg-muted/30'}`}>
                  <div className="flex gap-2 mb-2">
                    {/* Audio Recording */}
                    <Button
                      size="sm"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`h-8 w-8 p-0 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    
                    {/* Image Upload */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    
                    {/* Gift Selector */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowGiftSelector(true)}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <Gift className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className={`flex-1 ${config.fleffyMode ? 'border-pink-200 focus:border-pink-400' : ''}`}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim()}
                      className="h-9 w-9 p-0 rounded-full"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={profileImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfileImageUpload}
      />

      {/* Dialogs */}
      <OnlineUsersDialog 
        open={showOnlineUsers} 
        onOpenChange={setShowOnlineUsers}
        onlineCount={onlineUsers}
        creatorId={creatorId}
      />

      <GuestProfileDialog
        isOpen={showGuestProfile}
        onClose={() => setShowGuestProfile(false)}
      />

      <ChatGiftSelector
        open={showGiftSelector}
        onOpenChange={setShowGiftSelector}
        onSelectGift={handleSelectGift}
        creatorId={creatorId || ''}
      />

      <GiftOpenDialog
        open={showGiftOpen}
        onOpenChange={setShowGiftOpen}
        gift={openedGift}
      />

      {/* Image expansion dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <img 
            src={expandedImage} 
            alt="Expanded view" 
            className="w-full h-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};