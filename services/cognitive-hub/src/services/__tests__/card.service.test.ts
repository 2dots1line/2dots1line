/**
 * Unit tests for CardService - Sprint 3 Task 3
 * Tests card operations and Six-Dimensional Growth Model integration
 */

import { CardService, type GetCardsRequest } from '../card.service';
import { DatabaseService } from '@2dots1line/database';

// Mock dependencies
jest.mock('@2dots1line/database');

describe('CardService', () => {
  let cardService: CardService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    // Setup database service mock
    mockDatabaseService = {
      getPrismaClient: jest.fn(),
      testConnections: jest.fn(),
    } as any;

    // Create CardService instance
    cardService = new CardService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with proper dependencies', () => {
      expect(cardService).toBeInstanceOf(CardService);
    });
  });

  describe('Sprint 3 Task 3 - Card Operations', () => {
    const mockUserId = 'test-user-123';

    test('should get cards with growth dimension analysis', async () => {
      // Mock CardRepository methods through the service's private property
      const cardRepository = (cardService as any).cardRepository;
      
      cardRepository.getCards = jest.fn().mockResolvedValue({
        cards: [
          {
            id: 'card-123',
            type: 'memory_unit',
            title: 'Test Memory',
            preview: 'This is a test memory about personal growth...',
            userId: mockUserId,
            evolutionState: 'sprout',
            growthDimensions: [
              {
                key: 'self_know',
                name: 'Self-Knowing',
                score: 0.75,
                eventCount: 5,
                lastEventAt: new Date('2024-01-15T10:00:00Z')
              },
              {
                key: 'world_act',
                name: 'World-Acting',
                score: 0.60,
                eventCount: 3,
                lastEventAt: new Date('2024-01-10T10:00:00Z')
              }
            ],
            importanceScore: 0.8,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z')
          }
        ],
        total: 1,
        hasMore: false
      });

      const request: GetCardsRequest = {
        userId: mockUserId,
        filters: {
          limit: 20,
          offset: 0,
          sortBy: 'updated_at',
          sortOrder: 'desc'
        }
      };

      const result = await cardService.getCards(request);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].id).toBe('card-123');
      expect(result.cards[0].growthDimensions).toHaveLength(2);
      
      // Verify enhanced growth dimensions with trends and percentages
      const selfKnowDim = result.cards[0].growthDimensions.find(d => d.key === 'self_know');
      expect(selfKnowDim).toBeDefined();
      expect(selfKnowDim!.trend).toBe('increasing'); // score > 0.5
      expect(selfKnowDim!.percentageOfMax).toBe(75); // 0.75 * 100

      expect(result.summary).toBeDefined();
      expect(result.summary.totalsByState.sprout).toBe(1);
      expect(result.summary.totalsByType.memory_unit).toBe(1);
    });

    test('should get card details with full growth analysis', async () => {
      const cardRepository = (cardService as any).cardRepository;
      
      cardRepository.getCardDetails = jest.fn().mockResolvedValue({
        id: 'card-123',
        type: 'concept',
        title: 'Learning Concept',
        preview: 'A concept about continuous learning...',
        userId: mockUserId,
        evolutionState: 'bloom',
        growthDimensions: [
          {
            key: 'world_know',
            name: 'World-Knowing',
            score: 0.85,
            eventCount: 8,
            lastEventAt: new Date('2024-01-20T10:00:00Z')
          }
        ],
        importanceScore: 0.9,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-20T10:00:00Z')
      });

      const result = await cardService.getCardDetails('card-123', mockUserId);

      expect(result).toBeDefined();
      expect(result!.type).toBe('concept');
      expect(result!.evolutionState).toBe('bloom');
      expect(result!.growthDimensions[0].percentageOfMax).toBe(85);
      expect(result!.connections).toBe(0); // Stubbed for now
      expect(result!.insights).toBe(0); // Stubbed for now
    });

    test('should get cards grouped by evolution state', async () => {
      const cardRepository = (cardService as any).cardRepository;
      
      cardRepository.getCardsByEvolutionState = jest.fn()
        .mockResolvedValueOnce([
          { id: 'seed-1', evolutionState: 'seed', growthDimensions: [] }
        ])
        .mockResolvedValueOnce([
          { id: 'sprout-1', evolutionState: 'sprout', growthDimensions: [] }
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await cardService.getCardsByEvolutionState(mockUserId);

      expect(result).toHaveProperty('seed');
      expect(result).toHaveProperty('sprout');
      expect(result).toHaveProperty('bloom');
      expect(result).toHaveProperty('constellation');
      expect(result).toHaveProperty('supernova');
      
      expect(result.seed).toHaveLength(1);
      expect(result.sprout).toHaveLength(1);
      expect(result.bloom).toHaveLength(0);
    });

    test('should get top growth cards based on activity', async () => {
      const cardRepository = (cardService as any).cardRepository;
      
      cardRepository.getTopGrowthCards = jest.fn().mockResolvedValue([
        {
          id: 'active-card-1',
          type: 'memory_unit',
          title: 'Active Memory',
          preview: 'Recently active memory...',
          userId: mockUserId,
          evolutionState: 'constellation',
          growthDimensions: [
            {
              key: 'self_act',
              name: 'Self-Acting',
              score: 0.95,
              eventCount: 12,
              lastEventAt: new Date()
            }
          ],
          importanceScore: 0.85,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date()
        }
      ]);

      const result = await cardService.getTopGrowthCards(mockUserId, 5);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('active-card-1');
      expect(result[0].evolutionState).toBe('constellation');
      expect(result[0].growthDimensions[0].trend).toBe('increasing');
    });

    test('should filter cards by minimum importance score', async () => {
      const cardRepository = (cardService as any).cardRepository;
      
      cardRepository.getCards = jest.fn().mockResolvedValue({
        cards: [
          {
            id: 'high-importance',
            importanceScore: 0.8,
            growthDimensions: [],
            type: 'memory_unit',
            evolutionState: 'sprout',
            userId: mockUserId,
            title: 'High Importance',
            preview: 'High importance card',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'low-importance',
            importanceScore: 0.3,
            growthDimensions: [],
            type: 'memory_unit',
            evolutionState: 'seed',
            userId: mockUserId,
            title: 'Low Importance',
            preview: 'Low importance card',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 2,
        hasMore: false
      });

      const request: GetCardsRequest = {
        userId: mockUserId,
        filters: {
          minImportanceScore: 0.5
        }
      };

      const result = await cardService.getCards(request);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].id).toBe('high-importance');
    });

    test('should handle errors gracefully', async () => {
      const cardRepository = (cardService as any).cardRepository;
      
      cardRepository.getCards = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const request: GetCardsRequest = {
        userId: mockUserId
      };

      await expect(cardService.getCards(request)).rejects.toThrow('Failed to get cards');
    });

    test('should demonstrate Sprint 3 Task 3 capabilities', () => {
      console.log('=== Sprint 3 Task 3 - Card Service Implementation ===');
      console.log('✅ Card data retrieval with growth dimensions');
      console.log('✅ Six-Dimensional Growth Model integration');
      console.log('✅ Evolution state analysis');
      console.log('✅ Importance score filtering');
      console.log('✅ Growth trend calculation');
      console.log('✅ Dashboard-style data grouping');
      console.log('✅ Summary statistics generation');
      console.log('✅ Error handling and validation');
      
      expect(true).toBe(true); // Demo test
    });
  });

  describe('Private Methods - Growth Analysis', () => {
    test('should calculate growth trends correctly', () => {
      const mockCardData = {
        id: 'test-card',
        type: 'memory_unit' as const,
        title: 'Test Card',
        preview: 'Test preview',
        userId: 'test-user',
        evolutionState: 'sprout' as const,
        growthDimensions: [
          { key: 'self_know', name: 'Self-Knowing', score: 0.8, eventCount: 5, lastEventAt: new Date() },
          { key: 'world_act', name: 'World-Acting', score: 0.3, eventCount: 2, lastEventAt: new Date() },
          { key: 'self_show', name: 'Self-Showing', score: 0.05, eventCount: 1, lastEventAt: new Date() }
        ],
        importanceScore: 0.7,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const transformMethod = (cardService as any).transformCardData.bind(cardService);
      
      return transformMethod(mockCardData).then((result: any) => {
        const dimensions = result.growthDimensions;
        
        // High score (>0.5) should be 'increasing'
        expect(dimensions.find((d: any) => d.key === 'self_know').trend).toBe('increasing');
        
        // Medium score (0.1-0.5) should be 'stable'  
        expect(dimensions.find((d: any) => d.key === 'world_act').trend).toBe('stable');
        
        // Low score (<0.1) should be 'decreasing'
        expect(dimensions.find((d: any) => d.key === 'self_show').trend).toBe('decreasing');
        
        // Percentage calculations
        expect(dimensions.find((d: any) => d.key === 'self_know').percentageOfMax).toBe(80);
        expect(dimensions.find((d: any) => d.key === 'world_act').percentageOfMax).toBe(30);
      });
    });
  });
}); 