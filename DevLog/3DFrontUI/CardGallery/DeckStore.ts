import { create } from 'zustand';
import { Card, Deck, DeckTier } from '../types';

// Helper function to get allowed card levels for a deck tier
const getAllowedCardLevels = (tier: DeckTier): Card['level'][] => {
  switch (tier) {
    case 'starter':
      return ['purple'];
    case 'student':
      return ['purple', 'yellow'];
    case 'scholars':
      return ['purple', 'yellow', 'red'];
    case 'master':
      return ['purple', 'yellow', 'red', 'blue'];
    default:
      return ['purple'];
  }
};

// Sample cards for different categories
const mathCards: Card[] = [
  // Purple cards
  {
    id: 'm1',
    name: 'Basic Math',
    category: 'Mathematics',
    level: 'purple',
    dateEarned: new Date('2024-01-15'),
    prerequisites: [],
    description: 'Mastered basic arithmetic operations',
  },
  {
    id: 'm2',
    name: 'Number Theory Basics',
    category: 'Mathematics',
    level: 'purple',
    dateEarned: new Date('2024-01-20'),
    prerequisites: [],
    description: 'Understanding of prime numbers and factors',
  },
  {
    id: 'm3',
    name: 'Geometry Fundamentals',
    category: 'Mathematics',
    level: 'purple',
    dateEarned: new Date('2024-01-25'),
    prerequisites: [],
    description: 'Mastered basic geometric concepts',
  },
  // Yellow cards
  {
    id: 'm4',
    name: 'Algebra Basics',
    category: 'Mathematics',
    level: 'yellow',
    dateEarned: new Date('2024-02-01'),
    prerequisites: ['m1'],
    description: 'Understanding of basic algebraic concepts',
  },
  {
    id: 'm5',
    name: 'Trigonometry',
    category: 'Mathematics',
    level: 'yellow',
    dateEarned: new Date('2024-02-05'),
    prerequisites: ['m3'],
    description: 'Mastered trigonometric functions',
  },
  {
    id: 'm6',
    name: 'Statistics Basics',
    category: 'Mathematics',
    level: 'yellow',
    dateEarned: new Date('2024-02-10'),
    prerequisites: ['m2'],
    description: 'Understanding of basic statistical concepts',
  },
  // Red cards
  {
    id: 'm7',
    name: 'Calculus Fundamentals',
    category: 'Mathematics',
    level: 'red',
    dateEarned: new Date('2024-03-01'),
    prerequisites: ['m4'],
    description: 'Mastered differential and integral calculus',
  },
  {
    id: 'm8',
    name: 'Linear Algebra',
    category: 'Mathematics',
    level: 'red',
    dateEarned: new Date('2024-03-05'),
    prerequisites: ['m4'],
    description: 'Understanding of vector spaces and matrices',
  },
  {
    id: 'm9',
    name: 'Differential Equations',
    category: 'Mathematics',
    level: 'red',
    dateEarned: new Date('2024-03-10'),
    prerequisites: ['m7'],
    description: 'Mastered solving differential equations',
  },
  // Blue cards
  {
    id: 'm10',
    name: 'Advanced Analysis',
    category: 'Mathematics',
    level: 'blue',
    dateEarned: new Date('2024-04-01'),
    prerequisites: ['m7', 'm8'],
    description: 'Mastered complex mathematical analysis',
  },
  {
    id: 'm11',
    name: 'Topology',
    category: 'Mathematics',
    level: 'blue',
    dateEarned: new Date('2024-04-05'),
    prerequisites: ['m8'],
    description: 'Understanding of advanced geometric concepts',
  },
  {
    id: 'm12',
    name: 'Number Theory Mastery',
    category: 'Mathematics',
    level: 'blue',
    dateEarned: new Date('2024-04-10'),
    prerequisites: ['m2', 'm7'],
    description: 'Expert in advanced number theory',
  },
];

