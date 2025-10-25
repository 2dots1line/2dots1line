import React from 'react';
import { usePathname } from 'next/navigation';
import { useHUDStore } from '../../stores/HUDStore';
import { GlassButton } from '@2dots1line/ui-components';
import { DashboardSettings } from './DashboardSettings';
import { ChatSettings } from './ChatSettings';
import { CardsSettings } from './CardsSettings';
import { CosmosSettings } from './CosmosSettings';

export const ContextualSettings: React.FC = () => {
  const pathname = usePathname();
  const { activeView, setShowGlobalSettings } = useHUDStore();
  
  // Determine current context - always use the actual activeView (never 'settings')
  const isCosmosPage = pathname.startsWith('/cosmos');
  const currentContext = isCosmosPage ? 'cosmos' : (activeView || 'dashboard');
  
  // Get friendly name
  const contextName = isCosmosPage ? 'Cosmos' : 
    currentContext === 'dashboard' ? 'Dashboard' :
    currentContext === 'chat' ? 'Chat' :
    currentContext === 'cards' ? 'Cards' : 'Dashboard';
  
  return (
    <div className="space-y-3">
      {/* Header - Only show for non-dashboard contexts to avoid redundancy */}
      {currentContext !== 'dashboard' && currentContext !== 'cosmos' && currentContext !== 'cards' && currentContext !== 'chat' && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90 font-brand">{contextName}</h3>
        </div>
      )}
      
      {/* View-specific settings */}
      <div className="space-y-3">
        {currentContext === 'dashboard' && <DashboardSettings />}
        {currentContext === 'chat' && <ChatSettings />}
        {currentContext === 'cards' && <CardsSettings />}
        {(currentContext === 'cosmos' || isCosmosPage) && <CosmosSettings />}
      </div>
      
      {/* Global settings link */}
      <div className="pt-3 border-t border-white/20">
        <GlassButton
          onClick={() => setShowGlobalSettings(true)}
          size="sm"
          className="w-full justify-start text-left"
        >
          <span>All Settings</span>
        </GlassButton>
      </div>
    </div>
  );
};

