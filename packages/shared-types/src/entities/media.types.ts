/**
 * Types related to Media items.
 */

/**
 * Represents a media item (image, audio, video, document) associated with a User or MemoryUnit.
 * Aligns with the `media` table in schema.prisma.
 */
export interface TMedia {
  /** Unique identifier for the media item (UUID) */
  media_id: string;
  /** ID of the user who owns this media item */
  user_id: string;
  /** Optional: ID of the MemoryUnit this media is primarily associated with */
  muid?: string | null;
  /** Type of media (e.g., 'image', 'audio', 'video', 'document') */
  media_type: EMediaType;
  /** Original filename of the media */
  filename: string;
  /** MIME type of the media (e.g., 'image/jpeg', 'application/pdf') */
  mime_type: string;
  /** Size of the media file in bytes */
  size_bytes: number;
  /** Storage path or URL of the media file */
  storage_path: string;
  /** Status of media processing (e.g., 'uploaded', 'processing', 'processed', 'error') */
  processing_status?: string | null;
  /** Extracted text content from the media (e.g., OCR for images, transcript for audio) */
  extracted_text?: string | null;
  /** Optional: Unique ID for the vector embedding of the media or its content in Weaviate */
  embedding_id?: string | null;
  /** Timestamp when the media item was created/uploaded */
  created_at: Date;
  /** Additional metadata (JSON object, e.g., image dimensions, audio duration) */
  metadata?: Record<string, any> | null;
}

/**
 * Enum for common media types.
 */
export enum EMediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  OTHER = 'other'
} 