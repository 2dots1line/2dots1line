/**
 * useCardImage - Hook for managing card image selection and backgrounds
 * V11.0 - Handles image collections and background selection using card_image_library.json
 */

import { useState, useCallback, useMemo } from 'react';
import { DisplayCard, ImageCollection } from '@2dots1line/shared-types';

// Import card image library configuration
import cardImageLibrary from '../../../../../config/card_image_library.json';

// Types for the card image library
interface CardImageLibraryImage {
  id: string;
  filename: string;
  url: string;
  semanticTags?: string[];
  emotions?: string[];
  cardTypes?: string[];
  colorPalette?: string[];
  dominantColor?: string;
  mood?: string;
  energy?: string;
}

interface CardImageLibraryCollection {
  name: string;
  description: string;
  tags: string[];
  images: CardImageLibraryImage[];
}

// Image collections from card_image_library.json
const imageCollections = cardImageLibrary.imageCollections as Record<string, CardImageLibraryCollection>;

// Default image collections converted from card_image_library.json format
const defaultImageCollections: ImageCollection[] = Object.entries(imageCollections).map(([key, collection]) => ({
  name: collection.name,
  source: "Card Image Library",
  images: collection.images.map((img) => img.url)
}));

interface ImageMetadata {
  filename: string;
  url: string;
  tags: string[];
  category: string;
  semantic_score?: number;
  emotions?: string[];
  cardTypes?: string[];
  mood?: string;
  energy?: string;
  dominantColor?: string;
}

// Generate image metadata from card_image_library.json
function generateImageMetadata(): ImageMetadata[] {
  const metadata: ImageMetadata[] = [];
  
  Object.entries(imageCollections).forEach(([categoryKey, collection]) => {
    collection.images.forEach((image) => {
      metadata.push({
        filename: image.filename,
        url: image.url,
        tags: image.semanticTags || [],
        category: categoryKey,
        emotions: image.emotions || [],
        cardTypes: image.cardTypes || [],
        mood: image.mood,
        energy: image.energy,
        dominantColor: image.dominantColor,
        semantic_score: 0
      });
    });
  });
  
  return metadata;
}

// Calculate semantic similarity between card and image
function calculateSemanticSimilarity(card: DisplayCard, image: ImageMetadata): number {
  let score = 0;
  
  // Base similarity from card type
  if (image.cardTypes && image.cardTypes.includes(card.type)) {
    score += 0.4;
  }
  
  // Semantic matching from card content
  const cardText = [
    card.title,
    card.subtitle,
    card.description,
    card.type,
    card.source_entity_type
  ].filter(Boolean).join(' ').toLowerCase();
  
  // Check semantic tags
  if (image.tags) {
    const matchingTags = image.tags.filter(tag => 
      cardText.includes(tag.toLowerCase())
    );
    score += matchingTags.length * 0.1;
  }
  
  // Check emotions
  if (image.emotions) {
    const matchingEmotions = image.emotions.filter(emotion => 
      cardText.includes(emotion.toLowerCase())
    );
    score += matchingEmotions.length * 0.15;
  }
  
  // Status-based scoring
  if (card.status === 'active_canvas' && image.energy === 'high') {
    score += 0.2;
  } else if (card.status === 'archived' && image.mood === 'calm') {
    score += 0.1;
  }
  
  // Favorited cards get more vibrant images
  if (card.is_favorited && (image.energy === 'high' || image.mood === 'joyful')) {
    score += 0.15;
  }
  
  return Math.min(score, 1.0);
}

