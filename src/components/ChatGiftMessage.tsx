import React, { useState, useCallback, useMemo, memo, Suspense } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Star, Sparkles } from "lucide-react";
import { WishlistItem } from "@/hooks/useWishlist";
import { GiftConfirmationDialog } from "./GiftConfirmationDialog";
import { GiftIconDisplay } from "./GiftIconDisplay";
import { useCreditPurchase } from "@/hooks/useCreditPurchase";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatGiftMessageProps {
  gift: WishlistItem;
  senderName: string;
  timestamp: string;
  creatorId: string; // ID do criador que vai receber os créditos
  isLoggedIn: boolean;
  showPurchaseButton?: boolean;
}

// Componente lazy para imagens
const LazyImage = memo(({ src, alt, className, onError }: { 
  src: string; 
  alt: string; 
  className: string; 
  onError: (e: any) => void;
}) => (
  <img 
    src={src} 
    alt={alt}
    className={className}
    loading="lazy"
    onError={onError}
  />
));

LazyImage.displayName = 'LazyImage';

// Componente lazy para vídeos
const LazyVideo = memo(({ src, className, onError }: { 
  src: string; 
  className: string; 
  onError: (e: any) => void;
}) => (
  <video 
    src={src}
    className={className}
    muted
    preload="none"
    onError={onError}
  />
));

LazyVideo.displayName = 'LazyVideo';

