import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService, UserRepository } from '@2dots1line/database';
import { TRegisterRequest, TLoginRequest, TUser } from '@2dots1line/shared-types';

export class AuthController {
  private userRepository: UserRepository;
  private jwtSecret: string;

  constructor() {
    const databaseService = DatabaseService.getInstance();
    this.userRepository = new UserRepository(databaseService);
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  }

  private toUserResponse(user: TUser): Omit<TUser, 'hashed_password'> {
    const { hashed_password, ...userResponse } = user;
    return userResponse;
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body as TRegisterRequest;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
        return;
      }

      const existingUser = await this.userRepository.findByEmail(email.toLowerCase());
      if (existingUser) {
        res.status(409).json({ success: false, error: 'User with this email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await this.userRepository.create({
        email: email.toLowerCase(),
        hashed_password: hashedPassword,
        name: name,
      });

      const token = jwt.sign({ userId: newUser.user_id, email: newUser.email }, this.jwtSecret, { expiresIn: '7d' });
      
      res.status(201).json({
        success: true,
        data: { user: this.toUserResponse(newUser), token },
        message: 'User registered successfully',
      });
    } catch (error) {
      console.error('Error in user-service register:', error);
      res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as TLoginRequest;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const user = await this.userRepository.findByEmailWithPassword(email.toLowerCase());
      if (!user || !user.hashed_password) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      await this.userRepository.updateLastActive(user.user_id);
      const token = jwt.sign({ userId: user.user_id, email: user.email }, this.jwtSecret, { expiresIn: '7d' });

      res.status(200).json({
        success: true,
        data: { user: this.toUserResponse(user), token },
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Error in user-service login:', error);
      res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
    }
  };
} 