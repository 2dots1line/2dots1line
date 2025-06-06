/**
 * Emotional state definitions for the Orb
 */

export enum OrbEmotion {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  EXCITED = 'excited',
  CURIOUS = 'curious',
  CONTEMPLATIVE = 'contemplative',
  EMPATHETIC = 'empathetic',
  CONCERNED = 'concerned'
}

export interface OrbEmotionConfig {
  name: string;
  color: {
    primary: string;
    secondary: string;
  };
  intensity: number;
  pulseRate?: number;
}

export const OrbEmotionConfigs: Record<OrbEmotion, OrbEmotionConfig> = {
  [OrbEmotion.NEUTRAL]: {
    name: 'Neutral',
    color: { primary: '#ffffff', secondary: '#f0f0f0' },
    intensity: 0.5
  },
  [OrbEmotion.HAPPY]: {
    name: 'Happy',
    color: { primary: '#ffeb3b', secondary: '#fff176' },
    intensity: 0.8,
    pulseRate: 1.2
  },
  [OrbEmotion.EXCITED]: {
    name: 'Excited',
    color: { primary: '#ff5722', secondary: '#ff8a65' },
    intensity: 0.9,
    pulseRate: 1.8
  },
  [OrbEmotion.CURIOUS]: {
    name: 'Curious',
    color: { primary: '#2196f3', secondary: '#64b5f6' },
    intensity: 0.7,
    pulseRate: 1.0
  },
  [OrbEmotion.CONTEMPLATIVE]: {
    name: 'Contemplative',
    color: { primary: '#9c27b0', secondary: '#ba68c8' },
    intensity: 0.6,
    pulseRate: 0.8
  },
  [OrbEmotion.EMPATHETIC]: {
    name: 'Empathetic',
    color: { primary: '#4caf50', secondary: '#81c784' },
    intensity: 0.7,
    pulseRate: 0.9
  },
  [OrbEmotion.CONCERNED]: {
    name: 'Concerned',
    color: { primary: '#ff9800', secondary: '#ffb74d' },
    intensity: 0.6,
    pulseRate: 1.1
  }
}; 