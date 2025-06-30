import { Request, Response } from 'express';
import axios from 'axios';

const CARD_SERVICE_URL = process.env.CARD_SERVICE_URL || 'http://localhost:3004';

export class CardController {
  /**
   * GET /api/v1/cards
   * Fetches a list of cards from the card-service.
   */
  public getCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Forward the request, including query parameters, to the card-service
      const serviceResponse = await axios.get(`${CARD_SERVICE_URL}/v1/cards`, {
        params: { ...req.query, userId }, // Pass all filters and add userId
      });

      res.status(200).json(serviceResponse.data);
    } catch (error: any) {
      console.error('API Gateway Error forwarding to card-service:', error);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch cards' });
    }
  };

  /**
   * GET /api/v1/cards/by-source/:entityId
   * Fetches a single card by its source entity from the card-service.
   */
  public getCardBySourceEntity = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { entityId } = req.params;
      const { type } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!type) {
        res.status(400).json({ error: 'Query parameter "type" is required.' });
        return;
      }

      const serviceResponse = await axios.get(`${CARD_SERVICE_URL}/v1/cards/by-source/${entityId}`, {
        params: { userId, type },
      });

      res.status(200).json(serviceResponse.data);
    } catch (error: any) {
      console.error('API Gateway Error forwarding to card-service:', error);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch card details' });
    }
  };

  /**
   * GET /api/v1/cards/dashboard/evolution
   * Fetches cards grouped by evolution state for dashboard.
   */
  public getCardsByEvolutionStateDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const serviceResponse = await axios.get(`${CARD_SERVICE_URL}/v1/cards/evolution`, {
        params: { userId },
      });

      res.status(200).json(serviceResponse.data);
    } catch (error: any) {
      console.error('API Gateway Error forwarding to card-service:', error);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch evolution dashboard' });
    }
  };

  /**
   * GET /api/v1/cards/top-growth
   * Fetches top growth cards.
   */
  public getTopGrowthCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const serviceResponse = await axios.get(`${CARD_SERVICE_URL}/v1/cards/top-growth`, {
        params: { userId, limit },
      });

      res.status(200).json(serviceResponse.data);
    } catch (error: any) {
      console.error('API Gateway Error forwarding to card-service:', error);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch top growth cards' });
    }
  };

  /**
   * GET /api/v1/cards/evolution/:state
   * Fetches cards by evolution state.
   */
  public getCardsByEvolutionState = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { state } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const serviceResponse = await axios.get(`${CARD_SERVICE_URL}/v1/cards/evolution/${state}`, {
        params: { userId },
      });

      res.status(200).json(serviceResponse.data);
    } catch (error: any) {
      console.error('API Gateway Error forwarding to card-service:', error);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch cards by evolution state' });
    }
  };

  /**
   * GET /api/v1/cards/:cardId
   * Fetches card details by ID.
   */
  public getCardDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { cardId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const serviceResponse = await axios.get(`${CARD_SERVICE_URL}/v1/cards/${cardId}`, {
        params: { userId },
      });

      res.status(200).json(serviceResponse.data);
    } catch (error: any) {
      console.error('API Gateway Error forwarding to card-service:', error);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch card details' });
    }
  };
} 