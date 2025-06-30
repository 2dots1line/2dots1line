import { Request, Response } from 'express';
import { DatabaseService, UserRepository } from '@2dots1line/database';

export class UserController {
  private userRepository: UserRepository;

  constructor() {
    const databaseService = DatabaseService.getInstance();
    this.userRepository = new UserRepository(databaseService);
  }

  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ success: false, error: 'User ID is required' });
        return;
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.json({ success: true, data: user });

    } catch (error) {
      console.error('Error in user-service getUserProfile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get user profile'
      });
    }
  };
} 