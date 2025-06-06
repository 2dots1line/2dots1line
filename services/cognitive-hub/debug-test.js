const fs = require('fs');
const path = require('path');

// Load configurations
const nerRulesPath = path.join(__dirname, 'config', 'ner_rules.json');
const growthModelPath = path.join(__dirname, 'config', 'growth_model_rules.json');

console.log('=== Configuration Loading Test ===');
console.log('NER Rules path:', nerRulesPath);
console.log('Growth Model path:', growthModelPath);

try {
  const nerRules = JSON.parse(fs.readFileSync(nerRulesPath, 'utf8'));
  const growthModel = JSON.parse(fs.readFileSync(growthModelPath, 'utf8'));
  
  console.log('✅ NER Rules loaded:', {
    strategic_entity_types: nerRules.strategic_entity_types?.length || 0,
    metadata_entity_types: nerRules.metadata_entity_types?.length || 0
  });
  
  console.log('✅ Growth Model loaded:', {
    dimensions: Object.keys(growthModel.dimensions || {}).length
  });
  
  // Test pattern matching for self_know dimension
  const testText = "I feel passionate about teaching others. I researched new methods and presented them at a conference. This helped me understand my purpose better.";
  const textLower = testText.toLowerCase();
  
  console.log('\\n=== Pattern Matching Test ===');
  console.log('Test text:', testText);
  console.log('Text (lowercase):', textLower);
  
  if (growthModel.dimensions?.self_know) {
    const selfKnowRules = growthModel.dimensions.self_know.activation_rules;
    console.log('\\nSelf-Know dimension rules:');
    console.log('- Emotion keywords:', selfKnowRules.emotion_keywords);
    console.log('- Reflection patterns:', selfKnowRules.reflection_patterns);
    console.log('- Base delta:', selfKnowRules.base_delta);
    
    let score = 0;
    let matchCount = 0;
    const matches = [];
    
    // Test emotion keywords
    console.log('\\nEmotion keyword matches:');
    const emotionMatches = selfKnowRules.emotion_keywords?.filter(keyword => {
      const matches = textLower.includes(keyword.toLowerCase());
      console.log(`  "${keyword}" -> ${matches ? 'MATCH' : 'no match'}`);
      return matches;
    }) || [];
    
    if (emotionMatches.length > 0) {
      score += emotionMatches.length * 0.3;
      matchCount++;
      matches.push(`emotions: ${emotionMatches.join(', ')}`);
    }
    
    // Test reflection patterns
    console.log('\\nReflection pattern matches:');
    const reflectionMatches = selfKnowRules.reflection_patterns?.filter(pattern => {
      const matches = textLower.includes(pattern.toLowerCase());
      console.log(`  "${pattern}" -> ${matches ? 'MATCH' : 'no match'}`);
      return matches;
    }) || [];
    
    if (reflectionMatches.length > 0) {
      score += reflectionMatches.length * 0.4;
      matchCount++;
      matches.push(`reflections: ${reflectionMatches.join(', ')}`);
    }
    
    console.log('\\n=== Self-Know Scoring Analysis ===');
    console.log('Total score:', score);
    console.log('Match count:', matchCount);
    console.log('Threshold:', 0.5);
    console.log('Matches found:', matches.join('; '));
    console.log('Would activate?', score > 0.5 && matchCount > 0 ? 'YES' : 'NO');
    
    if (score > 0.5 && matchCount > 0) {
      const delta = selfKnowRules.base_delta * Math.min(score, 2.0);
      console.log('Calculated delta:', delta);
    }
  }
  
} catch (error) {
  console.error('❌ Configuration loading failed:', error.message);
} 