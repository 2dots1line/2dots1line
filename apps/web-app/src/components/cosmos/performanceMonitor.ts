/**
 * Simple performance monitoring for cosmos components
 * Tracks frame rates and identifies performance bottlenecks
 */

interface PerformanceMetrics {
  frameCount: number;
  lastFrameTime: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  isLowPerformance: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    frameCount: 0,
    lastFrameTime: 0,
    averageFPS: 60,
    minFPS: 60,
    maxFPS: 60,
    isLowPerformance: false
  };

  private frameTimes: number[] = [];
  private lastReportTime = 0;
  private readonly REPORT_INTERVAL = 5000; // Report every 5 seconds
  private readonly LOW_FPS_THRESHOLD = 30; // Consider low performance below 30 FPS

  updateFrame() {
    const now = performance.now();
    const deltaTime = now - this.metrics.lastFrameTime;
    
    if (this.metrics.lastFrameTime > 0) {
      const fps = 1000 / deltaTime;
      this.frameTimes.push(fps);
      
      // Keep only last 60 frames for rolling average
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }
      
      // Update metrics
      this.metrics.averageFPS = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.metrics.minFPS = Math.min(this.metrics.minFPS, fps);
      this.metrics.maxFPS = Math.max(this.metrics.maxFPS, fps);
      this.metrics.isLowPerformance = this.metrics.averageFPS < this.LOW_FPS_THRESHOLD;
    }
    
    this.metrics.lastFrameTime = now;
    this.metrics.frameCount++;
    
    // Report performance periodically
    if (now - this.lastReportTime > this.REPORT_INTERVAL) {
      this.reportPerformance();
      this.lastReportTime = now;
    }
  }

  private reportPerformance() {
    if (this.metrics.isLowPerformance) {
      console.warn('🚨 Low Performance Detected:', {
        averageFPS: Math.round(this.metrics.averageFPS),
        minFPS: Math.round(this.metrics.minFPS),
        maxFPS: Math.round(this.metrics.maxFPS),
        frameCount: this.metrics.frameCount
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metrics:', {
        averageFPS: Math.round(this.metrics.averageFPS),
        minFPS: Math.round(this.metrics.minFPS),
        maxFPS: Math.round(this.metrics.maxFPS)
      });
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      frameCount: 0,
      lastFrameTime: 0,
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      isLowPerformance: false
    };
    this.frameTimes = [];
    this.lastReportTime = 0;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
