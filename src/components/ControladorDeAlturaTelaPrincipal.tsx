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
    throttle((height: string, optionName: string) => {
      console.log(`🎛️ Height Controller: Applying height change to ${height} (${optionName})`);
      onHeightChange(height);
      isProcessing.current = false;
    }, 100),
    [onHeightChange, throttle]
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