/**
 * DashboardConfigService.ts
 * V9.7 Service for managing dashboard configuration
 */

import fs from 'fs';
import path from 'path';

export interface DashboardSectionConfig {
  title: string;
  icon: string;
  description: string;
  max_items: number;
  priority: number;
  category: string;
}

export interface SectionCategory {
  title: string;
  color: string;
  description: string;
}

export interface DashboardLayout {
  grid_columns: {
    default: number;
    mobile: number;
    tablet: number;
  };
  section_groups: Array<{
    title: string;
    sections: string[];
    priority: number;
  }>;
}

export interface DashboardConfig {
  dashboard_sections: Record<string, DashboardSectionConfig>;
  section_categories: Record<string, SectionCategory>;
  dashboard_layout: DashboardLayout;
}

export class DashboardConfigService {
  private config: DashboardConfig | null = null;
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'dashboard_sections.json');
  }

  /**
   * Load dashboard configuration from file
   */
  async loadConfig(): Promise<DashboardConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      return this.config!;
    } catch (error) {
      console.error('[DashboardConfigService] Error loading config:', error);
      throw new Error('Failed to load dashboard configuration');
    }
  }

  /**
   * Get configuration for a specific section
   */
  async getSectionConfig(sectionType: string): Promise<DashboardSectionConfig | null> {
    const config = await this.loadConfig();
    return config.dashboard_sections[sectionType] || null;
  }

  /**
   * Get all section configurations
   */
  async getAllSectionConfigs(): Promise<Record<string, DashboardSectionConfig>> {
    const config = await this.loadConfig();
    return config.dashboard_sections;
  }

  /**
   * Get section categories
   */
  async getSectionCategories(): Promise<Record<string, SectionCategory>> {
    const config = await this.loadConfig();
    return config.section_categories;
  }

  /**
   * Get dashboard layout configuration
   */
  async getLayoutConfig(): Promise<DashboardLayout> {
    const config = await this.loadConfig();
    return config.dashboard_layout;
  }

  /**
   * Get sections by category
   */
  async getSectionsByCategory(category: string): Promise<string[]> {
    const config = await this.loadConfig();
    return Object.entries(config.dashboard_sections)
      .filter(([_, sectionConfig]) => sectionConfig.category === category)
      .map(([sectionType, _]) => sectionType);
  }

  /**
   * Get sections by priority
   */
  async getSectionsByPriority(priority: number): Promise<string[]> {
    const config = await this.loadConfig();
    return Object.entries(config.dashboard_sections)
      .filter(([_, sectionConfig]) => sectionConfig.priority === priority)
      .map(([sectionType, _]) => sectionType);
  }

  /**
   * Get section groups for layout
   */
  async getSectionGroups(): Promise<Array<{ title: string; sections: string[]; priority: number }>> {
    const config = await this.loadConfig();
    return config.dashboard_layout.section_groups.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get grid column configuration
   */
  async getGridColumns(): Promise<{ default: number; mobile: number; tablet: number }> {
    const config = await this.loadConfig();
    return config.dashboard_layout.grid_columns;
  }

  /**
   * Validate section type exists
   */
  async isValidSectionType(sectionType: string): Promise<boolean> {
    const config = await this.loadConfig();
    return sectionType in config.dashboard_sections;
  }

  /**
   * Get all valid section types
   */
  async getAllSectionTypes(): Promise<string[]> {
    const config = await this.loadConfig();
    return Object.keys(config.dashboard_sections);
  }
}
