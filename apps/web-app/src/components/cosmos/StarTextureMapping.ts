/**
 * Simple Star Texture Mapping
 * One entity type = One array of textures
 * Random assignment from the array
 */

export const STAR_TEXTURE_MAPPING: Record<string, string[]> = {
  memory_units: ['brightstar1.png', 'brightstar2.png', 'brightstar3.png', 'brightstar4.png', 'star1.png', 'star3.png', 'star5.png'],
  concepts: ['brightstar1.png', 'brightstar2.png', 'star5.png', 'star11.png', 'star2.png', 'star7.png'],
  communities: ['brightstar3.png', 'brightstar4.png', 'star1.png', 'star3.png', 'star7.png', 'star9.png', 'star4.png'],
  derived_artifacts: ['brightstar1.png', 'brightstar2.png', 'star2.png', 'star4.png', 'star6.png', 'star8.png'],
  proactive_prompts: ['brightstar3.png', 'brightstar4.png', 'star8.png', 'star10.png', 'star1.png', 'star6.png'],
  growth_events: ['brightstar1.png', 'brightstar2.png', 'brightstar3.png', 'star1.png', 'star3.png', 'star5.png'],
  // Default for unknown types
  default: ['brightstar1.png', 'star1.png', 'star2.png', 'star3.png']
};

/**
 * Get random texture for entity type
 * @param entityType - The entity type (e.g., 'memory_units', 'concepts')
 * @returns Full path to a random texture from the entity's texture pool
 */
export const getStarTexture = (entityType: string): string => {
  const texturePool = STAR_TEXTURE_MAPPING[entityType] || STAR_TEXTURE_MAPPING.default;
  const randomIndex = Math.floor(Math.random() * texturePool.length);
  return `/textures/${texturePool[randomIndex]}`;
};
