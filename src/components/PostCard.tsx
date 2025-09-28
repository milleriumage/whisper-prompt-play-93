import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, Lock, Eye, Coins } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PostPurchaseDialog } from '@/components/PostPurchaseDialog';

interface PostCardProps {
  post: any;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useGoogleAuth();
  const queryClient = useQueryClient();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  // Check if user has purchased this post
  const { data: hasPurchased } = useQuery({
    queryKey: ['post-purchase', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('post_purchases')
        .select('id')
        .eq('post_id', post.id)
        .eq('buyer_id', user.id)
        .single();
      return !!data;
    },
    enabled: !!user && post.is_locked,
  });

  // Get likes count
  const { data: likesCount = 0 } = useQuery({
    queryKey: ['post-likes-count', post.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_post_likes_count', {
        post_uuid: post.id
      });
      if (error) console.error('Error fetching likes:', error);
      return data || 0;
    },
  });

  // Check if user liked the post
  const { data: hasLiked = false } = useQuery({
    queryKey: ['post-liked', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('check_user_liked_post', {
        post_uuid: post.id,
        user_uuid: user.id
      });
      if (error) console.error('Error checking like:', error);
      return data || false;
    },
    enabled: !!user,
  });

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      if (hasLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes-count', post.id] });
      queryClient.invalidateQueries({ queryKey: ['post-liked', post.id, user?.id] });
    },
    onError: (error) => {
      toast.error('Erro ao curtir post');
      console.error('Like error:', error);
    },
  });

  const isOwner = user?.id === post.user_id;
  const shouldShowBlurred = post.is_blurred && !isOwner && !hasPurchased;
  const shouldShowLocked = post.is_locked && !isOwner && !hasPurchased;

  const handleMediaClick = () => {
    if (shouldShowLocked) {
      setShowPurchaseDialog(true);
    }
  };

  const handleLike = () => {
    if (!user) {
      toast.error('Faça login para curtir posts');
      return;
    }
    likeMutation.mutate();
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={post.profiles?.avatar_url} 
                  alt={post.profiles?.display_name || 'User'} 
                />
                <AvatarFallback>
                  {(post.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm">
                  {post.profiles?.display_name || 'Usuário'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={post.post_type === 'feed' ? 'default' : 'secondary'}>
                {post.post_type === 'feed' ? 'Feed' : 'Vitrine'}
              </Badge>
              {post.price > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Coins size={12} />
                  {post.price}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Text Content */}
          {post.content && (
            <p className="text-sm leading-relaxed">{post.content}</p>
          )}

          {/* Media Content */}
          {post.media_url && (
            <div className="relative">
              {shouldShowLocked ? (
                <div 
                  className="aspect-video bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={handleMediaClick}
                >
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Conteúdo Bloqueado</p>
                    <p className="text-xs text-muted-foreground">
                      {post.price} créditos para desbloquear
                    </p>
                  </div>
                </div>
              ) : post.media_type === 'image' ? (
                <img
                  src={post.media_url}
                  alt="Post media"
                  className={`w-full rounded-lg ${shouldShowBlurred ? 'blur-md' : ''}`}
                  onClick={shouldShowBlurred ? handleMediaClick : undefined}
                  style={{ cursor: shouldShowBlurred ? 'pointer' : 'default' }}
                />
              ) : post.media_type === 'video' ? (
                <video
                  src={post.media_url}
                  controls={!shouldShowBlurred}
                  className={`w-full rounded-lg ${shouldShowBlurred ? 'blur-md' : ''}`}
                  onClick={shouldShowBlurred ? handleMediaClick : undefined}
                  style={{ cursor: shouldShowBlurred ? 'pointer' : 'default' }}
                />
              ) : null}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`gap-2 ${hasLiked ? 'text-red-500' : ''}`}
                disabled={likeMutation.isPending}
              >
                <Heart size={16} className={hasLiked ? 'fill-current' : ''} />
                {likesCount}
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle size={16} />
                0
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2">
                <Share size={16} />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <Eye size={12} />
                <span className="text-xs">0</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Dialog */}
      <PostPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        post={post}
        onPurchaseSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['post-purchase', post.id, user?.id] });
          setShowPurchaseDialog(false);
        }}
      />
    </>
  );
};