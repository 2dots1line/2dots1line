import { DatabaseService } from '../DatabaseService';

export interface LLMInteractionFilters {
  userId?: string;
  workerType?: string;
  conversationId?: string;
  status?: 'success' | 'error' | 'timeout';
  startDate?: Date;
  endDate?: Date;
  modelName?: string;
  minPromptLength?: number;
  maxPromptLength?: number;
}

export interface LLMInteractionStats {
  totalInteractions: number;
  successCount: number;
  errorCount: number;
  averageProcessingTime: number;
  totalTokensUsed: number;
  averagePromptLength: number;
  averageResponseLength: number;
  byWorkerType: Record<string, number>;
  byModel: Record<string, number>;
  byStatus: Record<string, number>;
}

export class LLMInteractionRepository {
  constructor(private dbService: DatabaseService) {}

  /**
   * Get LLM interactions with optional filtering
   */
  async getInteractions(filters: LLMInteractionFilters = {}, limit = 100, offset = 0) {
    const where: any = {};

    if (filters.userId) where.user_id = filters.userId;
    if (filters.workerType) where.worker_type = filters.workerType;
    if (filters.conversationId) where.conversation_id = filters.conversationId;
    if (filters.status) where.status = filters.status;
    if (filters.modelName) where.model_name = filters.modelName;
    if (filters.minPromptLength) where.prompt_length = { gte: filters.minPromptLength };
    if (filters.maxPromptLength) where.prompt_length = { ...where.prompt_length, lte: filters.maxPromptLength };
    
    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    return await this.dbService.prisma.llm_interactions.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        users: {
          select: {
            user_id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get a specific LLM interaction by ID
   */
  async getInteractionById(interactionId: string) {
    return await this.dbService.prisma.llm_interactions.findUnique({
      where: { interaction_id: interactionId },
      include: {
        users: {
          select: {
            user_id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get LLM interactions for a specific conversation
   */
  async getConversationInteractions(conversationId: string) {
    return await this.dbService.prisma.llm_interactions.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      include: {
        users: {
          select: {
            user_id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get LLM interactions for a specific user
   */
  async getUserInteractions(userId: string, limit = 50) {
    return await this.dbService.prisma.llm_interactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            user_id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get statistics about LLM interactions
   */
  async getStats(filters: LLMInteractionFilters = {}): Promise<LLMInteractionStats> {
    const where: any = {};

    if (filters.userId) where.user_id = filters.userId;
    if (filters.workerType) where.worker_type = filters.workerType;
    if (filters.conversationId) where.conversation_id = filters.conversationId;
    if (filters.status) where.status = filters.status;
    if (filters.modelName) where.model_name = filters.modelName;
    
    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    // Get basic counts
    const [totalInteractions, successCount, errorCount] = await Promise.all([
      this.dbService.prisma.llm_interactions.count({ where }),
      this.dbService.prisma.llm_interactions.count({ where: { ...where, status: 'success' } }),
      this.dbService.prisma.llm_interactions.count({ where: { ...where, status: 'error' } })
    ]);

    // Get averages
    const averages = await this.dbService.prisma.llm_interactions.aggregate({
      where,
      _avg: {
        processing_time_ms: true,
        prompt_length: true,
        response_length: true,
        prompt_tokens: true,
        response_tokens: true
      }
    });

    // Get counts by worker type
    const byWorkerType = await this.dbService.prisma.llm_interactions.groupBy({
      by: ['worker_type'],
      where,
      _count: { worker_type: true }
    });

    // Get counts by model
    const byModel = await this.dbService.prisma.llm_interactions.groupBy({
      by: ['model_name'],
      where,
      _count: { model_name: true }
    });

    // Get counts by status
    const byStatus = await this.dbService.prisma.llm_interactions.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    });

    // Calculate total tokens
    const tokenStats = await this.dbService.prisma.llm_interactions.aggregate({
      where,
      _sum: {
        prompt_tokens: true,
        response_tokens: true
      }
    });

    const totalTokensUsed = (tokenStats._sum.prompt_tokens || 0) + (tokenStats._sum.response_tokens || 0);

    return {
      totalInteractions,
      successCount,
      errorCount,
      averageProcessingTime: averages._avg.processing_time_ms || 0,
      totalTokensUsed,
      averagePromptLength: averages._avg.prompt_length || 0,
      averageResponseLength: averages._avg.response_length || 0,
      byWorkerType: Object.fromEntries(
        byWorkerType.map(item => [item.worker_type, item._count.worker_type])
      ),
      byModel: Object.fromEntries(
        byModel.map(item => [item.model_name, item._count.model_name])
      ),
      byStatus: Object.fromEntries(
        byStatus.map(item => [item.status, item._count.status])
      )
    };
  }

  /**
   * Get recent failed interactions for debugging
   */
  async getRecentFailures(limit = 20) {
    return await this.dbService.prisma.llm_interactions.findMany({
      where: { status: 'error' },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            user_id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get interactions with the longest processing times
   */
  async getSlowestInteractions(limit = 20) {
    return await this.dbService.prisma.llm_interactions.findMany({
      where: { status: 'success' },
      orderBy: { processing_time_ms: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            user_id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get interactions with the largest prompts
   */
  async getLargestPrompts(limit = 20) {
    return await this.dbService.prisma.llm_interactions.findMany({
      orderBy: { prompt_length: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            user_id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }
}
