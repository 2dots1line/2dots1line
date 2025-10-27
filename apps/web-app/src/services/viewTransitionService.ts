import viewTransitionsConfig from '../../../../config/view_transitions.json';

export interface ViewTransitionConfig {
  from: string;
  to: string;
  trigger_patterns: string[];
  question_template: string;
  target_chat_size: 'mini' | 'medium' | 'large';
  transition_delay_ms: number;
}

export interface ViewConfig {
  route: string;
  activeView: string | null;
  chat_enabled: boolean;
  default_chat_size?: 'mini' | 'medium' | 'large';
}

export interface TransitionContent {
  targetView: string;
  content: string;
  timestamp: number;
  targetChatSize: 'mini' | 'medium' | 'large';
}

export class ViewTransitionService {
  private static readonly STORAGE_KEY = viewTransitionsConfig.storage_key;

  /**
   * Get the storage key for transition content
   */
  static getStorageKey(): string {
    return this.STORAGE_KEY;
  }

  /**
   * Get transition config for specific route
   */
  static getTransition(fromView: string, toView: string): ViewTransitionConfig | null {
    const transitionKey = `${fromView}_to_${toView}`;
    const config = (viewTransitionsConfig.transitions as any)[transitionKey];
    return config || null;
  }

  /**
   * Get all available transitions from a specific view
   */
  static getAvailableTransitions(fromView: string): ViewTransitionConfig[] {
    return Object.values(viewTransitionsConfig.transitions)
      .filter((t: any) => t.from === fromView)
      .map((t: any) => ({
        from: t.from,
        to: t.to,
        trigger_patterns: t.trigger_patterns,
        question_template: t.question_template,
        target_chat_size: t.target_chat_size as 'mini' | 'medium' | 'large',
        transition_delay_ms: t.transition_delay_ms
      }));
  }

  /**
   * Get view configuration
   */
  static getViewConfig(view: string): ViewConfig | null {
    const config = (viewTransitionsConfig.views as any)[view];
    return config || null;
  }

  /**
   * Store transition content (single global key)
   */
  static storeTransitionContent(
    targetView: string,
    mainContent: string,
    targetChatSize?: string
  ): void {
    const transitionConfig = this.getViewConfig(targetView);
    const finalChatSize = targetChatSize || transitionConfig?.default_chat_size || 'medium';

    const content: TransitionContent = {
      targetView,
      content: mainContent,
      timestamp: Date.now(),
      targetChatSize: finalChatSize as 'mini' | 'medium' | 'large'
    };

    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(content));
    console.log(`🔄 ViewTransitionService: Stored content for ${targetView}`, content);
  }

  /**
   * Retrieve and clear transition content (single global key)
   * Only returns content if targetView matches currentView
   */
  static retrieveTransitionContent(currentView: string): TransitionContent | null {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    
    if (!data) return null;

    try {
      const content: TransitionContent = JSON.parse(data);
      
      // Only consume if this content is meant for current view
      if (content.targetView === currentView) {
        // Clear immediately after retrieval
        sessionStorage.removeItem(this.STORAGE_KEY);
        console.log(`🔄 ViewTransitionService: Retrieved content for ${currentView}`, content);
        return content;
      }
      
      // Content is for a different view, don't consume it
      console.log(`🔄 ViewTransitionService: Content is for ${content.targetView}, not ${currentView}. Ignoring.`);
      return null;
    } catch (error) {
      console.error('🔄 ViewTransitionService: Failed to parse transition content', error);
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  /**
   * Get route and activeView for navigation
   */
  static getNavigationTarget(targetView: string): { route: string; activeView: string | null } {
    const viewConfig = this.getViewConfig(targetView);
    return {
      route: viewConfig?.route || `/${targetView}`,
      activeView: viewConfig?.activeView ?? null
    };
  }
}

