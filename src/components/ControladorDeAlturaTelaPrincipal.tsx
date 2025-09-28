import React, { useState, useEffect } from 'react';
import { Monitor, Maximize2, Minimize2, MoveVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const [currentOptionIndex, setCurrentOptionIndex] = useState(4); // Start with "Atual" (index 4)
  
  const heightOptions: HeightOption[] = [
    {
      id: 'full',
      name: 'Tela Cheia',
      height: '100vh',
      icon: Maximize2,
      description: 'Tela principal ocupa todo o espaço visível'
    },
    {
      id: 'large',
      name: 'Grande',
      height: '80vh',
      icon: MoveVertical,
      description: 'Tela principal ocupa 4/5 da altura da tela'
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
      height: '40vh',
      icon: Minimize2,
      description: 'Tela principal ocupa 2/5 da altura da tela'
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

  // Apply height change when option changes
  useEffect(() => {
    console.log(`🎛️ Height Controller: Applying height change to ${currentOption.height} (${currentOption.name})`);
    onHeightChange(currentOption.height);
  }, [currentOption.height, onHeightChange]);

  const handleCycleHeight = () => {
    const nextIndex = (currentOptionIndex + 1) % heightOptions.length;
    console.log(`🎛️ Height Controller: Changing from ${currentOption.name} to ${heightOptions[nextIndex].name} (${heightOptions[nextIndex].height})`);
    setCurrentOptionIndex(nextIndex);
  };

  const IconComponent = currentOption.icon;

  const baseClasses = "h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg bg-gradient-to-br from-primary/90 to-primary/70 hover:from-primary hover:to-primary/80 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110 active:scale-95";

  if (position === 'relative') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCycleHeight}
              size="sm"
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