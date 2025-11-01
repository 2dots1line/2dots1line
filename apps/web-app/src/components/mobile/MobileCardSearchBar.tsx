import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { GlassmorphicPanel } from '@2dots1line/ui-components';
import { useUserStore } from '../../stores/UserStore';
import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation';

interface MobileCardSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
  searchResultsCount: number;
  sortKey: string;
  onSortChange: (sortKey: string) => void;
  hasCoverFirst: boolean;
  onCoverFirstChange: (coverFirst: boolean) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  className?: string;
}

export const MobileCardSearchBar: React.FC<MobileCardSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  isSearching,
  searchResultsCount,
  sortKey,
  onSortChange,
  hasCoverFirst,
  onCoverFirstChange,
  scrollContainerRef,
  className = ''
}) => {
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { user } = useUserStore();
  const { t } = useTranslation(user?.language_preference);

  const handleClearSearch = () => {
    onSearchChange('');
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down (swipe up) - make more transparent (get out of the way)
        setIsScrolledUp(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up (swipe down) - make more opaque (easier to search)
        setIsScrolledUp(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Add scroll listener to the correct container
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, scrollContainerRef]);

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 mobile-safe-top ${className}`}>
      <GlassmorphicPanel 
        variant="glass-panel" 
        rounded="none" 
        padding="sm"
        className={`w-full transition-opacity duration-300 ${
          isScrolledUp ? 'opacity-30' : 'opacity-100'
        }`}
      >
        {/* Search Input - Aligned with sort dropdown */}
        <div className="relative mb-3 ml-14">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('cards.search.placeholder')}
              className="w-full bg-white/10 rounded-2xl px-12 py-3 text-base text-white placeholder:text-white/50 border border-white/10 focus:border-white/30 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50"></div>
              </div>
            )}
            {!isSearching && searchQuery.trim() && searchResultsCount > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-white/70">
                {searchResultsCount}
              </div>
            )}
          </div>
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex items-center justify-between gap-3 ml-14">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">{t('cards.settings.sortBy')}</span>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              value={sortKey}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="newest">{t('cards.sortBy.newest')}</option>
              <option value="oldest">{t('cards.sortBy.oldest')}</option>
              <option value="title_asc">{t('cards.sortBy.titleAsc')}</option>
              <option value="title_desc">{t('cards.sortBy.titleDesc')}</option>
            </select>
          </div>

          {/* Cover First Toggle */}
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={hasCoverFirst}
              onChange={(e) => onCoverFirstChange(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-white/20"
            />
            {t('cards.settings.showCoversFirst')}
          </label>
        </div>
      </GlassmorphicPanel>
    </div>
  );
};