// Get fallback image from card_image_library.json
function getFallbackImage(): string {
  // Instead of trying to load missing files, return a CSS gradient
  // This eliminates 404 errors and provides a clean fallback
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

// Get a gradient based on card type
function getCardTypeGradient(cardType: string): string {
  const gradients = {
    memory_unit: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    concept: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    derived_artifact: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    proactive_prompt: 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)',
    reflection: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    insight: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    goal: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    habit: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  
  return gradients[cardType as keyof typeof gradients] || gradients.default;
}

// Main hook for card image selection
export function useCardImage(card: DisplayCard) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  
  // Generate image metadata
  const imageMetadata = useMemo(() => generateImageMetadata(), []);
  
  // Get the best matching image for the card
  const bestMatchingImage = useMemo(() => {
    if (!card) return getFallbackImage();
    
    // If card has a background_image_url, use it
    if (card.background_image_url) {
      return card.background_image_url;
    }
    
    // Use card type-specific gradient instead of trying to load missing images
    return getCardTypeGradient(card.type);
  }, [card]);
  
  // Get suggested images for background selection
  const suggestedImages = useMemo(() => {
    if (!card) return [];
    
    // Get top 6 matching images
    const scoredImages = imageMetadata.map(image => ({
      ...image,
      semantic_score: calculateSemanticSimilarity(card, image)
    }));
    
    scoredImages.sort((a, b) => (b.semantic_score || 0) - (a.semantic_score || 0));
    
    return scoredImages.slice(0, 6).map(image => ({
      url: image.url,
      category: image.category,
      mood: image.mood,
      tags: image.tags
    }));
  }, [card, imageMetadata]);
  
  // Change background image
  const changeBackgroundImage = useCallback((imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  }, []);
  
  // Reset to default
  const resetToDefault = useCallback(() => {
    setSelectedImageUrl(null);
  }, []);
  
  // Get collection for card type
  const getCollectionForCardType = useCallback((cardType: string) => {
    const mappings = cardImageLibrary.semanticMappings.cardTypeToCollections;
    const relevantCollections = mappings[cardType as keyof typeof mappings] || ['minimalist'];
    
    return relevantCollections.map((collectionKey: string) => 
      imageCollections[collectionKey as keyof typeof imageCollections]
    ).filter(Boolean);
  }, []);
  
  // Get images by mood
  const getImagesByMood = useCallback((mood: string) => {
    const moodMappings = cardImageLibrary.semanticMappings.moodToImages;
    const imageIds = moodMappings[mood as keyof typeof moodMappings] || [];
    
    return imageIds.map((imageId: string) => {
      // Find the image in collections
      for (const [categoryKey, collection] of Object.entries(imageCollections)) {
        const image = collection.images.find((img) => img.id === imageId);
        if (image) {
          return {
            url: image.url,
            category: categoryKey,
            mood: image.mood,
            tags: image.semanticTags || []
          };
        }
      }
      return null;
    }).filter(Boolean);
  }, []);
  
  return {
    imageUrl: selectedImageUrl || bestMatchingImage,
    suggestedImages,
    changeBackgroundImage,
    resetToDefault,
    getCollectionForCardType,
    getImagesByMood,
    defaultImageCollections,
    isUsingCustomImage: !!selectedImageUrl
  };
}

// Utility function to get card title
export function getCardTitle(card: DisplayCard): string {
  return (typeof card.title === 'string' ? card.title : '') || 
         (typeof card.display_data?.title === 'string' ? card.display_data.title : '') || 
          (typeof card.type === 'string' ? card.type.replace(/_/g, ' ') : '') ||
         'Card';
}

// Utility function to get card subtitle
export function getCardSubtitle(card: DisplayCard): string {
  return (typeof card.subtitle === 'string' ? card.subtitle : '') || 
         (typeof card.display_data?.subtitle === 'string' ? card.display_data.subtitle : '') || 
         (typeof card.source_entity_type === 'string' ? card.source_entity_type.replace(/_/g, ' ') : '') || 
         'Subtitle';
}

// Utility function to get card description
export function getCardDescription(card: DisplayCard): string {
  return (typeof card.description === 'string' ? card.description : '') || 
         (typeof card.display_data?.description === 'string' ? card.display_data.description : '') || 
         (typeof card.display_data?.preview === 'string' ? card.display_data.preview : '') || 
         'No description available';
}

// Hook for managing image collections
export function useImageCollections(customCollections?: ImageCollection[]) {
  const [activeCollectionIndex, setActiveCollectionIndex] = useState(0);
  
  const collections = customCollections || defaultImageCollections;
  
  const activeCollection = collections[activeCollectionIndex] || collections[0];
  
  const switchCollection = useCallback((index: number) => {
    if (index >= 0 && index < collections.length) {
      setActiveCollectionIndex(index);
    }
  }, [collections.length]);
  
  const nextCollection = useCallback(() => {
    setActiveCollectionIndex((prev) => (prev + 1) % collections.length);
  }, [collections.length]);
  
  const prevCollection = useCallback(() => {
    setActiveCollectionIndex((prev) => (prev - 1 + collections.length) % collections.length);
  }, [collections.length]);
  
  return {
    collections,
    activeCollection,
    activeCollectionIndex,
    switchCollection,
    nextCollection,
    prevCollection
  };
} 