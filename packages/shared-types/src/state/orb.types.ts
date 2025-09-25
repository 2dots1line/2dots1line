// orb.types.ts - Type definitions for orb state management

// This file will contain orb-related types once they are defined
// TODO: Define orb state types

export {}; // Empty export to make this a module

// Basic Orb entity - this should eventually be moved to entities/
export interface Orb {
  orb_id: string;
  user_id: string;
  name: string;
  description?: string | null;
  metadata?: unknown; // JSON
  created_at: Date;
  updated_at?: Date | null;
}

// Basic DerivedArtifact - this should eventually be moved to entities/
export interface DerivedArtifact {
  entity_id: string;
  user_id: string;
  type: string;
  title?: string | null;
  content_summary?: string | null;
  insight_content?: unknown; // JSON
  metadata?: unknown; // JSON
  created_at: Date;
}

// Basic Orb structure for the store - can be augmented with linked items later
export interface OrbData extends Orb {
  // Optionally include counts or summaries if frequently needed with selected orb
  memoryUnitCount?: number;
  conceptCount?: number;
  artifactCount?: number;
  // Actual items can be fetched on demand or stored if small enough & frequently accessed
  // memoryUnits?: TMemoryUnit[]; 
  // concepts?: TConcept[];
  // artifacts?: DerivedArtifact[];
}

export interface OrbState {
  orbs: Record<string, OrbData>; // Orbs indexed by their ID
  selectedOrbId: string | null;
  isLoadingOrbs: boolean;
  isLoadingSelectedOrbDetails: boolean; // For loading details of a selected orb
  error: string | null;
  // Could include filters, sort order for orb list display, etc.
}

export interface OrbActions {
  // Basic CRUD for local state - API calls will be separate
  addOrb: (orb: OrbData) => void;
  setOrbs: (orbs: OrbData[]) => void;
  updateOrb: (orbId: string, updates: Partial<OrbData>) => void;
  removeOrb: (orbId: string) => void;
  
  selectOrb: (orbId: string | null) => void;
  
  // Actions that might trigger API calls (implementations in store will handle actual calls)
  createOrb: (name: string, description?: string) => Promise<OrbData | null>; // Returns created orb or null on error
  fetchOrbs: (userId: string) => Promise<void>;
  fetchOrbDetails: (orbId: string) => Promise<void>; // To load associated entities for a selected orb
  updateOrbNameAndDescription: (orbId: string, name: string, description?: string) => Promise<OrbData | null>;
  deleteOrb: (orbId: string) => Promise<boolean>; // Returns true on success

  // Loading and error states
  setLoadingOrbs: (isLoading: boolean) => void;
  setLoadingSelectedOrbDetails: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type OrbStore = OrbState & OrbActions; 