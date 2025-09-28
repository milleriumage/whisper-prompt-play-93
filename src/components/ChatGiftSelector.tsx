import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Upload, Star, Plus, X } from "lucide-react";
import { useWishlist, WishlistItem } from "@/hooks/useWishlist";
import { toast } from "sonner";

interface ChatGiftSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGift: (gift: WishlistItem) => void;
  creatorId?: string;
}

export function ChatGiftSelector({ 
  open, 
  onOpenChange, 
  onSelectGift,
  creatorId 
}: ChatGiftSelectorProps) {
  const { wishlistItems, addWishlistItem } = useWishlist();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGift, setNewGift] = useState({
    name: '',
    credits: 0,
    image: '',
    video: '',
    description: '',
    displayMode: 'card' as 'card' | 'icon',
    showThumbnail: true,
    showCustomButton: false,
    buttonText: ''
  });

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (file.type.startsWith('video/')) {
          setNewGift(prev => ({ ...prev, video: result, image: '' }));
        } else {
          setNewGift(prev => ({ ...prev, image: result, video: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGift = async () => {
    if (!newGift.name || newGift.credits <= 0) {
      toast.error("Preencha nome e créditos válidos");
      return;
    }

    const giftItem: Omit<WishlistItem, 'id' | 'created_at' | 'updated_at'> = {
      name: newGift.name,
      credits: newGift.credits,
      image_url: newGift.image,
      video_url: newGift.video,
      description: newGift.description,
      is_favorite: false,
      is_completed: false,
      priority: 'medium',
      display_mode: newGift.displayMode,
      show_thumbnail: newGift.showThumbnail,
      show_custom_button: newGift.showCustomButton,
      button_text: newGift.buttonText
    };

    await addWishlistItem(giftItem);
    
    // Reset form
    setNewGift({
      name: '',
      credits: 0,
      image: '',
      video: '',
      description: '',
      displayMode: 'card' as 'card' | 'icon',
      showThumbnail: true,
      showCustomButton: false,
      buttonText: ''
    });
    setShowCreateForm(false);
    toast.success("Presente criado!");
  };

  const handleSelectGift = (gift: WishlistItem) => {
    onSelectGift(gift);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/30 backdrop-blur-xl border border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-primary" />
            🎁 Selecionar Presente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreateForm && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Presente
            </Button>
          )}

          {showCreateForm && (
            <Card className="border-2 border-dashed border-primary/40 bg-gradient-to-br from-card via-secondary/20 to-accent/10">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Criar Presente</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <input 
                      id="gift-image" 
                      type="file" 
                      accept="image/*,video/*,audio/*" 
                      onChange={handleMediaUpload} 
                      className="hidden" 
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('gift-image')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Mídia
                    </Button>
                    {(newGift.image || newGift.video) && (
                      <div className="w-16 h-16 border-2 border-border/30 rounded-lg overflow-hidden">
                        {newGift.image ? (
                          <img 
                            src={newGift.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <video 
                            src={newGift.video} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gift-name">Nome do Presente</Label>
                    <Input 
                      id="gift-name"
                      value={newGift.name}
                      onChange={(e) => setNewGift(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Foto Exclusiva"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gift-credits">Créditos</Label>
                    <Input 
                      id="gift-credits"
                      type="number"
                      min="1"
                      value={newGift.credits || ''}
                      onChange={(e) => setNewGift(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
                      placeholder="Ex: 50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gift-description">Descrição (opcional)</Label>
                    <Input 
                      id="gift-description"
                      value={newGift.description}
                      onChange={(e) => setNewGift(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do presente..."
                    />
                  </div>

                  {/* Display Options */}
                  <div className="space-y-3 p-3 border rounded-lg bg-secondary/20">
                    <Label className="text-sm font-semibold">Opções de Exibição</Label>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="display-mode" className="text-sm">Modo de Exibição</Label>
                      <select 
                        id="display-mode"
                        value={newGift.displayMode}
                        onChange={(e) => setNewGift(prev => ({ ...prev, displayMode: e.target.value as 'card' | 'icon' }))}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="card">Card Completo</option>
                        <option value="icon">Apenas Ícone</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-thumbnail" className="text-sm">Mostrar Thumbnail (com blur)</Label>
                      <input 
                        id="show-thumbnail"
                        type="checkbox"
                        checked={newGift.showThumbnail}
                        onChange={(e) => setNewGift(prev => ({ ...prev, showThumbnail: e.target.checked }))}
                        className="rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-button" className="text-sm">Botão Personalizado</Label>
                      <input 
                        id="show-button"
                        type="checkbox"
                        checked={newGift.showCustomButton}
                        onChange={(e) => setNewGift(prev => ({ ...prev, showCustomButton: e.target.checked }))}
                        className="rounded"
                      />
                    </div>

                    {newGift.showCustomButton && (
                      <div>
                        <Label htmlFor="button-text" className="text-sm">Texto do Botão</Label>
                        <Input 
                          id="button-text"
                          value={newGift.buttonText}
                          onChange={(e) => setNewGift(prev => ({ ...prev, buttonText: e.target.value }))}
                          placeholder="Ex: Desbloquear Agora"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleCreateGift}
                    className="w-full bg-gradient-to-r from-primary to-accent"
                  >
                    Criar e Selecionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {wishlistItems.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Seus Presentes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {wishlistItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card via-card/90 to-secondary/20"
                    onClick={() => handleSelectGift(item)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <div className="w-12 h-12 border-2 border-border/30 rounded-lg overflow-hidden">
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {item.video_url && (
                          <div className="w-12 h-12 border-2 border-border/30 rounded-lg overflow-hidden">
                            <video 
                              src={item.video_url} 
                              className="w-full h-full object-cover"
                              muted
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gradient-to-r from-primary/20 to-accent/20 rounded-full px-2 py-1 text-primary font-semibold">
                              💰 {item.credits} créditos
                            </span>
                            {item.is_favorite && (
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum presente criado ainda</p>
              <p className="text-sm">Crie seu primeiro presente!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}