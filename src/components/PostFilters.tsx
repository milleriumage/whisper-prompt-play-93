import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface PostFiltersProps {
  filters: {
    postType: string;
    creatorId: string;
    myPosts: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export const PostFilters: React.FC<PostFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
}) => {
  const { user } = useGoogleAuth();

  // Get followed creators
  const { data: followedCreators = [] } = useQuery({
    queryKey: ['followed-creators', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('followers')
        .select('creator_id')
        .eq('follower_id', user.id);

      if (error) throw error;
      
      if (!data || data.length === 0) return [];

      // Get profiles for the creators
      const creatorIds = data.map(f => f.creator_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', creatorIds);

      if (profilesError) throw profilesError;

      return profiles?.map(profile => ({
        creator_id: profile.user_id,
        profiles: profile
      })) || [];
    },
    enabled: !!user,
  });

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      postType: 'all',
      creatorId: '',
      myPosts: false,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Post Type Filter */}
        <div className="space-y-2">
          <Label>Tipo de Post</Label>
          <Select value={filters.postType} onValueChange={(value) => updateFilter('postType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="vitrine">Vitrine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Creator Filter */}
        {followedCreators.length > 0 && (
          <div className="space-y-2">
            <Label>Criador</Label>
            <Select value={filters.creatorId} onValueChange={(value) => updateFilter('creatorId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os criadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os criadores</SelectItem>
                {followedCreators.map((creator) => (
                  <SelectItem key={creator.creator_id} value={creator.creator_id}>
                    {creator.profiles?.display_name || 'Usuário'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* My Posts Filter */}
        {user && (
          <div className="flex items-center justify-between">
            <Label htmlFor="my-posts">Apenas Meus Posts</Label>
            <Switch
              id="my-posts"
              checked={filters.myPosts}
              onCheckedChange={(checked) => updateFilter('myPosts', checked)}
            />
          </div>
        )}

        {/* Clear Filters */}
        <div className="pt-2">
          <Button variant="outline" onClick={clearFilters} className="w-full">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};