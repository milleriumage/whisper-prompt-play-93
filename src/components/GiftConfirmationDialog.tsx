import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Star, CreditCard, User, AlertCircle } from "lucide-react";
import { WishlistItem } from "@/hooks/useWishlist";

interface GiftConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishlistItem | null;
  userCredits: number;
  onConfirm: () => void;
  isLoggedIn: boolean;
}

export function GiftConfirmationDialog({ 
  open, 
  onOpenChange, 
  item, 
  userCredits, 
  onConfirm, 
  isLoggedIn 
}: GiftConfirmationDialogProps) {
  if (!item) return null;

  const currentCredits = Number(userCredits);
  const itemCredits = Number(item.credits);
  
  console.log(`[GIFT CONFIRMATION DEBUG] Créditos - Atual: ${currentCredits} (${typeof currentCredits}), Necessário: ${itemCredits} (${typeof itemCredits})`);
  console.log(`[GIFT CONFIRMATION DEBUG] Item data:`, { 
    name: item.name, 
    credits: item.credits, 
    image_url: item.image_url, 
    video_url: item.video_url,
    description: item.description 
  });
  
  const hasEnoughCredits = currentCredits >= itemCredits;
  const needsLogin = !isLoggedIn;

  // Determinar tipo de mídia
  const getMediaType = () => {
    if (item.image_url) return 'Imagem';
    if (item.video_url) return 'Vídeo';
    if (item.model_file_url) return 'Modelo 3D';
    return 'Mídia';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-0 bg-transparent p-0 overflow-hidden">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          {/* Background blur effect with media */}
          {(item.image_url || item.video_url) && (
            <div className="absolute inset-0">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover blur-xl scale-110"
                />
              ) : item.video_url ? (
                <video 
                  src={item.video_url}
                  className="w-full h-full object-cover blur-xl scale-110"
                  muted
                  autoPlay
                  loop
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/90" />
            </div>
          )}
          
          {/* Content overlay */}
          <div className="relative z-10 p-8 bg-background/95 backdrop-blur-md border border-border/50">
            <DialogHeader className="text-center space-y-4">
              <DialogTitle className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                    <Gift className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <Star className="w-3 h-3 text-yellow-900 fill-yellow-900" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    🎁 Desbloquear Presente
                  </h2>
                  <p className="text-muted-foreground">
                    {item.name ? `"${item.name}"` : 'Confirme para visualizar o conteúdo especial'}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Present Preview */}
              <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="flex items-center gap-4">
                  {/* Media Preview */}
                  {(item.image_url || item.video_url) && (
                    <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 shadow-lg">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-20 h-20 object-cover filter blur-sm"
                        />
                      ) : item.video_url ? (
                        <video 
                          src={item.video_url}
                          className="w-20 h-20 object-cover filter blur-sm"
                          muted
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">
                          🔒 BLOQUEADO
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Present Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">{item.name || 'Presente Especial'}</h3>
                      {item.is_favorite && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    
                    {/* Tipo/Formato da Mídia */}
                    <div className="inline-flex items-center gap-2 bg-muted/60 rounded-full px-3 py-1 text-xs">
                      <span className="font-medium text-muted-foreground">
                        📂 {getMediaType()}
                      </span>
                    </div>
                    
                    {/* Credits Display - More Prominent */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent rounded-full px-4 py-2 shadow-lg">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">💎</span>
                      </div>
                      <span className="text-lg font-bold text-primary-foreground">
                        {item.credits || 0} créditos
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mt-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Status */}
              <div className="space-y-3">
                {needsLogin ? (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl">
                    <User className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200">Login necessário</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">Faça login para desbloquear este presente</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <p className="font-semibold text-blue-800 dark:text-blue-200">
                        Seus créditos: {currentCredits} 💎
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${hasEnoughCredits ? 'bg-green-500' : 'bg-red-500'}`} />
                      <p className="text-sm font-medium">
                        {hasEnoughCredits ? 
                          '✅ Créditos suficientes para desbloquear!' : 
                          `❌ Faltam ${itemCredits - currentCredits} créditos`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Info */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
                <p className="text-center font-medium text-foreground">
                  💫 Após o desbloqueio, a mídia ficará visível sem blur por 7 dias
                </p>
              </div>

              {/* Debug Info - apenas em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs space-y-1">
                  <p><strong>Debug:</strong></p>
                  <p>• userCredits prop: {userCredits} ({typeof userCredits})</p>
                  <p>• currentCredits: {currentCredits} ({typeof currentCredits})</p>
                  <p>• item.credits: {item.credits} ({typeof item.credits})</p>
                  <p>• itemCredits: {itemCredits} ({typeof itemCredits})</p>
                  <p>• hasEnoughCredits: {hasEnoughCredits.toString()}</p>
                  <p>• isLoggedIn: {isLoggedIn.toString()}</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <DialogFooter className="flex gap-3 mt-8">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-full border-2 hover:bg-muted/80"
              >
                Cancelar
              </Button>
              
              {needsLogin ? (
                <Button 
                  onClick={() => onOpenChange(false)} 
                  className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent hover:scale-105 transform transition-all duration-200"
                >
                  Fazer Login
                </Button>
              ) : !hasEnoughCredits ? (
                <Button 
                  disabled 
                  className="flex-1 rounded-full bg-gray-400 cursor-not-allowed opacity-50"
                >
                  Créditos Insuficientes
                </Button>
              ) : (
                <Button 
                  onClick={onConfirm} 
                  className="flex-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold hover:scale-105 transform transition-all duration-200 shadow-lg"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Visualizar Presente
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}