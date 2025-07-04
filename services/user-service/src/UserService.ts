import { DatabaseService, UserRepository } from '@2dots1line/database';
import type { users as User } from '@2dots1line/database';

/**
 * UserService - Pure business logic for user operations
 * V11.0 Headless Service - No HTTP dependencies
 */
export class UserService {
  private userRepository: UserRepository;

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
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
   */
  async createUser(userData: {
    email: string;
    name?: string;
    profileImageUrl?: string;
    preferences?: any;
  }): Promise<User> {
    return this.userRepository.create({
      email: userData.email,
      name: userData.name,
      profile_picture_url: userData.profileImageUrl,
      preferences: userData.preferences,
    });
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