const ChatGiftMessage = memo(({ 
  gift, 
  senderName, 
  timestamp, 
  creatorId,
  isLoggedIn, 
  showPurchaseButton = true 
}: ChatGiftMessageProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { processCreditPurchase, isProcessing } = useCreditPurchase();
  const { user } = useGoogleAuth();
  const { credits } = useUserCredits();
  const { startRender, endRender } = usePerformanceMonitor('ChatGiftMessage');

  React.useEffect(() => {
    startRender();
    return () => endRender();
  });

  const handlePurchaseClick = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error('🔒 Faça login para desbloquear presentes!');
      return;
    }
    
    // Para usuários logados, verificar créditos DIRETAMENTE no banco antes de abrir modal
    if (user) {
      console.log(`[GIFT PURCHASE] Verificando créditos atuais do usuário ${user.id}...`);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao verificar créditos:', error);
          toast.error('❌ Erro ao verificar créditos. Tente novamente.');
          return;
        }
        
        const actualCredits = profile?.credits || 0;
        const requiredCredits = Number(gift.credits) || 0;
        
        console.log(`[GIFT PURCHASE] Créditos reais: ${actualCredits}, necessários: ${requiredCredits}`);
        
        if (actualCredits < requiredCredits) {
          toast.error(`❌ Créditos insuficientes! Você tem ${actualCredits} créditos, precisa de ${requiredCredits}.`);
          return;
        }
        
        // Forçar atualização dos créditos na UI
        window.dispatchEvent(new CustomEvent('credits-updated', { 
          detail: { newCredits: actualCredits } 
        }));
      } catch (error) {
        console.error('Erro ao verificar créditos:', error);
        toast.error('❌ Erro ao verificar créditos. Tente novamente.');
        return;
      }
    } else {
      // Para usuários guest, usar créditos do hook
      const userCredits = Number(credits) || 0;
      const requiredCredits = Number(gift.credits) || 0;
      
      if (userCredits < requiredCredits) {
        toast.error(`❌ Créditos insuficientes! Você tem ${userCredits} créditos, precisa de ${requiredCredits}.`);
        return;
      }
    }
    
    setShowConfirmation(true);
  }, [isLoggedIn, user, credits, gift.credits]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!user || !gift.id) return;

    const result = await processCreditPurchase({
      mediaId: gift.id,
      creatorId: creatorId,
      creditPrice: gift.credits,
      mediaTitle: gift.name
    });

    if (result.success) {
      toast.success(`✅ ${gift.name} desbloqueado! Seus créditos foram atualizados.`);
      setShowConfirmation(false);
    } else {
      toast.error(`❌ ${result.error || 'Erro ao processar compra'}`);
    }
  }, [user, gift.id, gift.credits, gift.name, processCreditPurchase, creatorId]);

  // Memoizar se deve mostrar thumbnail
  const shouldShowThumbnail = useMemo(() => 
    gift.show_thumbnail && (gift.image_url || gift.video_url), 
    [gift.show_thumbnail, gift.image_url, gift.video_url]
  );

  // Memoizar handlers de erro
  const handleImageError = useCallback((e: any) => {
    console.log('Erro ao carregar imagem do presente:', gift.image_url);
    e.currentTarget.style.display = 'none';
  }, [gift.image_url]);

  const handleVideoError = useCallback((e: any) => {
    console.log('Erro ao carregar vídeo do presente:', gift.video_url);
    e.currentTarget.style.display = 'none';
  }, [gift.video_url]);

  return (
    <>
      {gift.display_mode === 'icon' ? (
        <GiftIconDisplay
          gift={gift}
          senderName={senderName}
          timestamp={timestamp}
          onGiftClick={handlePurchaseClick}
          isLoggedIn={isLoggedIn}
          isProcessing={isProcessing}
        />
      ) : (
        <Card 
          className={`max-w-sm relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-0 ${
            !gift.show_custom_button ? 'cursor-pointer' : ''
          }`}
          onClick={!gift.show_custom_button ? handlePurchaseClick : undefined}
        >
          {/* Background with blurred gift image/video */}
          {shouldShowThumbnail && (
            <div className="absolute inset-0 z-0">
              <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse" />}>
                {gift.image_url ? (
                  <LazyImage 
                    src={gift.image_url} 
                    alt={gift.name}
                    className="w-full h-full object-cover blur-md scale-110"
                    onError={handleImageError}
                  />
                ) : gift.video_url ? (
                  <LazyVideo 
                    src={gift.video_url}
                    className="w-full h-full object-cover blur-md scale-110"
                    onError={handleVideoError}
                  />
                ) : null}
              </Suspense>
              {/* Dark gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
          )}
          
          <CardContent className="relative z-10 p-6">
            <div className="space-y-5">
              {/* Header with icon and sparkles */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">🎁 Presente Recebido</h3>
                    <p className="text-sm text-gray-200">de {senderName}</p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>

              {/* Credits display - center highlight */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 rounded-full px-6 py-3 backdrop-blur-sm border border-white/20 shadow-lg">
                  <span className="text-lg font-bold text-white flex items-center gap-2">
                    💎 {gift.credits} créditos
                  </span>
                </div>
              </div>

              {/* Gift media thumbnail when available and enabled */}
              {(gift.image_url || gift.video_url) && (
                <div className="flex justify-center">
                  <div className="relative overflow-hidden rounded-xl border border-white/20 shadow-lg">
                    <Suspense fallback={<div className="w-24 h-24 bg-muted animate-pulse rounded-xl" />}>
                      {gift.image_url ? (
                        <LazyImage 
                          src={gift.image_url} 
                          alt={gift.name}
                          className="w-24 h-24 object-cover"
                          onError={handleImageError}
                        />
                      ) : gift.video_url ? (
                        <LazyVideo 
                          src={gift.video_url}
                          className="w-24 h-24 object-cover"
                          onError={handleVideoError}
                        />
                      ) : null}
                    </Suspense>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs truncate">{gift.name}</h4>
                        {gift.is_favorite && (
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Gift name when no media or thumbnail disabled */}
              {(!gift.image_url && !gift.video_url) && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h4 className="font-bold text-white text-lg">{gift.name}</h4>
                    {gift.is_favorite && (
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {gift.description && (
                <div className="text-center">
                  <p className="text-sm text-gray-200 bg-black/30 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                    {gift.description}
                  </p>
                </div>
              )}

              {/* Action Button - Premium style */}
              {showPurchaseButton && gift.show_custom_button && (
                <Button 
                  onClick={handlePurchaseClick}
                  className="w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
                  disabled={!isLoggedIn || isProcessing}
                >
                  <Gift className="w-5 h-5 mr-2" />
                  {isProcessing ? 'Desbloqueando...' : !isLoggedIn ? 'Faça login para desbloquear' : (gift.button_text || 'Desbloquear Presente')}
                </Button>
              )}

              {/* Timestamp footer */}
              <div className="flex justify-center">
                <div className="bg-black/30 rounded-full px-4 py-2 backdrop-blur-sm border border-white/10">
                  <span className="text-xs text-gray-300">{timestamp}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <GiftConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        item={gift}
        userCredits={credits}
        onConfirm={handleConfirmPurchase}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
});

ChatGiftMessage.displayName = 'ChatGiftMessage';

export { ChatGiftMessage };