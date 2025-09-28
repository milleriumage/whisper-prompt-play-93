import { useEffect, useRef, useCallback } from 'react';
import { useMemoryOptimization } from './useMemoryOptimization';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  componentMounts: number;
  timerCount: number;
  subscriptionCount: number;
}

interface PerformanceThresholds {
  memoryUsage: number; // MB
  renderTime: number; // ms
  timerCount: number;
  subscriptionCount: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  memoryUsage: 100, // 100MB
  renderTime: 16, // 16ms para 60fps
  timerCount: 10,
  subscriptionCount: 5
};

/**
 * Hook para monitorar performance e detectar vazamentos de memória
 */
export const usePerformanceMonitor = (
  componentName: string,
  thresholds: Partial<PerformanceThresholds> = {}
) => {
  const { safeSetInterval, addCleanup } = useMemoryOptimization();
  
  const metricsRef = useRef<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    componentMounts: 0,
    timerCount: 0,
    subscriptionCount: 0
  });
  
  const warningsRef = useRef<Set<string>>(new Set());
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Monitorar render time
  const startRenderTime = useRef<number>(0);
  
  const startRender = useCallback(() => {
    startRenderTime.current = performance.now();
  }, []);
  
  const endRender = useCallback(() => {
    if (startRenderTime.current > 0) {
      const renderTime = performance.now() - startRenderTime.current;
      metricsRef.current.renderTime = renderTime;
      
      if (renderTime > finalThresholds.renderTime) {
        const warningKey = `${componentName}-render-time`;
        if (!warningsRef.current.has(warningKey)) {
          console.warn(`⚠️ [PERFORMANCE] ${componentName}: Render time ${renderTime.toFixed(2)}ms exceeds threshold ${finalThresholds.renderTime}ms`);
          warningsRef.current.add(warningKey);
        }
      }
      
      startRenderTime.current = 0;
    }
  }, [componentName, finalThresholds.renderTime]);

  // Monitorar uso de memória
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      metricsRef.current.memoryUsage = usedJSHeapSize;
      
      if (usedJSHeapSize > finalThresholds.memoryUsage) {
        const warningKey = `${componentName}-memory`;
        if (!warningsRef.current.has(warningKey)) {
          console.warn(`⚠️ [PERFORMANCE] ${componentName}: Memory usage ${usedJSHeapSize.toFixed(2)}MB exceeds threshold ${finalThresholds.memoryUsage}MB`);
          warningsRef.current.add(warningKey);
        }
      }
    }
  }, [componentName, finalThresholds.memoryUsage]);

  // Contar timers ativos (aproximado)
  const checkTimerCount = useCallback(() => {
    // Esta é uma aproximação - não há uma forma direta de contar timers ativos
    const timerCount = (window as any)._timerCount || 0;
    metricsRef.current.timerCount = timerCount;
    
    if (timerCount > finalThresholds.timerCount) {
      const warningKey = `${componentName}-timers`;
      if (!warningsRef.current.has(warningKey)) {
        console.warn(`⚠️ [PERFORMANCE] ${componentName}: Timer count ${timerCount} exceeds threshold ${finalThresholds.timerCount}`);
        warningsRef.current.add(warningKey);
      }
    }
  }, [componentName, finalThresholds.timerCount]);

  // Log metrics periodicamente
  const logMetrics = useCallback(() => {
    const metrics = metricsRef.current;
    console.log(`📊 [METRICS] ${componentName}:`, {
      memory: `${metrics.memoryUsage.toFixed(2)}MB`,
      renderTime: `${metrics.renderTime.toFixed(2)}ms`,
      timers: metrics.timerCount,
      subscriptions: metrics.subscriptionCount,
      mounts: metrics.componentMounts
    });
  }, [componentName]);

  // Inicializar monitoramento
  useEffect(() => {
    metricsRef.current.componentMounts++;
    
    // Monitorar a cada 10 segundos
    const monitorInterval = safeSetInterval(() => {
      checkMemoryUsage();
      checkTimerCount();
    }, 10000);

    // Log metrics a cada 30 segundos
    const logInterval = safeSetInterval(logMetrics, 30000);

    addCleanup(() => {
      if (monitorInterval) clearInterval(monitorInterval);
      if (logInterval) clearInterval(logInterval);
    });

    return () => {
      // Cleanup já é feito pelo useMemoryOptimization
    };
  }, [checkMemoryUsage, checkTimerCount, logMetrics, safeSetInterval, addCleanup]);

  // Detectar vazamentos de memória
  const detectMemoryLeak = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedHeap = memory.usedJSHeapSize;
      const totalHeap = memory.totalJSHeapSize;
      const heapLimit = memory.jsHeapSizeLimit;
      
      const usage = (usedHeap / heapLimit) * 100;
      
      if (usage > 80) {
        console.error(`🚨 [MEMORY LEAK] ${componentName}: Heap usage at ${usage.toFixed(2)}% (${(usedHeap / 1024 / 1024).toFixed(2)}MB)`);
        return true;
      }
    }
    return false;
  }, [componentName]);

  // Forçar garbage collection (só funciona em dev com --expose-gc)
  const forceGC = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log(`🗑️ [GC] ${componentName}: Garbage collection forced`);
    }
  }, [componentName]);

  return {
    startRender,
    endRender,
    getMetrics: () => metricsRef.current,
    detectMemoryLeak,
    forceGC,
    logMetrics
  };
};