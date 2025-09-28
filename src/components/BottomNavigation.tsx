import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Grid3X3, Database, Share2, PlusSquare, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    icon: Home,
    label: 'Home',
    path: '/'
  },
  {
    id: 'chat',
    icon: MessageCircle,
    label: 'Chat',
    path: '/chat'
  },
  {
    id: 'dashboard',
    icon: Grid3X3,
    label: 'Dashboard',
    path: '/myproducts'
  },
  {
    id: 'media',
    icon: Database,
    label: 'Mídia',
    path: '/cinema'
  },
  {
    id: 'share',
    icon: Share2,
    label: 'Compartilhar',
    path: '/myshowcase'
  },
  {
    id: 'feed',
    icon: Newspaper,
    label: 'Feed',
    path: '/feed'
  },
  {
    id: 'newpost',
    icon: PlusSquare,
    label: 'New Post',
    path: '/newpost'
  }
];

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useSidebar();
  const { user } = useGoogleAuth();

  const handleNavigation = (path: string, itemId: string) => {
    // Para "Compartilhar", navegar para a rota com creatorId
    if (itemId === 'share') {
      const targetId = user?.id ?? 'default';
      navigate(`/myshowcase/${targetId}`);
      return;
    }
    // New Post vai para a página dedicada
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-md border-t border-border lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 w-full max-w-full mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path, item.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200",
                "hover:bg-accent/50 active:scale-95",
                "min-w-[50px] min-h-[50px] flex-1 max-w-[70px]",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "mb-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-colors leading-tight",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area for mobile devices */}
      <div className="h-safe-area-inset-bottom bg-background/95" />
    </div>
  );
};