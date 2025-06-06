/**
 * Unit tests for Enhanced NER Tool
 * Testing growth-oriented concept extraction and entity classification
 */

import { EnhancedNER, EntityType, NERResult } from './ner';

describe('EnhancedNER', () => {
  describe('Core Entity Extraction', () => {
    test('should extract person names', () => {
      const text = "I met John Smith and Sarah Johnson at the conference.";
      const result = EnhancedNER.extractEntities(text);
      
      const personEntities = result.conceptEntities.filter(e => e.type === EntityType.PERSON);
      expect(personEntities).toHaveLength(2);
      expect(personEntities[0].text).toBe('John Smith');
      expect(personEntities[1].text).toBe('Sarah Johnson');
    });

    test('should extract organizations', () => {
      const text = "I work at Google Inc and previously at Microsoft Corporation.";
      const result = EnhancedNER.extractEntities(text);
      
      const orgEntities = result.conceptEntities.filter(e => e.type === EntityType.ORGANIZATION);
      expect(orgEntities.length).toBeGreaterThan(0);
      expect(orgEntities.some(e => e.text.includes('Google'))).toBe(true);
    });

    test('should extract locations', () => {
      const text = "I lived in San Francisco, CA and visited New York, NY.";
      const result = EnhancedNER.extractEntities(text);
      
      const locationEntities = result.conceptEntities.filter(e => e.type === EntityType.LOCATION);
      expect(locationEntities.length).toBeGreaterThan(0);
    });

    test('should extract dates', () => {
      const text = "The meeting is on January 15, 2024 and the deadline is 12/31/2023.";
      const result = EnhancedNER.extractEntities(text);
      
      const dateEntities = result.conceptEntities.filter(e => e.type === EntityType.DATE);
      expect(dateEntities).toHaveLength(2);
    });
  });

  describe('Growth-Oriented Concept Extraction', () => {
    test('should extract emotions', () => {
      const text = "I felt really happy and excited about the opportunity, but also anxious about the challenges.";
      const result = EnhancedNER.extractEntities(text);
      
      const emotionEntities = result.conceptEntities.filter(e => e.type === EntityType.EMOTION);
      expect(emotionEntities.length).toBeGreaterThanOrEqual(3);
      
      const emotionTexts = emotionEntities.map(e => e.text);
      expect(emotionTexts).toContain('happy');
      expect(emotionTexts).toContain('excited');
      expect(emotionTexts).toContain('anxious');
    });

    test('should extract values', () => {
      const text = "Honesty and integrity are important to me. I value creativity and kindness in relationships.";
      const result = EnhancedNER.extractEntities(text);
      
      const valueEntities = result.conceptEntities.filter(e => e.type === EntityType.VALUE);
      expect(valueEntities.length).toBeGreaterThanOrEqual(4);
      
      const valueTexts = valueEntities.map(e => e.text);
      expect(valueTexts).toContain('honesty');
      expect(valueTexts).toContain('integrity');
      expect(valueTexts).toContain('creativity');
      expect(valueTexts).toContain('kindness');
    });

    test('should extract goals from patterns', () => {
      const text = "I want to learn programming and my goal is to become a better leader. I'm working towards financial independence.";
      const result = EnhancedNER.extractEntities(text);
      
      const goalEntities = result.conceptEntities.filter(e => e.type === EntityType.GOAL);
      expect(goalEntities.length).toBeGreaterThanOrEqual(3);
      
      const goalTexts = goalEntities.map(e => e.text);
      expect(goalTexts.some(text => text.includes('learn programming'))).toBe(true);
      expect(goalTexts.some(text => text.includes('become a better leader'))).toBe(true);
      expect(goalTexts.some(text => text.includes('financial independence'))).toBe(true);
    });

    test('should extract skills from patterns', () => {
      const text = "I'm learning to code and practicing piano. I'm improving at public speaking.";
      const result = EnhancedNER.extractEntities(text);
      
      const skillEntities = result.conceptEntities.filter(e => e.type === EntityType.SKILL);
      expect(skillEntities.length).toBeGreaterThanOrEqual(3);
      
      const skillTexts = skillEntities.map(e => e.text);
      expect(skillTexts.some(text => text.includes('code'))).toBe(true);
      expect(skillTexts.some(text => text.includes('piano'))).toBe(true);
      expect(skillTexts.some(text => text.includes('public speaking'))).toBe(true);
    });

    test('should extract struggles from patterns', () => {
      const text = "I'm struggling with time management and having trouble staying focused. I can't seem to maintain work-life balance.";
      const result = EnhancedNER.extractEntities(text);
      
      const struggleEntities = result.conceptEntities.filter(e => e.type === EntityType.STRUGGLE);
      expect(struggleEntities.length).toBeGreaterThanOrEqual(3);
      
      const struggleTexts = struggleEntities.map(e => e.text);
      expect(struggleTexts.some(text => text.includes('time management'))).toBe(true);
      expect(struggleTexts.some(text => text.includes('staying focused'))).toBe(true);
      expect(struggleTexts.some(text => text.includes('maintain work-life balance'))).toBe(true);
    });
  });

  describe('Metadata Entity Extraction', () => {
    test('should extract emails as metadata entities', () => {
      const text = "Contact me at john@example.com or sarah.smith@company.org for more info.";
      const result = EnhancedNER.extractEntities(text);
      
      const emailEntities = result.metadataEntities.filter(e => e.type === EntityType.EMAIL);
      expect(emailEntities).toHaveLength(2);
      expect(emailEntities[0].text).toBe('john@example.com');
      expect(emailEntities[1].text).toBe('sarah.smith@company.org');
    });

    test('should extract phone numbers as metadata entities', () => {
      const text = "Call me at (555) 123-4567 or 555.987.6543.";
      const result = EnhancedNER.extractEntities(text);
      
      const phoneEntities = result.metadataEntities.filter(e => e.type === EntityType.PHONE);
      expect(phoneEntities).toHaveLength(2);
    });

    test('should extract URLs as metadata entities', () => {
      const text = "Check out https://example.com and http://test.org/path for more details.";
      const result = EnhancedNER.extractEntities(text);
      
      const urlEntities = result.metadataEntities.filter(e => e.type === EntityType.URL);
      expect(urlEntities).toHaveLength(2);
      expect(urlEntities[0].text).toBe('https://example.com');
      expect(urlEntities[1].text).toBe('http://test.org/path');
    });
  });

  describe('Entity Classification', () => {
    test('should properly separate concept entities from metadata entities', () => {
      const text = "I'm happy to meet John Smith at john@example.com. I want to learn programming and improve my skills.";
      const result = EnhancedNER.extractEntities(text);
      
      // Concept entities should include person, emotion, goal, skill
      expect(result.conceptEntities.length).toBeGreaterThan(0);
      expect(result.conceptEntities.some(e => e.type === EntityType.PERSON)).toBe(true);
      expect(result.conceptEntities.some(e => e.type === EntityType.EMOTION)).toBe(true);
      expect(result.conceptEntities.some(e => e.type === EntityType.GOAL)).toBe(true);
      
      // Metadata entities should include email
      expect(result.metadataEntities.length).toBeGreaterThan(0);
      expect(result.metadataEntities.some(e => e.type === EntityType.EMAIL)).toBe(true);
      
      // No overlap between concept and metadata entities
      const conceptTexts = result.conceptEntities.map(e => e.text);
      const metadataTexts = result.metadataEntities.map(e => e.text);
      const overlap = conceptTexts.filter(text => metadataTexts.includes(text));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Deduplication and Confidence', () => {
    test('should deduplicate overlapping entities', () => {
      const text = "John Smith is a great person.";
      const result = EnhancedNER.extractEntities(text);
      
      // Should not have duplicate entities for the same text span
      const entities = result.entities;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const overlap = !(entities[i].end <= entities[j].start || entities[j].end <= entities[i].start);
          if (overlap) {
            // If there's overlap, they should be different confidence levels or types
            expect(entities[i].confidence !== entities[j].confidence || entities[i].type !== entities[j].type).toBe(true);
          }
        }
      }
    });

    test('should include confidence scores for all entities', () => {
      const text = "I'm happy to learn programming from John Smith at john@example.com.";
      const result = EnhancedNER.extractEntities(text);
      
      result.entities.forEach(entity => {
        expect(entity.confidence).toBeGreaterThan(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should include context for entities', () => {
      const text = "I'm really excited about learning to code because it opens up new opportunities.";
      const result = EnhancedNER.extractEntities(text);
      
      result.entities.forEach(entity => {
        expect(entity.context).toBeDefined();
        expect(entity.context!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Metrics', () => {
    test('should return processing time', () => {
      const text = "This is a test with John Smith, happy emotions, and learning goals.";
      const result = EnhancedNER.extractEntities(text);
      
      expect(result.processingTime).toBeGreaterThan(0);
      expect(typeof result.processingTime).toBe('number');
    });

    test('should return total entity count', () => {
      const text = "I'm happy to meet John Smith. I want to learn programming.";
      const result = EnhancedNER.extractEntities(text);
      
      expect(result.totalEntities).toBe(result.entities.length);
      expect(result.totalEntities).toBeGreaterThan(0);
    });
  });

  describe('Real-world Growth Scenarios', () => {
    test('should extract comprehensive entities from personal growth journal entry', () => {
      const text = `
        Today I felt really proud of myself for completing my first coding project. 
        I've been learning to program for three months now, and it's been challenging. 
        I was struggling with debugging at first, but my mentor Sarah Johnson helped me understand the process. 
        My goal is to become a software developer and eventually work at a tech company like Google. 
        I value persistence and creativity in this journey. 
        Contact me at learner@email.com if you want to connect.
      `;
      
      const result = EnhancedNER.extractEntities(text);
      
      // Should extract emotions
      const emotions = result.conceptEntities.filter(e => e.type === EntityType.EMOTION);
      expect(emotions.some(e => e.text === 'proud')).toBe(true);
      
      // Should extract skills
      const skills = result.conceptEntities.filter(e => e.type === EntityType.SKILL);
      expect(skills.some(e => e.text.includes('program'))).toBe(true);
      
      // Should extract struggles
      const struggles = result.conceptEntities.filter(e => e.type === EntityType.STRUGGLE);
      expect(struggles.some(e => e.text.includes('debugging'))).toBe(true);
      
      // Should extract goals
      const goals = result.conceptEntities.filter(e => e.type === EntityType.GOAL);
      expect(goals.some(e => e.text.includes('software developer'))).toBe(true);
      
      // Should extract values
      const values = result.conceptEntities.filter(e => e.type === EntityType.VALUE);
      expect(values.some(e => e.text === 'persistence')).toBe(true);
      expect(values.some(e => e.text === 'creativity')).toBe(true);
      
      // Should extract person
      const persons = result.conceptEntities.filter(e => e.type === EntityType.PERSON);
      expect(persons.some(e => e.text === 'Sarah Johnson')).toBe(true);
      
      // Should extract organization
      const orgs = result.conceptEntities.filter(e => e.type === EntityType.ORGANIZATION);
      expect(orgs.some(e => e.text.includes('Google'))).toBe(true);
      
      // Should extract email as metadata
      const emails = result.metadataEntities.filter(e => e.type === EntityType.EMAIL);
      expect(emails.some(e => e.text === 'learner@email.com')).toBe(true);
      
      // Verify separation
      expect(result.conceptEntities.length).toBeGreaterThan(result.metadataEntities.length);
    });
  });
}); 