import React from 'react';
import { DotNavigation } from './DotNavigation';

export interface Section {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface SectionNavigationProps {
  sections: Section[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  className?: string;
  variant?: 'dots' | 'tabs' | 'minimal';
  showLabels?: boolean;
}

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  currentSection,
  onSectionChange,
  className = '',
  variant = 'dots',
  showLabels = true
}) => {
  const currentIndex = sections.findIndex(section => section.id === currentSection);

  const handleDotClick = (index: number) => {
    onSectionChange(sections[index].id);
  };

  if (variant === 'tabs') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              section.id === currentSection
                ? 'bg-white/20 text-white/90 border border-white/30'
                : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/80'
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              section.id === currentSection
                ? 'bg-white/80'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={section.title}
          />
        ))}
      </div>
    );
  }

  // Default dots variant
  return (
    <DotNavigation
      totalItems={sections.length}
      currentIndex={currentIndex}
      onDotClick={handleDotClick}
      className={className}
      variant="default"
      showLabels={showLabels}
      labels={sections.map(section => section.title)}
    />
  );
};

export default SectionNavigation;
