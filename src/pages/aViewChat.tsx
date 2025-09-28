import React, { useState, useEffect } from 'react';
import { EnhancedChat } from "@/components/EnhancedChat";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from '@/lib/utils';
import { useCreatorMessages } from "@/hooks/useCreatorMessages";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Users } from "lucide-react";

const AViewChat = () => {
  const { open } = useSidebar();
  const { user } = useGoogleAuth();
  const [passwordProtected] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Hook para mensagens da conversa ativa (usando o ID do usuário como "creator")
  const { messages, sendMessage } = useCreatorMessages(activeUserId);

  // Carregar chats recentes baseado em mensagens
  useEffect(() => {
    const loadRecentChats = async () => {
      if (!user) return;

      try {
        // Buscar mensagens recentes onde o usuário atual é participante
        const { data, error } = await supabase
          .from('messages')
          .select(`
            user_id,
            username,
            created_at
          `)
          .neq('user_id', user.id) // Excluir mensagens próprias
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          // Agrupar por user_id e pegar o mais recente de cada
          const uniqueChats = data.reduce((acc: any[], message) => {
            const existingChat = acc.find(chat => chat.user_id === message.user_id);
            if (!existingChat) {
              acc.push({
                user_id: message.user_id,
                username: message.username,
                last_message_at: message.created_at
              });
            }
            return acc;
          }, []);

          setRecentChats(uniqueChats.slice(0, 10)); // Limitar a 10 chats recentes
          
          // Se não há chat ativo e existem chats, selecione o primeiro
          if (!activeUserId && uniqueChats.length > 0) {
            setActiveUserId(uniqueChats[0].user_id);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar chats recentes:', error);
      }
    };

    loadRecentChats();
  }, [user]);

  // Monitorar usuários online
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online_users_chat')
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat() as any[];
        setOnlineUsers(users.filter(u => u.user_id !== user.id));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Usuário entrou:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Usuário saiu:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            display_name: user.user_metadata?.display_name || user.email,
            avatar_url: user.user_metadata?.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendMessage = async (username: string, message: string, color: string, speech?: string, whisperTargetId?: string) => {
    if (!activeUserId) {
      toast.error("Selecione um usuário para conversar");
      return;
    }
    
    sendMessage(username, message, color, speech, whisperTargetId);
  };

  const handleEditMessage = (message: any) => {
    toast.info("Edição de mensagens em desenvolvimento");
  };

  const handlePasswordVerify = (callback: () => void) => {
    callback();
  };

  // Iniciar conversa com usuário online
  const startChatWithUser = (targetUser: any) => {
    setActiveUserId(targetUser.user_id);
    
    // Adicionar aos chats recentes se não existir
    setRecentChats(prev => {
      const exists = prev.find(chat => chat.user_id === targetUser.user_id);
      if (!exists) {
        return [{
          user_id: targetUser.user_id,
          username: targetUser.display_name,
          last_message_at: new Date().toISOString()
        }, ...prev];
      }
      return prev;
    });
  };

  const getDisplayName = (chat: any) => {
    return chat.username || 'Usuário';
  };

  const getAvatarUrl = (userId: string) => {
    const onlineUser = onlineUsers.find(u => u.user_id === userId);
    return onlineUser?.avatar_url || null;
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-secondary to-background transition-all duration-300",
      open ? "ml-0" : "ml-0"
    )}>
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            💬 Chat Privado
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conversas individuais entre usuários
          </p>
        </div>
      </div>

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-160px)]">
        
        {/* Lista de Chats Recentes - Lado Esquerdo */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {recentChats.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma conversa ainda</p>
                    <p className="text-xs">Clique em um usuário online para iniciar</p>
                  </div>
                ) : (
                  recentChats.map((chat) => (
                    <div
                      key={chat.user_id}
                      className={cn(
                        "p-3 border-b cursor-pointer hover:bg-accent transition-colors",
                        activeUserId === chat.user_id && "bg-accent"
                      )}
                      onClick={() => setActiveUserId(chat.user_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getAvatarUrl(chat.user_id)} />
                          <AvatarFallback>
                            {getDisplayName(chat).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {getDisplayName(chat)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.last_message_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area - Centro */}
        <div className="lg:col-span-2">
          <div className="h-full">
            {activeUserId ? (
              <div className="h-full">
                {/* Header do Chat Ativo */}
                <Card className="mb-4">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={getAvatarUrl(activeUserId)} />
                        <AvatarFallback>
                          {recentChats.find(c => c.user_id === activeUserId)?.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {recentChats.find(c => c.user_id === activeUserId)?.username || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {onlineUsers.find(u => u.user_id === activeUserId) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chat Component */}
                <div className="h-[calc(100%-80px)]">
                  <EnhancedChat 
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onEditMessage={handleEditMessage}
                    passwordProtected={passwordProtected}
                    onPasswordVerify={handlePasswordVerify}
                  />
                </div>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                  <p className="text-sm">Escolha uma conversa recente ou inicie uma nova com um usuário online</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Usuários Online - Lado Direito */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Online
                <Badge variant="secondary" className="ml-auto">
                  {onlineUsers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {onlineUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum usuário online</p>
                  </div>
                ) : (
                  onlineUsers.map((onlineUser, index) => (
                    <div
                      key={`${onlineUser.user_id}-${index}`}
                      className="p-3 border-b hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => startChatWithUser(onlineUser)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={onlineUser.avatar_url} />
                            <AvatarFallback>
                              {onlineUser.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {onlineUser.display_name || 'Usuário'}
                          </p>
                          <p className="text-xs text-green-600">Online</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default AViewChat;