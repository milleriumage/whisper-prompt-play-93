import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { PostList } from '@/components/PostList';
import { PostCreationDialog } from '@/components/PostCreationDialog';
import { PostFilters } from '@/components/PostFilters';

export const Feed: React.FC = () => {
  const { user } = useGoogleAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    postType: 'all', // 'all', 'feed', 'vitrine'
    creatorId: '',
    myPosts: false
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Feed</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
            </Button>
            {user && (
              <Button
                onClick={() => setShowCreatePost(true)}
                size="sm"
              >
                <Plus size={16} className="mr-2" />
                Novo Post
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4">
            <PostFilters 
              filters={filters} 
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="feed">Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6">
            <PostList 
              type="discover" 
              filters={filters}
            />
          </TabsContent>

          <TabsContent value="feed" className="mt-6">
            <PostList 
              type="feed" 
              filters={filters}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Post Dialog */}
      {user && (
        <PostCreationDialog
          open={showCreatePost}
          onOpenChange={setShowCreatePost}
        />
      )}
    </div>
  );
};