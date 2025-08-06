/**
 * Performance Monitoring Utilities for Supply Chain Module
 * Provides tools for monitoring and optimizing performance
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  updateCount: number;
  lastUpdate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: Map<string, ComponentPerformance> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Monitor long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long-task', entry.duration, {
            name: entry.name,
            startTime: entry.startTime
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn('Long task monitoring not supported');
    }

    // Monitor navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('navigation', navEntry.loadEventEnd - navEntry.loadEventStart, {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            firstPaint: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
          });
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation timing monitoring not supported');
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log warning for slow operations
    if (value > 100) { // 100ms threshold
      console.warn(`Slow operation detected: ${name} took ${value}ms`, metadata);
    }
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    this.recordMetric(name, endTime - startTime);
    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    this.recordMetric(name, endTime - startTime);
    return result;
  }

  /**
   * Monitor React component performance
   */
  recordComponentRender(componentName: string, renderTime: number) {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderTime = renderTime;
      existing.updateCount++;
      existing.lastUpdate = Date.now();
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderTime,
        updateCount: 1,
        lastUpdate: Date.now()
      });
    }

    // Log warning for slow renders
    if (renderTime > 16) { // 16ms threshold (60fps)
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);
    
    const summary: Record<string, any> = {};
    
    // Group metrics by name
    const metricsByName = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(metricsByName).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    });

    return {
      timeRange: '5 minutes',
      metrics: summary,
      components: Array.from(this.componentMetrics.values()),
      recommendations: this.getOptimizationRecommendations()
    };
  }

  /**
   * Get optimization recommendations based on metrics
   */
  private getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for slow components
    for (const [name, metrics] of this.componentMetrics) {
      if (metrics.renderTime > 16) {
        recommendations.push(`Optimize ${name} component - render time: ${metrics.renderTime.toFixed(2)}ms`);
      }
      
      if (metrics.updateCount > 100) {
        recommendations.push(`${name} component is re-rendering frequently (${metrics.updateCount} times)`);
      }
    }

    // Check for slow API calls
    const apiMetrics = this.metrics.filter(m => m.name.includes('api') || m.name.includes('fetch'));
    const slowApiCalls = apiMetrics.filter(m => m.value > 1000);
    
    if (slowApiCalls.length > 0) {
      recommendations.push(`${slowApiCalls.length} slow API calls detected (>1s)`);
    }

    // Check for memory issues
    if (this.metrics.length > 800) {
      recommendations.push('High number of performance metrics recorded - check for memory leaks');
    }

    return recommendations;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      components: Array.from(this.componentMetrics.entries()),
      summary: this.getPerformanceSummary()
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.componentMetrics.clear();
  }

  /**
   * Cleanup observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clear();
  }
}

// Performance monitoring hooks for React components
export const usePerformanceMonitor = () => {
  const monitor = new PerformanceMonitor();
  
  const measureRender = (componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      monitor.recordComponentRender(componentName, endTime - startTime);
    };
  };

  const measureAsyncOperation = async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
    return monitor.measureAsyncFunction(name, operation);
  };

  const measureOperation = <T>(name: string, operation: () => T): T => {
    return monitor.measureFunction(name, operation);
  };

  return {
    measureRender,
    measureAsyncOperation,
    measureOperation,
    getSummary: () => monitor.getPerformanceSummary(),
    exportMetrics: () => monitor.exportMetrics()
  };
};

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();

// Utility functions for common performance optimizations
export const optimizationUtils = {
  /**
   * Debounce function to limit call frequency
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  },

  /**
   * Throttle function to limit call rate
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  /**
   * Memoize function results
   */
  memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  /**
   * Batch array operations
   */
  batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => R[],
    batchSize: number = 100
  ): R[] {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      results.push(...processor(batch));
    }
    return results;
  }
};
