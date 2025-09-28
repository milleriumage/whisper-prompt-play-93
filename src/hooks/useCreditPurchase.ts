import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCredits } from './useUserCredits';
import { useGoogleAuth } from './useGoogleAuth';
import { toast } from 'sonner';
import { useSalesHistory } from './useSalesHistory';

interface CreditPurchaseData {
  mediaId: string;
  creatorId: string;
  creditPrice: number;
  mediaTitle?: string;
}

export const useCreditPurchase = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { subtractCredits } = useUserCredits();
  const { user } = useGoogleAuth();
  const { trackSale } = useSalesHistory();

  const processCreditPurchase = async ({
    mediaId,
    creatorId,
    creditPrice,
    mediaTitle = "conteúdo"
  }: CreditPurchaseData) => {
    setIsProcessing(true);
    
    try {
      console.log(`[CREDIT PURCHASE] Iniciando compra - Mídia: ${mediaTitle}, Preço: ${creditPrice}, Criador: ${creatorId}`);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar créditos do usuário DIRETAMENTE do banco de dados
      console.log(`[CREDIT PURCHASE] Verificando créditos do usuário ${user.id}...`);
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil do usuário:', profileError);
        throw new Error('Erro ao verificar créditos do usuário');
      }

      const userCredits = userProfile?.credits || 0;
      console.log(`[CREDIT PURCHASE] Créditos atuais do usuário: ${userCredits}, necessário: ${creditPrice}`);

      if (userCredits < creditPrice) {
        throw new Error(`Créditos insuficientes! Você tem ${userCredits} créditos, mas precisa de ${creditPrice}.`);
      }

      // Usar subtractCredits original para manter compatibilidade
      const purchaseSuccess = await subtractCredits(creditPrice, `Compra de ${mediaTitle}`);
      
      if (!purchaseSuccess) {
        throw new Error('Falha ao processar pagamento');
      }

      console.log(`[CREDIT PURCHASE] ✅ Créditos deduzidos com sucesso`);

      // Calcular comissão do criador (70%)
      const creatorCredits = Math.floor(creditPrice * 0.7);
      console.log(`[CREDIT PURCHASE] Creditando ${creatorCredits} créditos para o criador ${creatorId}`);
      
      // Creditar o criador se ele for um usuário autenticado
      if (creatorId && creatorId !== 'template-user') {
        try {
          const { error: updateError } = await supabase.rpc('add_credits', {
            p_user_id: creatorId,
            p_amount: creatorCredits
          });

          if (updateError) {
            console.error('Erro ao creditar criador:', updateError);
          } else {
            console.log(`[CREDIT PURCHASE] ✅ Criador creditado com sucesso`);
          }
        } catch (error) {
          console.error('Erro ao processar créditos do criador:', error);
        }
      }

      // Desbloquear mídia automaticamente
      console.log(`[CREDIT PURCHASE] Desbloqueando mídia ${mediaId}...`);
      try {
        const { error: unlockError } = await supabase
          .from('user_unlocks')
          .insert({
            user_id: user.id,
            media_id: mediaId,
            unlock_type: 'credit_purchase',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
            credits_spent: creditPrice
          });

        if (unlockError) {
          console.error('Erro ao registrar desbloqueio:', unlockError);
        } else {
          console.log(`[CREDIT PURCHASE] ✅ Mídia desbloqueada com sucesso`);
        }
      } catch (error) {
        console.error('Erro ao desbloquear mídia:', error);
      }

      // Track sale in sales history
      if (user && creatorId !== user.id) {
        await trackSale(user.id, mediaId, creditPrice, mediaTitle);
        console.log(`[CREDIT PURCHASE] ✅ Venda registrada no histórico`);
      }

      // Forçar atualização imediata do saldo de créditos
      window.dispatchEvent(new CustomEvent('credits-updated', { 
        detail: { newCredits: 'force-refresh' } 
      }));
      
      console.log(`[CREDIT PURCHASE] ✅ Compra finalizada com sucesso`);
      
      return {
        success: true,
        unlockedMediaId: mediaId,
        creditsSpent: creditPrice,
        creatorCredits
      };

    } catch (error) {
      console.error('Erro ao processar compra por créditos:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processCreditPurchase,
    isProcessing
  };
};