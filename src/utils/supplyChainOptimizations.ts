/**
 * Supply Chain Optimizations
 * Performance utilities and optimization helpers for the supply chain module
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';

// Debounce hook for search inputs
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized filter hook for large datasets
export const useOptimizedFilter = <T>(
  data: T[],
  filters: Record<string, any>,
  searchTerm: string,
  searchFields: (keyof T)[]
) => {
  return useMemo(() => {
    return data.filter(item => {
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        searchFields.some(field => 
          String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Apply other filters
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (value === 'tous' || value === '' || value === null) return true;
        return (item as any)[key] === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, filters, searchTerm, searchFields]);
};

// Virtualization helper for large lists
export const useVirtualization = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, itemCount);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleRange,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

// Performance monitoring hook
export const usePerformanceTracking = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderTime > 16) { // Longer than 16ms (60fps threshold)
      console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
    }
    
    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    trackOperation: useCallback((name: string, operation: () => void) => {
      const opStart = performance.now();
      operation();
      const opEnd = performance.now();
      const opTime = opEnd - opStart;
      
      if (opTime > 5) {
        console.warn(`${componentName}.${name} took ${opTime.toFixed(2)}ms`);
      }
    }, [componentName])
  };
};

// Optimized data transformer
export const useDataTransformer = <T, R>(
  data: T[],
  transformer: (item: T) => R,
  deps: any[] = []
) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const startTime = performance.now();
    const result = data.map(transformer);
    const endTime = performance.now();
    
    if (endTime - startTime > 10) {
      console.warn(`Data transformation took ${(endTime - startTime).toFixed(2)}ms for ${data.length} items`);
    }
    
    return result;
  }, [data, ...deps]);
};

// Cache hook for expensive calculations
export const useCache = <T>(
  key: string,
  factory: () => T,
  deps: any[] = []
): T => {
  const cache = useRef<Map<string, { value: T; deps: any[] }>>(new Map());
  
  return useMemo(() => {
    const cached = cache.current.get(key);
    
    // Check if cache is valid
    if (cached && JSON.stringify(cached.deps) === JSON.stringify(deps)) {
      return cached.value;
    }
    
    // Calculate new value
    const startTime = performance.now();
    const value = factory();
    const endTime = performance.now();
    
    if (endTime - startTime > 5) {
      console.warn(`Cache miss for \"${key}\" took ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    // Store in cache
    cache.current.set(key, { value, deps });
    
    // Limit cache size
    if (cache.current.size > 100) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    return value;
  }, deps);
};

// Batch processing utility
export const useBatchProcessor = <T, R>(
  batchSize: number = 100
) => {
  const process = useCallback(async (
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> => {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }
      
      // Allow other tasks to run
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }, [batchSize]);

  return { process };
};

// Memory usage monitor
export const useMemoryMonitor = (componentName: string) => {
  useEffect(() => {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize / 1024 / 1024;
        const total = memory.totalJSHeapSize / 1024 / 1024;
        
        if (used > 100) { // More than 100MB
          console.warn(`${componentName} high memory usage: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
        }
      };
      
      const interval = setInterval(checkMemory, 30000); // Check every 30s
      
      return () => clearInterval(interval);
    }
  }, [componentName]);
};

// Network request optimization
export const useOptimizedFetch = () => {
  const requestCache = useRef<Map<string, Promise<any>>>(new Map());
  
  const fetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      cache?: boolean;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<T> => {
    const { cache = true, timeout = 30000, retries = 3 } = options;
    
    // Return cached promise if exists
    if (cache && requestCache.current.has(key)) {
      return requestCache.current.get(key);
    }
    
    const fetchWithRetry = async (attemptsLeft: number): Promise<T> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const promise = fetcher();
        const result = await promise;
        
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        if (attemptsLeft > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchWithRetry(attemptsLeft - 1);
        }
        throw error;
      }
    };
    
    const promise = fetchWithRetry(retries);
    
    if (cache) {
      requestCache.current.set(key, promise);
      
      // Clean up cache after 5 minutes
      setTimeout(() => {
        requestCache.current.delete(key);
      }, 5 * 60 * 1000);
    }
    
    return promise;
  }, []);

  return { fetch };
};

// Performance metrics collector
export const usePerformanceMetrics = () => {
  const metrics = useRef<Array<{
    name: string;
    value: number;
    timestamp: number;
  }>>([]);

  const recordMetric = useCallback((name: string, value: number) => {
    metrics.current.push({
      name,
      value,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 metrics
    if (metrics.current.length > 1000) {
      metrics.current = metrics.current.slice(-1000);
    }
  }, []);

  const getMetrics = useCallback(() => {
    const last5Minutes = Date.now() - 5 * 60 * 1000;
    return metrics.current.filter(m => m.timestamp > last5Minutes);
  }, []);

  const getAverageMetric = useCallback((name: string) => {
    const relevantMetrics = getMetrics().filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    return relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;
  }, [getMetrics]);

  return {
    recordMetric,
    getMetrics,
    getAverageMetric
  };
};

// Component optimization utilities
export const optimizationHelpers = {
  /**
   * Shallow compare for React.memo
   */
  shallowEqual: (prevProps: any, nextProps: any) => {
    const keys1 = Object.keys(prevProps);
    const keys2 = Object.keys(nextProps);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
      if (prevProps[key] !== nextProps[key]) return false;
    }
    
    return true;
  },

  /**
   * Deep compare for complex objects
   */
  deepEqual: (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (let key of keysA) {
        if (!optimizationHelpers.deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  },

  /**
   * Create optimized selector
   */
  createSelector: <T, R>(
    selector: (data: T) => R,
    equalityFn: (a: R, b: R) => boolean = (a, b) => a === b
  ) => {
    let lastInput: T;
    let lastResult: R;
    
    return (input: T): R => {
      if (input !== lastInput) {
        const newResult = selector(input);
        
        if (!equalityFn(newResult, lastResult)) {
          lastResult = newResult;
        }
        
        lastInput = input;
      }
      
      return lastResult;
    };
  }
};
