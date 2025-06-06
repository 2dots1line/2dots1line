import { Object3D } from 'three';

/**
 * Base Orb implementation providing core functionality
 * for all Orb visualizations in the 2dots1line system.
 */
export abstract class BaseOrb extends Object3D {
  protected _state: string = 'idle';
  protected _emotion: string = 'neutral';

  constructor() {
    super();
    this.name = 'BaseOrb';
  }

  /**
   * Update the Orb's visual state
   */
  abstract setState(state: string): void;

  /**
   * Update the Orb's emotional state
   */
  abstract setEmotion(emotion: string): void;

  /**
   * Update the Orb's animation frame
   */
  abstract update(deltaTime: number): void;

  /**
   * Get current state
   */
  get state(): string {
    return this._state;
  }

  /**
   * Get current emotion
   */
  get emotion(): string {
    return this._emotion;
  }
} 