import React, { useState, useCallback, useRef } from 'react';
import { Monitor, Maximize2, Minimize2, MoveVertical, RotateCcw, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

export type HeightOption = {
  id: string;
  name: string;
  height: string;
  icon: React.ComponentType<any>;
  description: string;
};

interface ControladorDeAlturaTelaPrincipalProps {
  onHeightChange: (height: string) => void;
  className?: string;
  position?: 'fixed' | 'relative';
}

export const ControladorDeAlturaTelaPrincipal: React.FC<ControladorDeAlturaTelaPrincipalProps> = ({
  onHeightChange,
  className,
  position = 'fixed'
}) => {
  const isMobile = useIsMobile();
  const { throttle } = usePerformanceOptimization();
  const [currentOptionIndex, setCurrentOptionIndex] = useState(9); // Start with "Atual" (index 9)
  const lastClickTime = useRef(0);
  const isProcessing = useRef(false);
  
  const heightOptions: HeightOption[] = [
    {
      id: 'full',
      name: 'Tela Cheia',
      height: '100vh',
      icon: Maximize2,
      description: 'Tela principal ocupa todo o espaço visível'
    },
    {
      id: 'extra-large',
      name: 'Extra Grande', 
      height: '90vh',
      icon: ChevronsUp,
      description: 'Tela principal ocupa 9/10 da altura da tela'
    },
    {
      id: 'large',
      name: 'Grande',
      height: '80vh',
      icon: ArrowUp,
      description: 'Tela principal ocupa 4/5 da altura da tela'
    },
    {
      id: 'medium-large',
      name: 'Médio Grande',
      height: '70vh',
      icon: MoveVertical,
      description: 'Tela principal ocupa 7/10 da altura da tela'
    },
    {
      id: 'above-half',
      name: 'Acima da Metade',
      height: '60vh',
      icon: Monitor,
      description: 'Tela principal ocupa 3/5 da altura da tela'
    },
    {
      id: 'half',
      name: 'Metade',
      height: '50vh',
      icon: Minus,
      description: 'Tela principal ocupa metade da altura da tela'
    },
    {
      id: 'small-half',
      name: 'Abaixo da Metade',
      height: '40vh',
      icon: ArrowDown,
      description: 'Tela principal ocupa 2/5 da altura da tela'
    },
    {
      id: 'small',
      name: 'Pequeno',
      height: '30vh',
      icon: ChevronsDown,
      description: 'Tela principal ocupa 3/10 da altura da tela'
    },
    {
      id: 'minimal',
      name: 'Mínimo',
      height: '20vh',
      icon: Minimize2,
      description: 'Tela principal ocupa 1/5 da altura da tela'
    },
    {
      id: 'current',
      name: 'Atual',
      height: 'auto',
      icon: RotateCcw,
      description: 'Retorna ao estado original da interface'
    }
  ];

  const currentOption = heightOptions[currentOptionIndex];

  // Optimized height change with smooth throttling
  const optimizedHeightChange = useCallback(
    throttle((height: string) => {
      console.log(`🎛️ Height Controller: Applying height change to ${height} (${heightOptions.find(opt => opt.height === height)?.name})`);
      onHeightChange(height);
      isProcessing.current = false;
    }, 150),
    [onHeightChange, throttle]
  );

  const handleCycleHeight = useCallback(() => {
    const now = Date.now();
    
    // Prevent rapid clicks
    if (now - lastClickTime.current < 200 || isProcessing.current) return;
    
    lastClickTime.current = now;
    isProcessing.current = true;
    
    const nextIndex = (currentOptionIndex + 1) % heightOptions.length;
    const nextOption = heightOptions[nextIndex];
    
    console.log(`🎛️ Height Controller: Changing from ${currentOption.name} to ${nextOption.name} (${nextOption.height})`);
    
    setCurrentOptionIndex(nextIndex);
    optimizedHeightChange(nextOption.height);
  }, [currentOptionIndex, heightOptions, currentOption.name, optimizedHeightChange]);

  const IconComponent = currentOption.icon;

  const isCurrentlyProcessing = isProcessing.current;
  const baseClasses = `h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg bg-gradient-to-br from-primary/90 to-primary/70 hover:from-primary hover:to-primary/80 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 ${isCurrentlyProcessing ? 'opacity-70' : 'opacity-100'}`;

  if (position === 'relative') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCycleHeight}
              size="sm"
              disabled={false}
              className={cn(baseClasses, "animate-fade-in", className)}
            >
              <IconComponent size={16} className="text-primary-foreground md:w-5 md:h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8} className="max-w-48">
            <div className="space-y-1">
              <p className="font-medium">{currentOption.name}</p>
              <p className="text-xs text-muted-foreground">{currentOption.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCycleHeight}
            size="lg"
            disabled={false}
            className={cn(
              "fixed bottom-20 right-4 z-50",
              baseClasses,
              "animate-fade-in",
              className
            )}
          >
            <IconComponent size={20} className="text-primary-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8} className="max-w-48">
          <div className="space-y-1">
            <p className="font-medium">{currentOption.name}</p>
            <p className="text-xs text-muted-foreground">{currentOption.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};