const programmingCards: Card[] = [
  // Purple cards
  {
    id: 'p1',
    name: 'HTML & CSS Basics',
    category: 'Programming',
    level: 'purple',
    dateEarned: new Date('2024-01-10'),
    prerequisites: [],
    description: 'Understanding of web page structure and styling',
  },
  {
    id: 'p2',
    name: 'Git Fundamentals',
    category: 'Programming',
    level: 'purple',
    dateEarned: new Date('2024-01-15'),
    prerequisites: [],
    description: 'Mastered version control basics',
  },
  {
    id: 'p3',
    name: 'Command Line Basics',
    category: 'Programming',
    level: 'purple',
    dateEarned: new Date('2024-01-20'),
    prerequisites: [],
    description: 'Understanding of terminal operations',
  },
  // Yellow cards
  {
    id: 'p4',
    name: 'JavaScript Fundamentals',
    category: 'Programming',
    level: 'yellow',
    dateEarned: new Date('2024-02-15'),
    prerequisites: ['p1'],
    description: 'Mastered JavaScript programming basics',
  },
  {
    id: 'p5',
    name: 'Database Basics',
    category: 'Programming',
    level: 'yellow',
    dateEarned: new Date('2024-02-20'),
    prerequisites: ['p3'],
    description: 'Understanding of SQL and NoSQL databases',
  },
  {
    id: 'p6',
    name: 'API Development',
    category: 'Programming',
    level: 'yellow',
    dateEarned: new Date('2024-02-25'),
    prerequisites: ['p4'],
    description: 'Mastered RESTful API design',
  },
  // Red cards
  {
    id: 'p7',
    name: 'React Development',
    category: 'Programming',
    level: 'red',
    dateEarned: new Date('2024-03-10'),
    prerequisites: ['p4'],
    description: 'Expert in React application development',
  },
  {
    id: 'p8',
    name: 'System Design',
    category: 'Programming',
    level: 'red',
    dateEarned: new Date('2024-03-15'),
    prerequisites: ['p6'],
    description: 'Mastered scalable system architecture',
  },
  {
    id: 'p9',
    name: 'DevOps Practices',
    category: 'Programming',
    level: 'red',
    dateEarned: new Date('2024-03-20'),
    prerequisites: ['p2', 'p5'],
    description: 'Expert in CI/CD and deployment',
  },
  // Add blue cards
  {
    id: 'p10',
    name: 'System Architecture',
    category: 'Programming',
    level: 'blue',
    dateEarned: new Date('2024-04-01'),
    prerequisites: ['p8'],
    description: 'Mastered complex system design patterns',
  },
  {
    id: 'p11',
    name: 'AI Development',
    category: 'Programming',
    level: 'blue',
    dateEarned: new Date('2024-04-05'),
    prerequisites: ['p7', 'p8'],
    description: 'Expert in AI and machine learning systems',
  },
  {
    id: 'p12',
    name: 'Cloud Architecture',
    category: 'Programming',
    level: 'blue',
    dateEarned: new Date('2024-04-10'),
    prerequisites: ['p8', 'p9'],
    description: 'Mastered distributed cloud systems',
  },
];

const languageCards: Card[] = [
  // Purple cards
  {
    id: 'l1',
    name: 'Basic Vocabulary',
    category: 'Languages',
    level: 'purple',
    dateEarned: new Date('2024-01-05'),
    prerequisites: [],
    description: 'Mastered 1000 essential words',
  },
  {
    id: 'l2',
    name: 'Pronunciation Basics',
    category: 'Languages',
    level: 'purple',
    dateEarned: new Date('2024-01-10'),
    prerequisites: [],
    description: 'Understanding of basic phonetics',
  },
  {
    id: 'l3',
    name: 'Simple Conversations',
    category: 'Languages',
    level: 'purple',
    dateEarned: new Date('2024-01-15'),
    prerequisites: [],
    description: 'Mastered basic daily conversations',
  },
  // Yellow cards
  {
    id: 'l4',
    name: 'Grammar Mastery',
    category: 'Languages',
    level: 'yellow',
    dateEarned: new Date('2024-02-20'),
    prerequisites: ['l1'],
    description: 'Understanding of complex grammar structures',
  },
  {
    id: 'l5',
    name: 'Writing Skills',
    category: 'Languages',
    level: 'yellow',
    dateEarned: new Date('2024-02-25'),
    prerequisites: ['l4'],
    description: 'Mastered formal writing techniques',
  },
  {
    id: 'l6',
    name: 'Reading Comprehension',
    category: 'Languages',
    level: 'yellow',
    dateEarned: new Date('2024-03-01'),
    prerequisites: ['l1', 'l4'],
    description: 'Understanding of complex texts',
  },
  // Red cards
  {
    id: 'l7',
    name: 'Fluency Achievement',
    category: 'Languages',
    level: 'red',
    dateEarned: new Date('2024-03-15'),
    prerequisites: ['l4'],
    description: 'Achieved conversational fluency',
  },
  {
    id: 'l8',
    name: 'Cultural Understanding',
    category: 'Languages',
    level: 'red',
    dateEarned: new Date('2024-03-20'),
    prerequisites: ['l7'],
    description: 'Deep understanding of cultural context',
  },
  {
    id: 'l9',
    name: 'Professional Proficiency',
    category: 'Languages',
    level: 'red',
    dateEarned: new Date('2024-03-25'),
    prerequisites: ['l5', 'l7'],
    description: 'Mastered professional communication',
  },
];

