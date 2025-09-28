import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { AppSidebar } from '@/components/AppSidebar';

interface MobileNavigationProps {
  children?: React.ReactNode;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header - usando lg:hidden para controle CSS puro */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="w-full px-4 flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="touch-target px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0 w-[280px] sm:w-[300px]">
                <AppSidebar />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-responsive-base font-semibold">App</h1>
          </div>
          
          <div className="flex items-center">
            {children}
          </div>
        </div>
      </header>

      {/* Sempre renderiza children */}
      {children}
    </>
  );
};