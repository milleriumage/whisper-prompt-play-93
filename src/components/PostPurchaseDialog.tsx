import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Lock, Eye } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: any;
  onPurchaseSuccess: () => void;
}

export const PostPurchaseDialog: React.FC<PostPurchaseDialogProps> = ({
  open,
  onOpenChange,
  post,
  onPurchaseSuccess,
}) => {
  const { user } = useGoogleAuth();
  const queryClient = useQueryClient();

  // Get user credits
  const { data: userCredits = 0 } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data?.credits || 0;
    },
    enabled: !!user,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (userCredits < post.price) {
        throw new Error('Créditos insuficientes');
      }

      // Deduct credits from buyer
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: userCredits - post.price })
        .eq('user_id', user.id);

      if (creditError) throw creditError;

      // Add credits to creator (70% share)
      const creatorCredits = Math.floor(post.price * 0.7);
      const { error: creatorError } = await supabase.rpc('add_credits', {
        p_user_id: post.user_id,
        p_amount: creatorCredits
      });

      if (creatorError) throw creatorError;

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('post_purchases')
        .insert({
          post_id: post.id,
          buyer_id: user.id,
          creator_id: post.user_id,
          credits_spent: post.price,
        });

      if (purchaseError) throw purchaseError;

      // Create notifications
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          type: 'credit_deduction',
          title: '💳 Créditos Gastos',
          message: `Você gastou ${post.price} créditos para desbloquear um post`,
          credits_amount: post.price,
        },
        {
          user_id: post.user_id,
          type: 'credit_addition',
          title: '💰 Venda Realizada!',
          message: `Seu post foi comprado! Você ganhou ${creatorCredits} créditos`,
          credits_amount: creatorCredits,
        }
      ]);
    },
    onSuccess: () => {
      toast.success('Post desbloqueado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      onPurchaseSuccess();
    },
    onError: (error: any) => {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Erro ao comprar post');
    },
  });

  const handlePurchase = () => {
    purchaseMutation.mutate();
  };

  if (!user) return null;

  const canAfford = userCredits >= post.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={20} />
            Desbloquear Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  {(post.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-sm">
                    {post.profiles?.display_name || 'Usuário'}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {post.post_type === 'feed' ? 'Feed' : 'Vitrine'}
                  </Badge>
                </div>
              </div>

              {post.content && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {post.content}
                </p>
              )}

              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {post.media_type === 'image' ? 'Imagem' : 
                     post.media_type === 'video' ? 'Vídeo' : 'Mídia'} bloqueada
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Preço</span>
              <Badge variant="default" className="gap-1">
                <Coins size={12} />
                {post.price} créditos
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Seus créditos</span>
              <Badge variant={canAfford ? "default" : "destructive"} className="gap-1">
                <Coins size={12} />
                {userCredits} créditos
              </Badge>
            </div>

            {!canAfford && (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  Créditos insuficientes!
                </p>
                <p className="text-xs text-destructive/80">
                  Você precisa de mais {post.price - userCredits} créditos
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!canAfford || purchaseMutation.isPending}
              className="flex-1"
            >
              {purchaseMutation.isPending ? 'Comprando...' : 'Comprar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};