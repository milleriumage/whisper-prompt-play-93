import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from '@/components/PostCard';
import { LoadingFallback } from '@/components/LoadingFallback';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface PostListProps {
  type: 'discover' | 'feed';
  filters: {
    postType: string;
    creatorId: string;
    myPosts: boolean;
  };
}

export const PostList: React.FC<PostListProps> = ({ type, filters }) => {
  const { user } = useGoogleAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', type, filters],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      // Apply type filter
      if (type === 'feed' && user) {
        // Get posts from followed users
        const { data: following } = await supabase
          .from('followers')
          .select('creator_id')
          .eq('follower_id', user.id);

        if (following && following.length > 0) {
          const followedIds = following.map(f => f.creator_id);
          query = query.in('user_id', followedIds);
        } else {
          // If not following anyone, return empty array
          return [];
        }
      }

      // Apply post type filter
      if (filters.postType !== 'all') {
        query = query.eq('post_type', filters.postType);
      }

      // Apply creator filter
      if (filters.creatorId) {
        query = query.eq('user_id', filters.creatorId);
      }

      // Apply my posts filter
      if (filters.myPosts && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: type === 'discover' || (type === 'feed' && !!user),
  });

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {type === 'feed' 
            ? 'Nenhum post dos seus seguidos ainda. Comece a seguir criadores!'
            : 'Nenhum post encontrado.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};