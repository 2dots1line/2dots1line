import { DatabaseService, UserRepository, ConceptRepository, ConversationRepository } from '@2dots1line/database';
import type { users as User } from '@2dots1line/database';

/**
 * UserService - Pure business logic for user operations
 * V11.0 Headless Service - No HTTP dependencies
 */
export class UserService {
  private userRepository: UserRepository;
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
    this.databaseService = databaseService;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Create a new user
   * V11.1.1 ENHANCEMENT: Automatically create User concept and trigger onboarding ingestion
   */
  async createUser(userData: {
    email: string;
    name?: string;
    profileImageUrl?: string;
    preferences?: any;
  }): Promise<User> {
    // Create the user in the database
    const user = await this.userRepository.create({
      email: userData.email,
      name: userData.name,
      profile_picture_url: userData.profileImageUrl,
      preferences: userData.preferences,
    });

    // V11.1.1 ENHANCEMENT: Automatically create User concept for the new user
    await this.createUserConcept(user.user_id, user.name || 'User');

    return user;
  }

  /**
   * V11.1.1 NEW: Create a User concept for the user in their knowledge graph
   */
  private async createUserConcept(userId: string, userName: string): Promise<void> {
    try {
      const conceptRepo = new ConceptRepository(this.databaseService);
      
      // Create a User concept for this user
      const userConceptData = {
        user_id: userId,
        name: userName,
        type: 'person',
        description: `The user (${userName}) in this knowledge graph - the central person whose experiences, interests, and growth are being tracked.`,
        salience: 10 // High salience since user is central to their own knowledge graph
      };

      const userConcept = await conceptRepo.create(userConceptData);
      console.log(`[UserService] ✅ Created User concept for ${userName}: ${userConcept.concept_id}`);

      // V11.1.1 ENHANCEMENT: Trigger onboarding ingestion with proactive prompts
      await this.triggerOnboardingIngestion(userId, userName);

    } catch (error) {
      console.error(`[UserService] ❌ Error creating User concept for ${userName}:`, error);
      // Don't fail user creation if concept creation fails
    }
  }

  /**
   * V11.1.1 NEW: Trigger onboarding ingestion with structured proactive prompts
   */
  private async triggerOnboardingIngestion(userId: string, userName: string): Promise<void> {
    try {
      // Create an onboarding conversation with proactive prompts
      const conversationRepo = new ConversationRepository(this.databaseService);
      
      const onboardingConversation = await conversationRepo.create({
        user_id: userId,
        title: `Welcome ${userName} - Let's get to know you`,
        metadata: {
          type: 'onboarding',
          userName: userName,
          onboardingStep: 'initial'
        }
      });

      // Add onboarding messages with proactive prompts using Prisma directly
      const onboardingMessages = [
        {
          conversation_id: onboardingConversation.id,
          role: 'assistant',
          content: `Welcome to 2dots1line, ${userName}! I'm excited to get to know you and help you track your personal growth journey. Let's start with a few questions to understand what matters most to you.`
        },
        {
          conversation_id: onboardingConversation.id,
          role: 'assistant',
          content: `What are you most passionate about learning or exploring right now? This could be anything from a new skill, a personal interest, or something you're curious about.`
        },
        {
          conversation_id: onboardingConversation.id,
          role: 'assistant',
          content: `What's one area of your life where you'd like to see growth or improvement? This could be personal, professional, creative, or anything else that's important to you.`
        },
        {
          conversation_id: onboardingConversation.id,
          role: 'assistant',
          content: `What activities or experiences bring you the most joy and fulfillment? I'd love to understand what makes you feel most alive and engaged.`
        }
      ];

      for (const message of onboardingMessages) {
        await this.databaseService.prisma.conversation_messages.create({
          data: {
            ...message,
            id: crypto.randomUUID()
          }
        });
      }

      // Mark conversation as ended so it can be ingested
      await conversationRepo.update(onboardingConversation.id, {
        ended_at: new Date(),
        status: 'completed'
      });

      // Trigger ingestion job using existing Redis instance
      const ingestionQueue = this.databaseService.redis.duplicate();
      
      await ingestionQueue.lpush('ingestion-queue', JSON.stringify({
        type: 'conversation_ingestion',
        conversationId: onboardingConversation.id,
        userId: userId,
        source: 'user_registration'
      }));

      console.log(`[UserService] ✅ Triggered onboarding ingestion for ${userName} with conversation ${onboardingConversation.id}`);

    } catch (error) {
      console.error(`[UserService] ❌ Error triggering onboarding ingestion for ${userName}:`, error);
      // Don't fail user creation if onboarding fails
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: {
    name?: string;
    profileImageUrl?: string;
    preferences?: any;
  }): Promise<User> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.profileImageUrl !== undefined) updateData.profile_picture_url = updates.profileImageUrl;
    if (updates.preferences !== undefined) updateData.preferences = updates.preferences;

    return this.userRepository.update(userId, updateData);
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user !== null;
  }
} 