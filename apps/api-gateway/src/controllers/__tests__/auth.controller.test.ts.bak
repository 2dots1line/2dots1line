import { Request, Response } from 'express';
import * as authController from '../auth.controller'; // Assuming exports
import { UserRepository } from '@2dots1line/database'; // Path alias from tsconfig
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@2dots1line/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  // let mockUserRepository: jest.Mocked<UserRepository>; // See comment below

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = { body: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    } as unknown as Response; // Type assertion for simplicity in mock

    // Direct prototype mocking for illustration, acknowledging DI is better.
    UserRepository.prototype.createUser = jest.fn().mockResolvedValue({ 
      user_id: '1', 
      email: 'test@example.com', 
      username: 'tester',
      password_hash: 'hashedpassword',
      name: 'Test User',
      region: 'US-WEST'
    });
    UserRepository.prototype.findUserByEmail = jest.fn();
    UserRepository.prototype.findUserByName = jest.fn();

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mocked_jwt_token');

  });

  describe('register', () => {
    it('should register a new user and return a token', async () => {
      mockRequest.body = { 
        email: 'test@example.com', 
        password: 'password123', 
        username: 'tester', 
        display_name: 'Test User',
        region: 'US-WEST' 
      };
      
      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(UserRepository.prototype.createUser).toHaveBeenCalledWith(expect.objectContaining({ 
        email: 'test@example.com',
        username: 'tester',
        name: 'Test User',
        region: 'US-WEST'
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ 
        message: 'User registered successfully' 
      }));
    });
    // Add more tests for validation errors, existing user, etc.
  });

  describe('login', () => {
    it('should login an existing user and return a token', async () => {
        const mockUser = { 
          user_id: '1', 
          email: 'test@example.com', 
          password_hash: 'hashedpassword', 
          username: 'tester',
          name: 'Test User',
          region: 'US-WEST'
        };
        (UserRepository.prototype.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
        mockRequest.body = { email: 'test@example.com', password: 'password123' };

        await authController.login(mockRequest as Request, mockResponse as Response);

        expect(UserRepository.prototype.findUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
        expect(jwt.sign).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ 
          token: 'mocked_jwt_token',
          message: 'Login successful' 
        }));
    });
    // Add more tests for user not found, wrong password, etc.
  });
}); 