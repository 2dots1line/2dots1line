/**
 * Simple Star Texture Mapping
 * One entity type = One array of textures
 * Random assignment from the array
 */

export const STAR_TEXTURE_MAPPING = {
  memory_units: ['brightstar1.png', 'brightstar2.png', 'brightstar3.png', 'brightstar4.png'],
  concepts: ['brightstar1.png', 'star5.png', 'star11.png'],
  communities: ['star1.png', 'star3.png', 'star7.png', 'star9.png'],
  derived_artifacts: ['star2.png', 'star4.png', 'star6.png'],
  proactive_prompts: ['star8.png', 'star10.png'],
  growth_events: ['brightstar1.png', 'brightstar2.png', 'star1.png'],
  // Default for unknown types
  default: ['star1.png', 'star2.png']
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
