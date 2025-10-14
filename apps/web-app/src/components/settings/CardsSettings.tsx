import React from 'react';
import { BackgroundVideoSelector } from './BackgroundVideoSelector';
import { useCardsViewStore } from '../../stores/CardsViewStore';
import { useCardStore } from '../../stores/CardStore';
import { LayoutGrid, List, Star, Palette } from 'lucide-react';

// Available image generation styles from config/media_generation_prompts.json
const IMAGE_STYLES = [
  { value: 'minimal', label: 'Minimal', description: 'Clean, minimalist design' },
  { value: 'abstract', label: 'Abstract', description: 'Geometric patterns' },
  { value: 'nature', label: 'Nature', description: 'Organic forms' },
  { value: 'cosmic', label: 'Cosmic', description: 'Space-inspired' },
  { value: 'photorealistic', label: 'Photorealistic', description: 'Realistic style' },
] as const;

export const CardsSettings: React.FC = () => {
  const { 
    viewMode, 
    sortKey, 
    hasCoverFirst, 
    defaultCoverStyle,
    setViewMode, 
    setSortKey, 
    setHasCoverFirst,
    setDefaultCoverStyle 
  } = useCardsViewStore();
  const { initializeSortedLoader } = useCardStore();
  
  return (
    <div className="space-y-3">
      <BackgroundVideoSelector view="cards" />
      
      <div className="pt-2 border-t border-white/20 space-y-3">
        {/* View Mode Toggle */}
        <div>
          <label className="text-xs font-medium text-white/70 mb-2 block">View Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setViewMode('infinite')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-brand transition-colors ${
                viewMode === 'infinite' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              title="Infinite scrolling view"
            >
              <LayoutGrid size={14} />
              <span>Infinite</span>
            </button>
            <button
              onClick={() => setViewMode('sorted')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-brand transition-colors ${
                viewMode === 'sorted' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              title="Sorted grid view"
            >
              <List size={14} />
              <span>Sorted</span>
            </button>
          </div>
        </div>
        
        {/* Covers First Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/70 flex items-center gap-1">
            <Star size={12} />
            Covers First
          </span>
          <button
            onClick={async () => {
              const newValue = !hasCoverFirst;
              setHasCoverFirst(newValue);
              // Reinitialize loader with new cover setting
              if (viewMode === 'sorted') {
                await initializeSortedLoader(sortKey, newValue, true);
              }
            }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              hasCoverFirst ? 'bg-blue-600' : 'bg-white/20'
            }`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              hasCoverFirst ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        {/* Sort By */}
        <div>
          <label className="text-xs font-medium text-white/70 mb-2 block">Sort By</label>
          <select
            value={sortKey}
            onChange={async (e) => {
              const newValue = e.target.value as any;
              setSortKey(newValue);
              // Reinitialize loader with new sort key
              if (viewMode === 'sorted') {
                await initializeSortedLoader(newValue, hasCoverFirst, true);
              }
            }}
            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white/90 font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
          >
            <option value="newest" className="bg-gray-900 text-white">Newest First</option>
            <option value="oldest" className="bg-gray-900 text-white">Oldest First</option>
            <option value="title_asc" className="bg-gray-900 text-white">Title (A-Z)</option>
            <option value="title_desc" className="bg-gray-900 text-white">Title (Z-A)</option>
          </select>
        </div>

        {/* Default Cover Style */}
        <div>
          <label className="text-xs font-medium text-white/70 mb-2 flex items-center gap-1 block">
            <Palette size={12} />
            Default Cover Style
          </label>
          <select
            value={defaultCoverStyle}
            onChange={(e) => setDefaultCoverStyle(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white/90 font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
            title="Default style for AI-generated card covers"
          >
            {IMAGE_STYLES.map((style) => (
              <option key={style.value} value={style.value} className="bg-gray-900 text-white">
                {style.label} - {style.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-white/50 mt-1">
            Applied when generating new card covers
          </p>
        </div>
      </div>
    </div>
  );
};

