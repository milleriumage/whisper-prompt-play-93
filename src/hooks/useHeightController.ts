import { useState, useCallback, useRef } from 'react';

export const useHeightController = (initialHeight = 'auto') => {
  const [mainScreenHeight, setMainScreenHeight] = useState(initialHeight);
  const [isChanging, setIsChanging] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHeightChange = useCallback((newHeight: string) => {
    if (isChanging) return; // Prevent multiple rapid changes

    setIsChanging(true);
    setMainScreenHeight(newHeight);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to reset changing state
    timeoutRef.current = setTimeout(() => {
      setIsChanging(false);
    }, 600); // Give enough time for the transition to complete

    console.log(`📐 Height Controller Hook: Height changed to ${newHeight}`);
  }, [isChanging]);

  const resetHeight = useCallback(() => {
    handleHeightChange('auto');
  }, [handleHeightChange]);

  return {
    mainScreenHeight,
    isChanging,
    handleHeightChange,
    resetHeight
  };
};