import { ViewTransitionService } from './viewTransitionService';

export interface CapabilityExecution {
  capabilityId: string;
  parameters: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export class CapabilityExecutor {
  /**
   * Execute a capability by ID
   */
  static async execute(execution: CapabilityExecution): Promise<any> {
    const capability = await this.getCapability(execution.capabilityId);
    
    if (!capability) {
      const error = new Error(`Capability ${execution.capabilityId} not found`);
      if (execution.onError) {
        execution.onError(error);
      }
      throw error;
    }

    try {
      let result;
      
      switch (capability.execution_type) {
        case 'frontend_navigation':
          result = await this.executeFrontendNavigation(capability, execution.parameters);
          break;
        case 'frontend_component':
          result = await this.executeFrontendComponent(capability, execution.parameters);
          break;
        case 'frontend_action':
          result = await this.executeFrontendAction(capability, execution.parameters);
          break;
        case 'backend_worker':
          result = await this.executeBackendWorker(capability, execution.parameters);
          break;
        case 'backend_api':
          result = await this.executeBackendAPI(capability, execution.parameters);
          break;
        default:
          throw new Error(`Unknown execution type: ${capability.execution_type}`);
      }
      
      if (execution.onSuccess) {
        execution.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      if (execution.onError) {
        execution.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Get capability definition from registry
   */
  private static async getCapability(capabilityId: string): Promise<any> {
    try {
      const response = await fetch('/config/agent_capabilities.json');
      const config = await response.json();
      
      for (const category of Object.values(config.capability_categories)) {
        const found = (category as any).capabilities.find((c: any) => c.id === capabilityId);
        if (found) {
          return found;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load agent capabilities config:', error);
      return null;
    }
  }

  /**
   * Execute frontend navigation (delegate to ViewTransitionService)
   */
  private static async executeFrontendNavigation(capability: any, parameters: any): Promise<any> {
    const targetView = parameters.target || capability.target_view;
    
    if (!targetView) {
      throw new Error('No target view specified for navigation');
    }
    
    const navTarget = ViewTransitionService.getNavigationTarget(targetView);
    
    console.log(`🎯 CapabilityExecutor: Executing navigation to ${targetView}`, navTarget);
    
    // Store content if provided
    if (parameters.content) {
      ViewTransitionService.storeTransitionContent(
        targetView,
        parameters.content,
        parameters.chatSize
      );
    }
    
    // Navigation is handled by the calling component (ChatInterface)
    // This just validates and prepares the navigation
    return { targetView, navTarget };
  }

  /**
   * Execute frontend component loading
   */
  private static async executeFrontendComponent(capability: any, parameters: any): Promise<any> {
    console.log(`🧩 CapabilityExecutor: Loading component ${capability.target_component}`, parameters);
    
    window.dispatchEvent(new CustomEvent('load-component', {
      detail: {
        component: capability.target_component,
        parameters
      }
    }));
    
    return { component: capability.target_component, parameters };
  }

  /**
   * Execute frontend action (dispatch custom event)
   */
  private static async executeFrontendAction(capability: any, parameters: any): Promise<any> {
    console.log(`⚡ CapabilityExecutor: Dispatching action ${capability.target_action}`, parameters);
    
    window.dispatchEvent(new CustomEvent(capability.target_action, {
      detail: parameters
    }));
    
    return { action: capability.target_action, parameters };
  }

  /**
   * Execute backend worker trigger
   */
  private static async executeBackendWorker(capability: any, parameters: any): Promise<any> {
    console.log(`🔧 CapabilityExecutor: Triggering worker ${capability.target_worker}`, parameters);
    
    const response = await fetch(`/api/v1/workers/${capability.target_worker}/trigger`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
      },
      body: JSON.stringify(parameters)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger ${capability.target_worker}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (capability.async_notification) {
      console.log(`🔧 CapabilityExecutor: ${capability.target_worker} triggered, will notify when complete`);
    }
    
    return result;
  }

  /**
   * Execute backend API call
   */
  private static async executeBackendAPI(capability: any, parameters: any): Promise<any> {
    console.log(`📡 CapabilityExecutor: Calling API ${capability.target_endpoint}`, parameters);
    
    const response = await fetch(capability.target_endpoint, {
      method: capability.method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
      },
      body: JSON.stringify(parameters)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Handle success action if defined
    if (capability.success_action) {
      await this.handleSuccessAction(capability.success_action, result);
    }
    
    return result;
  }

  /**
   * Handle success actions after capability execution
   */
  private static async handleSuccessAction(action: any, result: any): Promise<void> {
    console.log(`✅ CapabilityExecutor: Handling success action`, action);
    
    switch (action.type) {
      case 'switch_view':
        ViewTransitionService.storeTransitionContent(
          action.target,
          action.message || result.message || 'Operation completed successfully.',
          action.chatSize || 'medium'
        );
        
        // Dispatch navigation event for ChatInterface to handle
        window.dispatchEvent(new CustomEvent('capability-navigate', {
          detail: {
            target: action.target,
            result
          }
        }));
        break;
        
      case 'show_notification':
        window.dispatchEvent(new CustomEvent('show-notification', {
          detail: {
            message: action.message,
            type: action.notification_type || 'success'
          }
        }));
        break;
        
      default:
        console.warn(`Unknown success action type: ${action.type}`);
    }
  }
}

