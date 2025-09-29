import { useEffect, useRef, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface UseMobileDraggableOptions {
  initialPosition?: Position;
  initialSize?: Size;
  minSize?: Size;
  maxSize?: Size;
  storageKey?: string;
  bounds?: 'parent' | 'viewport';
}

export const useMobileDraggable = (options: UseMobileDraggableOptions = {}) => {
  const isMobile = useIsMobile();
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Position | null>(null);
  const elementStartRef = useRef<Position | null>(null);
  
  const {
    initialPosition = { x: 20, y: 20 },
    initialSize = { width: 320, height: 400 },
    minSize = { width: 280, height: 300 },
    maxSize = { width: 600, height: 800 },
    storageKey,
    bounds = 'viewport'
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);

  // Load saved position and size from localStorage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`mobileDrag-${storageKey}`);
      if (saved) {
        try {
          const { position: savedPos, size: savedSize } = JSON.parse(saved);
          if (savedPos) setPosition(savedPos);
          if (savedSize) setSize(savedSize);
        } catch (error) {
          console.warn('Failed to load saved position:', error);
        }
      }
    }
  }, [storageKey]);

  // Save position and size to localStorage
  const saveState = useCallback(() => {
    if (storageKey) {
      localStorage.setItem(`mobileDrag-${storageKey}`, JSON.stringify({
        position,
        size
      }));
    }
  }, [storageKey, position, size]);

  // Get bounds for dragging
  const getBounds = useCallback(() => {
    if (bounds === 'parent' && elementRef.current?.parentElement) {
      const parent = elementRef.current.parentElement;
      return {
        left: 0,
        top: 0,
        right: parent.clientWidth - size.width,
        bottom: parent.clientHeight - size.height
      };
    }
    
    // Default to viewport bounds
    return {
      left: 0,
      top: 0,
      right: window.innerWidth - size.width,
      bottom: window.innerHeight - size.height
    };
  }, [bounds, size]);

  // Constrain position within bounds
  const constrainPosition = useCallback((pos: Position): Position => {
    const bounds = getBounds();
    return {
      x: Math.max(bounds.left, Math.min(pos.x, bounds.right)),
      y: Math.max(bounds.top, Math.min(pos.y, bounds.bottom))
    };
  }, [getBounds]);

  // Handle drag start (both mouse and touch)
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    elementStartRef.current = position;
    
    // Add active dragging class for visual feedback
    if (elementRef.current) {
      elementRef.current.style.userSelect = 'none';
      elementRef.current.style.transition = 'none';
    }
  }, [position]);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !elementStartRef.current) return;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    const newPosition = constrainPosition({
      x: elementStartRef.current.x + deltaX,
      y: elementStartRef.current.y + deltaY
    });

    setPosition(newPosition);
  }, [isDragging, constrainPosition]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    elementStartRef.current = null;
    
    if (elementRef.current) {
      elementRef.current.style.userSelect = '';
      elementRef.current.style.transition = '';
    }
    
    saveState();
  }, [saveState]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  // Global event listeners for move and end
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Snap to edges on mobile
  const snapToEdge = useCallback(() => {
    if (!isMobile) return;
    
    const bounds = getBounds();
    const centerX = bounds.right / 2;
    
    // Snap to closest edge (left or right)
    const newX = position.x < centerX ? bounds.left : bounds.right;
    const newPosition = constrainPosition({ x: newX, y: position.y });
    
    setPosition(newPosition);
    saveState();
  }, [isMobile, position, getBounds, constrainPosition, saveState]);

  // Center window
  const centerWindow = useCallback(() => {
    const bounds = getBounds();
    const newPosition = constrainPosition({
      x: bounds.right / 2,
      y: bounds.bottom / 2
    });
    setPosition(newPosition);
    saveState();
  }, [getBounds, constrainPosition, saveState]);

  // Reset to initial position
  const resetWindow = useCallback(() => {
    setPosition(initialPosition);
    setSize(initialSize);
    saveState();
  }, [initialPosition, initialSize, saveState]);

  // Drag handle props
  const dragHandleProps = {
    onMouseDown: handleMouseDown,
    onTouchStart: handleTouchStart,
    style: {
      touchAction: 'none', // Prevent default touch behaviors
      cursor: isDragging ? 'grabbing' : 'grab'
    }
  };

  // Element style for positioning
  const elementStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: isDragging ? 9999 : 1000,
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    pointerEvents: 'auto'
  };

  return {
    elementRef,
    elementStyle,
    dragHandleProps,
    isDragging,
    isMobile,
    position,
    size,
    setPosition,
    setSize,
    snapToEdge,
    centerWindow,
    resetWindow,
    // Additional mobile-friendly methods
    moveToCorner: (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
      const bounds = getBounds();
      const positions = {
        'top-left': { x: bounds.left, y: bounds.top },
        'top-right': { x: bounds.right, y: bounds.top },
        'bottom-left': { x: bounds.left, y: bounds.bottom },
        'bottom-right': { x: bounds.right, y: bounds.bottom }
      };
      setPosition(positions[corner]);
      saveState();
    }
  };
};