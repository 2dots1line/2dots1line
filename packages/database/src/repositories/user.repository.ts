import { PrismaClient, Prisma, User } from '../prisma-client';
import { DatabaseService } from '../index';

export interface CreateUserData {
  email: string;
  name?: string; // Maps to schema name field
  username?: string; // Alias for name field
  password_hash: string;
  region?: string; // Made optional since it has a default
  preferences?: any; // Optional JSON field
}

export class UserRepository {
  private prisma: PrismaClient;

  constructor(private databaseService: DatabaseService) {
    this.prisma = databaseService.prisma;
  }

  async createUser(data: CreateUserData): Promise<User> {
    if (!data.email || !data.password_hash) {
      throw new Error('Missing required fields for user creation: email, password_hash.');
    }
    
    // Handle username alias - use username if provided, otherwise use name
    const nameValue = data.username || data.name;
    
    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: nameValue,
          hashed_password: data.password_hash,
          region: data.region || 'us', // Use default if not provided
          preferences: data.preferences,
          // account_status will default to 'active' as per schema
        },
      });
      return user;
    } catch (error: any) {
      if (error.code === 'P2002') { // Unique constraint violation
        // Could check error.meta.target to see which field caused it (e.g., ['email'])
        throw new Error(`User with this email already exists.`);
      }
      console.error("Error creating user:", error);
      throw new Error("Could not create user.");
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw new Error("Could not find user by email.");
    }
  }

  async findUserById(id: string): Promise<User | null> {
    if (!id) return null;
    try {
      return await this.prisma.user.findUnique({
        where: { user_id: id },
      });
    } catch (error) {
      console.error(`Error finding user by id ${id}:`, error);
      throw new Error("Could not find user by id.");
    }
  }

  async findUserByName(name: string): Promise<User | null> {
    if (!name) return null;
    try {
      return await this.prisma.user.findFirst({
        where: { name },
      });
    } catch (error) {
      console.error(`Error finding user by name ${name}:`, error);
      throw new Error("Could not find user by name.");
    }
  }

  // Optional: Add other methods as needed, e.g., updateUser, deleteUser
  
  /**
   * Delete user by ID (hard delete from database)
   * Note: In production, consider soft delete by setting account_status to 'deleted'
   */
  async deleteUser(id: string): Promise<User | null> {
    if (!id) return null;
    try {
      const deletedUser = await this.prisma.user.delete({
        where: { user_id: id },
      });
      return deletedUser;
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        throw new Error(`User with ID ${id} not found.`);
      }
      console.error(`Error deleting user ${id}:`, error);
      throw new Error("Could not delete user.");
    }
  }

  /**
   * Soft delete user by setting account_status to 'deleted'
   * Recommended for production to maintain data integrity
   */
  async softDeleteUser(id: string): Promise<User | null> {
    if (!id) return null;
    try {
      const updatedUser = await this.prisma.user.update({
        where: { user_id: id },
        data: {
          account_status: 'deleted',
          last_active_at: new Date(),
        },
      });
      return updatedUser;
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        throw new Error(`User with ID ${id} not found.`);
      }
      console.error(`Error soft deleting user ${id}:`, error);
      throw new Error("Could not soft delete user.");
    }
  }
} 