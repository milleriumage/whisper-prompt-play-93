import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Eye, EyeOff, Lock, Coins } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PostCreationDialog: React.FC<PostCreationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useGoogleAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    content: '',
    mediaFile: null as File | null,
    mediaPreview: null as string | null,
    price: 0,
    isLocked: false,
    isBlurred: false,
    postType: 'feed' as 'feed' | 'vitrine',
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');

      let mediaUrl = null;
      let mediaType = null;

      // Upload media if exists
      if (data.mediaFile) {
        const fileExt = data.mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, data.mediaFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(uploadData.path);

        mediaUrl = urlData.publicUrl;
        mediaType = data.mediaFile.type.startsWith('image/') ? 'image' : 
                   data.mediaFile.type.startsWith('video/') ? 'video' : 'file';
      }

      // Create post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: data.content || null,
          media_url: mediaUrl,
          media_type: mediaType,
          post_type: data.postType,
          price: data.price,
          is_locked: data.isLocked,
          is_blurred: data.isBlurred,
        })
        .select()
        .single();

      if (postError) throw postError;
      return postData;
    },
    onSuccess: () => {
      toast.success('Post criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast.error('Erro ao criar post');
    },
  });

  const resetForm = () => {
    setFormData({
      content: '',
      mediaFile: null,
      mediaPreview: null,
      price: 0,
      isLocked: false,
      isBlurred: false,
      postType: 'feed',
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        mediaFile: file,
        mediaPreview: previewUrl,
      }));
    }
  };

  const removeMedia = () => {
    if (formData.mediaPreview) {
      URL.revokeObjectURL(formData.mediaPreview);
    }
    setFormData(prev => ({
      ...prev,
      mediaFile: null,
      mediaPreview: null,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content && !formData.mediaFile) {
      toast.error('Adicione texto ou mídia ao post');
      return;
    }

    createPostMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.postType === 'feed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, postType: 'feed' }))}
            >
              Feed
            </Button>
            <Button
              type="button"
              variant={formData.postType === 'vitrine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, postType: 'vitrine' }))}
            >
              Vitrine
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Texto do Post</Label>
            <Textarea
              id="content"
              placeholder="O que você está pensando?"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Mídia (opcional)</Label>
            {!formData.mediaFile ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para adicionar imagem ou vídeo
                  </span>
                </label>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={removeMedia}
                    >
                      <X size={16} />
                    </Button>
                    {formData.mediaFile.type.startsWith('image/') ? (
                      <img
                        src={formData.mediaPreview!}
                        alt="Preview"
                        className="w-full rounded-lg max-h-64 object-cover"
                      />
                    ) : (
                      <video
                        src={formData.mediaPreview!}
                        controls
                        className="w-full rounded-lg max-h-64"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Monetization Options */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Coins size={16} />
                Opções de Monetização
              </h4>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Preço em Créditos</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>

              {/* Lock Content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={16} />
                  <Label htmlFor="locked">Conteúdo Bloqueado</Label>
                </div>
                <Switch
                  id="locked"
                  checked={formData.isLocked}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isLocked: checked }))
                  }
                />
              </div>

              {/* Blur Content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff size={16} />
                  <Label htmlFor="blurred">Efeito Blur</Label>
                </div>
                <Switch
                  id="blurred"
                  checked={formData.isBlurred}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isBlurred: checked }))
                  }
                />
              </div>

              {(formData.isLocked || formData.isBlurred) && formData.price > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Coins size={12} />
                  Custa {formData.price} créditos para desbloquear
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPostMutation.isPending}
              className="flex-1"
            >
              {createPostMutation.isPending ? 'Criando...' : 'Criar Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};