import React, { useState, useEffect } from 'react';
import { FloatingMenuButton } from './FloatingMenuButton';
import { AppHeader } from './AppHeader';
import { AppSidebarFloating } from './AppSidebarFloating';

export const FloatingMenuSystem: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showHeader, setShowHeader] = useState(false);

  // Função para expandir o header
  const handleExpandHeader = () => {
    setShowHeader(true);
  };

  // Função para fechar o menu
  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  // Função para ativar o menu (click ou hover)
  const handleActivateMenu = () => {
    setShowMenu(true);
  };

  // Fechar menu ao clicar fora (ESC key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Salvar showHeader no localStorage
  useEffect(() => {
    const savedHeaderState = localStorage.getItem('showHeader');
    if (savedHeaderState === 'true') {
      setShowHeader(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('showHeader', showHeader.toString());
  }, [showHeader]);

  return (
    <>
      {/* Botão fixo sempre visível */}
      <FloatingMenuButton
        onClick={handleActivateMenu}
        onMouseEnter={handleActivateMenu}
      />

      {/* Header - aparece após interação com sidebar */}
      {showHeader && (
        <AppHeader 
          title="DreamLink"
          logo="/src/assets/dreamlink-logo.png"
        />
      )}

      {/* Sidebar - aparece quando showMenu é true */}
      <AppSidebarFloating
        isOpen={showMenu}
        onClose={handleCloseMenu}
        onExpandHeader={handleExpandHeader}
      />
    </>
  );
};