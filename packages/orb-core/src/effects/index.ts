/**
 * Visual effect utilities for the Orb
 */

export interface EffectConfig {
  duration: number;
  intensity: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export class OrbEffects {
  /**
   * Create a pulsing effect
   */
  static pulse(config: EffectConfig): (time: number) => number {
    return (time: number) => {
      const progress = (time % config.duration) / config.duration;
      return config.intensity * Math.sin(progress * Math.PI * 2);
    };
  }

  /**
   * Create a breathing effect
   */
  static breathe(config: EffectConfig): (time: number) => number {
    return (time: number) => {
      const progress = (time % config.duration) / config.duration;
      return config.intensity * (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);
    };
  }

  /**
   * Create a shimmer effect
   */
  static shimmer(config: EffectConfig): (time: number) => number {
    return (time: number) => {
      const progress = (time % config.duration) / config.duration;
      return config.intensity * Math.abs(Math.sin(progress * Math.PI * 4));
    };
  }

  /**
   * Apply easing to a value
   */
  static applyEasing(value: number, easing: string = 'linear'): number {
    switch (easing) {
      case 'ease-in':
        return value * value;
      case 'ease-out':
        return 1 - Math.pow(1 - value, 2);
      case 'ease-in-out':
        return value < 0.5 
          ? 2 * value * value 
          : 1 - Math.pow(-2 * value + 2, 2) / 2;
      default:
        return value;
    }
  }
} 