const scienceCards: Card[] = [
  // Purple cards
  {
    id: 's1',
    name: 'Basic Physics',
    category: 'Science',
    level: 'purple',
    dateEarned: new Date('2024-01-20'),
    prerequisites: [],
    description: 'Understanding of fundamental physics concepts',
  },
  {
    id: 's2',
    name: 'Scientific Method',
    category: 'Science',
    level: 'purple',
    dateEarned: new Date('2024-01-25'),
    prerequisites: [],
    description: 'Mastered research methodology',
  },
  {
    id: 's3',
    name: 'Basic Chemistry',
    category: 'Science',
    level: 'purple',
    dateEarned: new Date('2024-01-30'),
    prerequisites: [],
    description: 'Understanding of chemical elements',
  },
  // Yellow cards
  {
    id: 's4',
    name: 'Organic Chemistry',
    category: 'Science',
    level: 'yellow',
    dateEarned: new Date('2024-02-25'),
    prerequisites: ['s3'],
    description: 'Mastered organic compounds',
  },
  {
    id: 's5',
    name: 'Electromagnetism',
    category: 'Science',
    level: 'yellow',
    dateEarned: new Date('2024-03-01'),
    prerequisites: ['s1'],
    description: 'Understanding of electromagnetic fields',
  },
  {
    id: 's6',
    name: 'Cell Biology',
    category: 'Science',
    level: 'yellow',
    dateEarned: new Date('2024-03-05'),
    prerequisites: ['s2'],
    description: 'Mastered cellular structures',
  },
  // Red cards
  {
    id: 's7',
    name: 'Quantum Physics',
    category: 'Science',
    level: 'red',
    dateEarned: new Date('2024-03-20'),
    prerequisites: ['s5'],
    description: 'Understanding of quantum mechanics',
  },
  {
    id: 's8',
    name: 'Biochemistry',
    category: 'Science',
    level: 'red',
    dateEarned: new Date('2024-03-25'),
    prerequisites: ['s4', 's6'],
    description: 'Mastered biochemical processes',
  },
  {
    id: 's9',
    name: 'Astrophysics',
    category: 'Science',
    level: 'red',
    dateEarned: new Date('2024-03-30'),
    prerequisites: ['s7'],
    description: 'Understanding of cosmic phenomena',
  },
];

// Sample decks with proper card distribution
const sampleDecks: Deck[] = [
  {
    id: 'd1',
    name: 'Starter Deck',
    tier: 'starter',
    capacity: 10,
    cards: mathCards.filter(card => card.level === 'purple'),
    isArchived: false,
  },
  {
    id: 'd2',
    name: 'Student Deck',
    tier: 'student',
    capacity: 25,
    cards: programmingCards.filter(card => card.level === 'purple' || card.level === 'yellow'),
    isArchived: false,
  },
  {
    id: 'd3',
    name: 'Scholars Deck',
    tier: 'scholars',
    capacity: 50,
    cards: mathCards.filter(card => card.level === 'purple' || card.level === 'yellow' || card.level === 'red'),
    isArchived: false,
  },
  {
    id: 'd4',
    name: 'Master Deck',
    tier: 'master',
    capacity: 100,
    cards: programmingCards.filter(card => card.level === 'purple' || card.level === 'yellow' || card.level === 'red' || card.level === 'blue'),
    isArchived: false,
  },
];

interface DeckStore {
  decks: Deck[];
  activeDeckId: string | null;
  addDeck: (deck: Deck) => void;
  removeDeck: (deckId: string) => void;
  addCardToDeck: (deckId: string, card: Card) => void;
  removeCardFromDeck: (deckId: string, cardId: string) => void;
  removeCardFromAllDecks: (cardId: string) => void;
  setActiveDeck: (deckId: string) => void;
  upgradeDeck: (deckId: string, newTier: DeckTier) => void;
  archiveDeck: (deckId: string) => void;
  archiveCard: (card: Card) => void;
  mergeCards: (cardIds: string[]) => void;
  shuffleAll: () => void;
}

