/**
 * Component exports
 * This file will export all UI components
 */

// Placeholder until components are implemented
export const COMPONENTS_PLACEHOLDER = true;

// Base UI Components
export { default as Button } from './Button';
export { default as InputField } from './InputField';
export { default as ErrorMessage } from './ErrorMessage';

// Glass Components
export { default as GlassButton } from './GlassButton';
export { default as GlassmorphicPanel } from './GlassmorphicPanel';

// HUD Components
export { default as DragHandle } from './DragHandle';
export { default as MinimizeToggle } from './MinimizeToggle';

// New components for markdown rendering and file handling
export { default as MarkdownRenderer } from './markdown/MarkdownRenderer';
export type { MarkdownRendererProps } from './markdown/MarkdownRenderer';

export { default as FileAttachment } from './FileAttachment';
export type { FileAttachmentProps } from './FileAttachment';

export { default as VoiceRecordingIndicator } from './VoiceRecordingIndicator';

// Card Components
export { CardTile } from './cards/CardTile';
export type { CardSize } from './cards/CardTile';
export { InfiniteCardCanvas } from './cards/InfiniteCardCanvas';

// Mobile Components
export * from './mobile';

// Page Components
export * from './pages';

// Add other component exports here 