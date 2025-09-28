import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  Bell, 
  Bookmark, 
  User,
  ChevronRight,
  Lock,
  Timer,
  Moon,
  Sun,
  Store,
  Heart,
  CreditCard,
  Users,
  LayoutDashboard,
  Settings,
  Languages,
  Eye,
  Database,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { SettingsDialog } from '@/components/SettingsDialog';
import { VisibilitySettingsDialog } from '@/components/VisibilitySettingsDialog';
import { WishlistDialog } from '@/components/WishlistDialog';
import { ReferralDialog } from '@/components/ReferralDialog';
import { ProfileDialog } from '@/components/ProfileDialog';
import { PaymentMethodsDialog } from '@/components/PaymentMethodsDialog';
import { SalesHistoryModal } from '@/components/SalesHistoryModal';
import { PasswordDialog } from '@/components/PasswordDialog';
import { MediaTimerDialog } from '@/components/MediaTimerDialog';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  path?: string;
  action?: () => void;
  isDarkMode?: boolean;
  isToggle?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AppSidebarFloatingProps {
  isOpen: boolean;
  onClose: () => void;
  onExpandHeader: () => void;
}

export const AppSidebarFloating: React.FC<AppSidebarFloatingProps> = ({
  isOpen,
  onClose,
  onExpandHeader
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Estado para controlar os dialogs
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const { language, setLanguage } = useLanguage();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Fechar sidebar após navegação
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const openDialog = (dialogId: string) => {
    setActiveDialog(dialogId);
    onExpandHeader(); // Expandir header ao abrir dialog
  };

  const closeDialog = () => {
    setActiveDialog(null);
  };

  // Definindo as seções da navegação
  const navSections: NavSection[] = [
    {
      title: "Navigation",
      items: [
        {
          id: 'home',
          icon: Home,
          label: 'Home',
          path: '/'
        },
        {
          id: 'dashboard',
          icon: LayoutDashboard,
          label: 'Painel do Usuário',
          path: '/dashboard'
        },
        {
          id: 'topics',
          icon: FileText,
          label: 'Topics',
          path: '/mylay'
        },
        {
          id: 'messages',
          icon: MessageSquare,
          label: 'Messages',
          path: '/dashboard'
        }
      ]
    },
    {
      title: "Activity",
      items: [
        {
          id: 'notifications',
          icon: Bell,
          label: 'Notifications',
          action: () => {
            toast.info('Notifications feature available in the main app');
            onExpandHeader();
          }
        },
        {
          id: 'timer',
          icon: Timer,
          label: 'Cronômetro',
          action: () => openDialog('timer')
        },
        {
          id: 'lock',
          icon: Lock,
          label: 'Cadeado',
          action: () => openDialog('password')
        }
      ]
    },
    {
      title: "Commerce",
      items: [
        {
          id: 'sales',
          icon: Store,
          label: 'Central de Vendas',
          action: () => openDialog('sales')
        },
        {
          id: 'payment',
          icon: CreditCard,
          label: 'Pagamento',
          action: () => openDialog('payment')
        },
        {
          id: 'wishlist',
          icon: Heart,
          label: 'Wishlist',
          action: () => openDialog('wishlist')
        }
      ]
    },
    {
      title: "Profile",
      items: [
        {
          id: 'profile',
          icon: User,
          label: 'Profile',
          action: () => openDialog('profile')
        },
        {
          id: 'referral',
          icon: Users,
          label: 'Referral Page',
          action: () => openDialog('referral')
        },
        {
          id: 'bookmarks',
          icon: Bookmark,
          label: 'Bookmarks',
          path: '/mylistpage'
        }
      ]
    },
    {
      title: "Settings",
      items: [
        {
          id: 'darkmode',
          icon: theme === 'dark' ? Sun : Moon,
          label: 'Dark Mode',
          action: () => {
            toggleTheme();
            onExpandHeader();
          },
          isDarkMode: true
        },
        {
          id: 'settings',
          icon: Settings,
          label: 'Configurações',
          action: () => openDialog('settings')
        },
        {
          id: 'language',
          icon: Languages,
          label: 'Select Language',
          action: () => {
            const newLang = language === 'pt' ? 'en' : 'pt';
            setLanguage(newLang);
            toast.success(`Language changed to ${newLang === 'pt' ? 'Portuguese' : 'English'}`);
            onExpandHeader();
          }
        },
        {
          id: 'visibility',
          icon: Eye,
          label: 'Visibility Settings',
          action: () => openDialog('visibility')
        },
        {
          id: 'storage',
          icon: Database,
          label: 'External Storage',
          action: () => {
            toast.info('External storage configuration available in Settings');
            onExpandHeader();
          }
        }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full w-80 z-50",
          "bg-background border-r border-border/50 shadow-xl",
          "transform transition-transform duration-300 ease-out",
          "animate-slide-in-left"
        )}
        onMouseEnter={onExpandHeader}
      >
        {/* Header com botão de fechar */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/assets/user-avatar.png" />
              <AvatarFallback>SR</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">Sophia Rose</p>
              <p className="text-xs text-muted-foreground">UX/UI Designer</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Conteúdo da sidebar */}
        <div className="flex-1 overflow-y-auto p-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.path ? isActive(item.path) : false;
                  const onClick = item.path ? () => handleNavigation(item.path) : item.action;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={onClick}
                      className={cn(
                        "w-full h-11 rounded-lg transition-all duration-200",
                        "hover:bg-accent/50 active:scale-95",
                        "flex items-center px-3 space-x-3",
                        active && "bg-primary/10 text-primary border border-primary/20",
                        item.isDarkMode && "hover:bg-primary/10"
                      )}
                    >
                      <Icon 
                        size={18} 
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          active ? "text-primary" : "text-muted-foreground",
                          item.isDarkMode && "text-primary"
                        )}
                      />
                      <span 
                        className={cn(
                          "font-medium text-sm transition-colors text-left",
                          active ? "text-primary" : "text-foreground"
                        )}
                      >
                        {item.label}
                      </span>
                      {active && (
                        <ChevronRight size={14} className="text-primary ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dialogs - Mantendo todos os existentes */}
      {activeDialog === 'settings' && (
        <SettingsDialog 
          onImageUpload={(file) => toast.success('Image uploaded!')}
          onVideoUpload={(file) => toast.success('Video uploaded!')}
          onSaveState={() => toast.success('State saved!')}
          onLoadState={() => toast.success('State loaded!')}
        />
      )}
      {activeDialog === 'visibility' && (
        <VisibilitySettingsDialog 
          open={true}
          onOpenChange={closeDialog}
        />
      )}
      {activeDialog === 'wishlist' && (
        <WishlistDialog 
          open={true}
          onOpenChange={closeDialog}
        />
      )}
      {activeDialog === 'referral' && (
        <ReferralDialog />
      )}
      {activeDialog === 'profile' && (
        <ProfileDialog 
          masterPassword=""
          passwordSet={false}
          onPasswordSet={() => {}}
          onPasswordRemove={() => {}}
        />
      )}
      {activeDialog === 'payment' && (
        <PaymentMethodsDialog 
          isOpen={true}
          onClose={closeDialog}
        />
      )}
      {activeDialog === 'sales' && (
        <SalesHistoryModal 
          open={true}
          onOpenChange={closeDialog}
        />
      )}
      {activeDialog === 'password' && (
        <PasswordDialog 
          isOpen={true}
          onClose={closeDialog}
          mode="set"
        />
      )}
      {activeDialog === 'timer' && (
        <MediaTimerDialog 
          isOpen={true}
          onClose={closeDialog}
          onSetTimer={() => {}}
          onResetTimer={() => {}}
          mediaId="sidebar-timer"
        />
      )}
    </>
  );
};