export const useDeckStore = create<DeckStore>((set) => ({
  decks: sampleDecks,
  activeDeckId: null,

  addDeck: (deck) =>
    set((state) => ({
      decks: [...state.decks, deck],
    })),

  removeDeck: (deckId) =>
    set((state) => ({
      decks: state.decks.filter((deck) => deck.id !== deckId),
    })),

  addCardToDeck: (deckId, card) =>
    set((state) => ({
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? { ...deck, cards: [...deck.cards, card] }
          : deck
      ),
    })),

  removeCardFromDeck: (deckId, cardId) =>
    set((state) => ({
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? { ...deck, cards: deck.cards.filter((c) => c.id !== cardId) }
          : deck
      ),
    })),

  removeCardFromAllDecks: (cardId) =>
    set((state) => ({
      decks: state.decks.map((deck) => ({
        ...deck,
        cards: deck.cards.filter((c) => c.id !== cardId),
      })),
    })),

  setActiveDeck: (deckId) => set({ activeDeckId: deckId }),

  upgradeDeck: (deckId, newTier) =>
    set((state) => {
      const deck = state.decks.find((d) => d.id === deckId);
      if (!deck) return state;

      const allowedLevels = getAllowedCardLevels(newTier);
      const filteredCards = deck.cards.filter((card) => allowedLevels.includes(card.level));

      return {
        decks: state.decks.map((deck) =>
          deck.id === deckId
            ? {
                ...deck,
                tier: newTier,
                cards: filteredCards,
              }
            : deck
        ),
      };
    }),

  archiveDeck: (deckId) =>
    set((state) => ({
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              isArchived: true,
            }
          : deck
      ),
    })),

  archiveCard: (card) =>
    set((state) => {
      // Remove the card from all decks
      const updatedDecks = state.decks.map((deck) => ({
        ...deck,
        cards: deck.cards.filter((c) => c.id !== card.id),
      }));

      // Add the card to the archived deck
      const archivedDeck = updatedDecks.find((deck) => deck.id === 'archived');
      if (archivedDeck) {
        return {
          decks: updatedDecks.map((deck) =>
            deck.id === 'archived'
              ? { ...deck, cards: [...deck.cards, { ...card, isArchived: true }] }
              : deck
          ),
        };
      }

      return { decks: updatedDecks };
    }),

  mergeCards: (cardIds) =>
    set((state) => {
      const cards = state.decks
        .flatMap((deck) => deck.cards)
        .filter((card) => cardIds.includes(card.id));

      if (cards.length !== 3) return state;

      const firstCard = cards[0];
      
      // Check if all cards are the same level
      if (!cards.every(card => card.level === firstCard.level)) return state;
      
      // Prevent merging of blue cards
      if (firstCard.level === 'blue') return state;

      // Determine the next level based on current level
      let nextLevel: Card['level'];
      switch (firstCard.level) {
        case 'purple':
          nextLevel = 'yellow';
          break;
        case 'yellow':
          nextLevel = 'red';
          break;
        case 'red':
          nextLevel = 'blue';
          break;
        default:
          return state;
      }

      const mergedCard: Card = {
        id: `merged-${Date.now()}`,
        name: `${firstCard.name} Mastery`,
        category: firstCard.category,
        level: nextLevel,
        dateEarned: new Date(),
        prerequisites: cardIds,
        description: `Mastered advanced ${firstCard.category} concepts`,
      };

      // Remove the original cards from all decks
      const updatedDecks = state.decks.map((deck) => ({
        ...deck,
        cards: deck.cards.filter((c) => !cardIds.includes(c.id)),
      }));

      // Find the appropriate deck for the merged card based on its level
      const targetDeck = updatedDecks.find(deck => {
        const allowedLevels = getAllowedCardLevels(deck.tier);
        return allowedLevels.includes(nextLevel) && !deck.isArchived;
      });

      if (targetDeck) {
        // Add the merged card to the target deck
        return {
          decks: updatedDecks.map(deck =>
            deck.id === targetDeck.id
              ? { ...deck, cards: [...deck.cards, mergedCard] }
              : deck
          ),
        };
      }

      return { decks: updatedDecks };
    }),

  shuffleAll: () =>
    set((state) => {
      // Reset all decks to their original sample data
      const resetDecks = state.decks.map(deck => {
        if (deck.isArchived) return deck; // Skip archived deck

        let originalCards: Card[] = [];
        switch (deck.tier) {
          case 'starter':
            originalCards = [...mathCards.filter(card => card.level === 'purple')];
            break;
          case 'student':
            originalCards = [...programmingCards.filter(card => card.level === 'purple' || card.level === 'yellow')];
            break;
          case 'scholars':
            originalCards = [...mathCards.filter(card => card.level === 'purple' || card.level === 'yellow' || card.level === 'red')];
            break;
          case 'master':
            originalCards = [...programmingCards.filter(card => card.level === 'purple' || card.level === 'yellow' || card.level === 'red' || card.level === 'blue')];
            break;
        }

        // Shuffle the cards
        const shuffledCards = [...originalCards].sort(() => Math.random() - 0.5);

        return {
          ...deck,
          cards: shuffledCards.slice(0, deck.capacity)
        };
      });

      return { decks: resetDecks };
    }),
})); 