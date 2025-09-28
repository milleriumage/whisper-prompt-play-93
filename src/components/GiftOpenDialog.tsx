import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Star, Sparkles, Play, Pause, Download, ExternalLink } from "lucide-react";
import { WishlistItem } from "@/hooks/useWishlist";

interface GiftOpenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gift: WishlistItem | null;
}

export function GiftOpenDialog({ 
  open, 
  onOpenChange, 
  gift 
}: GiftOpenDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!gift) return null;

  const isVideo = gift.image_url?.includes('.mp4') || gift.image_url?.includes('.webm');
  const isAudio = gift.image_url?.includes('.mp3') || gift.image_url?.includes('.wav') || gift.image_url?.includes('.m4a');

  const handleMediaPlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (gift.image_url) {
      const link = document.createElement('a');
      link.href = gift.image_url;
      link.download = gift.name;
      link.click();
    }
  };

  const handleExternalLink = () => {
    if (gift.external_link) {
      window.open(gift.external_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/30 backdrop-blur-xl border border-primary/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30 animate-pulse">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            🎁 Presente Desbloqueado!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Celebratory Animation */}
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Sparkles 
                  key={i} 
                  className="w-6 h-6 text-yellow-400 animate-bounce" 
                  style={{ animationDelay: `${i * 0.2}s` }} 
                />
              ))}
            </div>
            <p className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Parabéns! Você desbloqueou: {gift.name}
            </p>
          </div>

          {/* Gift Content */}
          <Card className="overflow-hidden bg-gradient-to-br from-card via-card/90 to-secondary/20 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardContent className="p-0">
              {gift.image_url && (
                <div className="relative">
                  {isVideo ? (
                    <video 
                      src={gift.image_url}
                      controls
                      className="w-full h-64 object-cover"
                      autoPlay={isPlaying}
                    />
                  ) : isAudio ? (
                    <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/30 to-accent/30 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary" />
                        </div>
                        <audio 
                          src={gift.image_url}
                          controls
                          className="w-full max-w-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={gift.image_url} 
                      alt={gift.name}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  
                  {gift.is_favorite && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-yellow-400/90 backdrop-blur-sm rounded-full p-2">
                        <Star className="w-4 h-4 fill-yellow-600 text-yellow-600" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{gift.name}</h3>
                  
                  {gift.description && (
                    <p className="text-muted-foreground">
                      {gift.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-full px-3 py-1">
                      <span className="text-sm font-semibold text-primary">
                        💰 Valor: {gift.credits} créditos
                      </span>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full px-3 py-1">
                      <span className="text-sm font-semibold text-green-600">
                        ✅ Desbloqueado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {gift.image_url && (
                    <Button 
                      onClick={handleDownload}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  )}
                  
                  {gift.external_link && (
                    <Button 
                      onClick={handleExternalLink}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Link Externo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thank You Message */}
          <div className="text-center space-y-2 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
            <p className="font-semibold text-foreground">
              🎉 Obrigado por apoiar este criador!
            </p>
            <p className="text-sm text-muted-foreground">
              Seu apoio ajuda a manter este conteúdo incrível chegando até você.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}