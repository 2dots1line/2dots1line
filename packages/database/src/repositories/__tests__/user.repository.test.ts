// Mock PrismaClient first
const mockPrismaUsers = {
  create: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    users: mockPrismaUsers,
  })),
}));

// Mock the entire DatabaseService module
jest.mock('../../index', () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    prisma: {
      users: mockPrismaUsers,
    },
  })),
}));

// Now import after mocking
import { UserRepository } from '../user.repository';
import { DatabaseService } from '../../index';
import type { PrismaClient } from '@prisma/client';

// Define the user type based on Prisma client
type UserModel = Awaited<ReturnType<PrismaClient['users']['create']>>;

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    userRepository = new UserRepository(mockDbService);
  });

  describe('createUser', () => {
    it('should call prisma.users.create with correct data', async () => {
      const userData = { 
        email: 'new@example.com', 
        name: 'newuser',
        password_hash: 'hashed', 
        region: 'us' 
      };
      const expectedUser = { 
        user_id: 'gen-uuid', 
        email: userData.email,
        name: userData.name,
        hashed_password: userData.password_hash,
        preferences: {},
        region: userData.region,
        created_at: new Date(),
        last_active_at: null,
        account_status: 'active',
        growth_profile: {}
      } as unknown as UserModel;
      
      mockPrismaUsers.create.mockResolvedValue(expectedUser);

      const result = await userRepository.createUser(userData);

      expect(mockPrismaUsers.create).toHaveBeenCalledWith({ 
        data: {
          email: userData.email,
          name: userData.name,
          hashed_password: userData.password_hash,
          region: userData.region,
          preferences: undefined,
        }
      });
      expect(result).toEqual(expectedUser);
    });

    it('should handle unique constraint violation error', async () => {
      const userData = { 
        email: 'duplicate@example.com', 
        name: 'duplicateuser',
        password_hash: 'hashed', 
        region: 'us' 
      };
      
      const duplicateError = new Error('Unique constraint failed');
      (duplicateError as any).code = 'P2002';
      mockPrismaUsers.create.mockRejectedValue(duplicateError);

      await expect(userRepository.createUser(userData)).rejects.toThrow('User with this email already exists.');
      expect(mockPrismaUsers.create).toHaveBeenCalledWith({ 
        data: {
          email: userData.email,
          name: userData.name,
          hashed_password: userData.password_hash,
          region: userData.region,
          preferences: undefined,
        }
      });
    });
  });

  describe('findUserByEmail', () => {
    it('should call prisma.users.findUnique with email', async () => {
      const email = 'test@example.com';
      const mockUser = { 
        user_id: '1', 
        email, 
        hashed_password: 'pw', 
        name: 'testuser',
        preferences: {},
        region: 'us',
        created_at: new Date(),
        last_active_at: null,
        account_status: 'active',
        growth_profile: {}
      } as unknown as UserModel;
      
      mockPrismaUsers.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findUserByEmail(email);
      
      expect(mockPrismaUsers.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const email = 'notfound@example.com';
      mockPrismaUsers.findUnique.mockResolvedValue(null);

      const result = await userRepository.findUserByEmail(email);
      
      expect(mockPrismaUsers.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toBeNull();
    });
  });
  
  describe('findUserById', () => {
    it('should call prisma.users.findUnique with id', async () => {
      const userId = 'user-id-123';
      const mockUser = { 
        user_id: userId, 
        email: 'id@example.com', 
        hashed_password: 'pw', 
        name: 'testuser',
        preferences: {},
        region: 'us',
        created_at: new Date(),
        last_active_at: null,
        account_status: 'active',
        growth_profile: {}
      } as unknown as UserModel;
      
      mockPrismaUsers.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findUserById(userId);
      
      expect(mockPrismaUsers.findUnique).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent-user-id';
      mockPrismaUsers.findUnique.mockResolvedValue(null);

      const result = await userRepository.findUserById(userId);
      
      expect(mockPrismaUsers.findUnique).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(result).toBeNull();
    });
  });
}); 