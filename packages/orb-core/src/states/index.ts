/**
 * Visual state definitions for the Orb
 */

export enum OrbState {
  IDLE = 'idle',
  LISTENING = 'listening',
  THINKING = 'thinking',
  SPEAKING = 'speaking',
  PROCESSING = 'processing',
  SLEEPING = 'sleeping'
}

export interface OrbStateConfig {
  name: string;
  duration?: number;
  loop?: boolean;
  intensity?: number;
}

export const OrbStateConfigs: Record<OrbState, OrbStateConfig> = {
  [OrbState.IDLE]: {
    name: 'Idle',
    loop: true,
    intensity: 0.3
  },
  [OrbState.LISTENING]: {
    name: 'Listening',
    loop: true,
    intensity: 0.6
  },
  [OrbState.THINKING]: {
    name: 'Thinking',
    loop: true,
    intensity: 0.8
  },
  [OrbState.SPEAKING]: {
    name: 'Speaking',
    loop: false,
    intensity: 0.9
  },
  [OrbState.PROCESSING]: {
    name: 'Processing',
    loop: true,
    intensity: 0.7
  },
  [OrbState.SLEEPING]: {
    name: 'Sleeping',
    loop: true,
    intensity: 0.1
  }
}; 