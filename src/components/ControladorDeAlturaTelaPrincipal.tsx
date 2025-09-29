import React, { useState, useCallback, useRef } from 'react';
import { Monitor, Maximize2, Minimize2, MoveVertical, RotateCcw, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { toast } from "sonner";

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
  const [isOpen, setIsOpen] = useState(false);
  const lastClickTime = useRef(0);
  const isProcessing = useRef(false);

  // Function to calculate responsive height based on viewport constraints
  const calculateResponsiveHeight = useCallback((percentage: number) => {
    try {
      // Find reference elements
      const followersElement = document.querySelector('[class*="followers"]') || 
                              document.querySelector('[class*="seguidores"]') ||
                              document.querySelector('button[class*="bg-secondary"]');
      
      const premiumElement = document.querySelector('[class*="premium"]') || 
                            document.querySelector('button[class*="BE PREMIUM"]') ||
                            document.querySelector('button[class*="bg-accent"]');

      if (followersElement && premiumElement) {
        const followersRect = followersElement.getBoundingClientRect();
        const premiumRect = premiumElement.getBoundingClientRect();
        
        // Calculate available space between elements
        const topOffset = Math.max(followersRect.bottom + 16, 120); // 16px margin + min 120px from top
        const bottomOffset = Math.max(window.innerHeight - premiumRect.top + 16, 80); // 16px margin + min 80px from bottom
        const availableHeight = window.innerHeight - topOffset - bottomOffset;
        
        // Apply percentage to available space
        const calculatedHeight = Math.max(availableHeight * (percentage / 100), 200); // Min 200px
        
        console.log(`📐 Responsive Height: ${percentage}% = ${calculatedHeight}px (available: ${availableHeight}px)`);
        return `${calculatedHeight}px`;
      }
      
      // Fallback to viewport percentage if elements not found
      return `${percentage}vh`;
    } catch (error) {
      console.warn('Error calculating responsive height:', error);
      return `${percentage}vh`;
    }
  }, []);
  
  const heightOptions: HeightOption[] = [
    {
      id: 'full',
      name: 'Tela Cheia',
      height: 'calc(100vh - 32px)', // Full height with small margin
      icon: Maximize2,
      description: 'Tela principal ocupa todo o espaço disponível'
    },
    {
      id: 'extra-large',
      name: 'Extra Grande', 
      height: 'responsive-95',
      icon: ChevronsUp,
      description: 'Tela principal ocupa quase todo espaço disponível'
    },
    {
      id: 'large',
      name: 'Grande',
      height: 'responsive-87',
      icon: ArrowUp,
      description: 'Tela principal ocupa maior parte do espaço disponível'
    },
    {
      id: 'medium-large',
      name: 'Médio Grande',
      height: 'responsive-78',
      icon: MoveVertical,
      description: 'Tela principal ocupa 3/4 do espaço disponível'
    },
    {
      id: 'above-half',
      name: 'Acima da Metade',
      height: 'responsive-65',
      icon: Monitor,
      description: 'Tela principal ocupa mais da metade do espaço'
    },
    {
      id: 'half',
      name: 'Metade',
      height: 'responsive-50',
      icon: Minus,
      description: 'Tela principal ocupa metade do espaço disponível'
    },
    {
      id: 'small-half',
      name: 'Abaixo da Metade',
      height: 'responsive-40',
      icon: ArrowDown,
      description: 'Tela principal ocupa menos da metade do espaço'
    },
    {
      id: 'small',
      name: 'Pequeno',
      height: 'responsive-30',
      icon: ChevronsDown,
      description: 'Tela principal ocupa 1/3 do espaço disponível'
    },
    {
      id: 'minimal',
      name: 'Mínimo',
      height: 'responsive-20',
      icon: Minimize2,
      description: 'Tela principal ocupa espaço mínimo'
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

  // Optimized height change with smooth throttling and responsive calculation
  const optimizedHeightChange = useCallback(
    throttle((height: string, optionName: string) => {
      let finalHeight = height;
      
      // Process responsive heights
      if (height.startsWith('responsive-')) {
        const percentage = parseInt(height.replace('responsive-', ''));
        finalHeight = calculateResponsiveHeight(percentage);
      }
      
      console.log(`🎛️ Height Controller: Applying height change to ${finalHeight} (${optionName})`);
      onHeightChange(finalHeight);
      isProcessing.current = false;
    }, 100),
    [onHeightChange, throttle, calculateResponsiveHeight]
  );

  const handleHeightSelect = useCallback((option: HeightOption, index: number) => {
    const now = Date.now();
    
    // Prevent rapid clicks
    if (now - lastClickTime.current < 150 || isProcessing.current) return;
    
    lastClickTime.current = now;
    isProcessing.current = true;
    
    setCurrentOptionIndex(index);
    setIsOpen(false);
    optimizedHeightChange(option.height, option.name);
    
    if (option.name === 'Atual') {
      toast.success(`📐 Altura da tela resetada para o padrão`);
    } else {
      toast.success(`📐 Altura alterada para ${option.name}`);
    }
  }, [optimizedHeightChange]);

  const IconComponent = currentOption.icon;
  const baseClasses = `h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg bg-gradient-to-br from-primary/90 to-primary/70 hover:from-primary hover:to-primary/80 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95`;

  if (position === 'relative') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(baseClasses, "animate-fade-in", className)}
          >
            <IconComponent size={16} className="text-primary-foreground md:w-5 md:h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-1">
            <div className="px-2 py-1.5">
              <h4 className="text-sm font-semibold">Altura da Tela:</h4>
              <p className="text-xs text-muted-foreground">
                Escolha o tamanho da altura
              </p>
            </div>
            <div className="space-y-1">
              {heightOptions.map((option, index) => {
                const OptionIcon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant={currentOptionIndex === index ? "secondary" : "ghost"}
                    className="w-full justify-start px-2 py-1.5 h-auto"
                    onClick={() => handleHeightSelect(option, index)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <OptionIcon className="w-4 h-4" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{option.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="lg"
          className={cn(
            "fixed bottom-20 right-4 z-[60]",
            baseClasses,
            "animate-fade-in",
            className
          )}
        >
          <IconComponent size={20} className="text-primary-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end" side="left">
        <div className="space-y-1">
          <div className="px-2 py-1.5">
            <h4 className="text-sm font-semibold">Altura da Tela:</h4>
            <p className="text-xs text-muted-foreground">
              Escolha o tamanho da altura
            </p>
          </div>
          <div className="space-y-1">
            {heightOptions.map((option, index) => {
              const OptionIcon = option.icon;
              return (
                <Button
                  key={option.id}
                  variant={currentOptionIndex === index ? "secondary" : "ghost"}
                  className="w-full justify-start px-2 py-1.5 h-auto"
                  onClick={() => handleHeightSelect(option, index)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <OptionIcon className="w-4 h-4" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{option.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};