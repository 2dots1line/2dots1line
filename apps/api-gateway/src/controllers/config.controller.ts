import { Request, Response } from 'express';
import { TApiResponse } from '@2dots1line/shared-types';
import { ConfigService } from '@2dots1line/config-service';

export class ConfigController {
  private configService?: ConfigService;

  constructor() {
    // Initialize ConfigService
    this.configService = new ConfigService();
    this.configService.initialize().catch(console.error);
    console.log('✅ ConfigController initialized');
  }

  /**
   * Get operational parameters
   * GET /api/v1/config/operational-parameters
   */
  async getOperationalParameters(req: Request, res: Response): Promise<void> {
    try {
      if (!this.configService) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Config service is currently unavailable'
          }
        } as TApiResponse<any>);
        return;
      }

      // Get all operational parameters
      const parameters = {
        version: await this.configService.getOperationalParameter('version', '1.0'),
        conversation_timeout_seconds: await this.configService.getOperationalParameter('conversation_timeout_seconds', 600),
        workers: {
          check_interval_seconds: await this.configService.getOperationalParameter('workers.check_interval_seconds', 60)
        },
        ingestion: {
          min_importance_score_threshold: await this.configService.getOperationalParameter('ingestion.min_importance_score_threshold', 3)
        },
        ontology_optimization: {
          default_date_range_days: await this.configService.getOperationalParameter('ontology_optimization.default_date_range_days', 2),
          max_date_range_days: await this.configService.getOperationalParameter('ontology_optimization.max_date_range_days', 7),
          min_date_range_days: await this.configService.getOperationalParameter('ontology_optimization.min_date_range_days', 1),
          max_user_prompt_tokens: await this.configService.getOperationalParameter('ontology_optimization.max_user_prompt_tokens', 20000),
          max_output_tokens: await this.configService.getOperationalParameter('ontology_optimization.max_output_tokens', 50000),
          max_total_tokens: await this.configService.getOperationalParameter('ontology_optimization.max_total_tokens', 50000),
          sampling_strategy: await this.configService.getOperationalParameter('ontology_optimization.sampling_strategy', 'entity_id_hash'),
          max_concept_merges: await this.configService.getOperationalParameter('ontology_optimization.max_concept_merges', 20),
          max_strategic_relationships: await this.configService.getOperationalParameter('ontology_optimization.max_strategic_relationships', 30),
          max_community_structures: await this.configService.getOperationalParameter('ontology_optimization.max_community_structures', 10)
        }
      };

      res.status(200).json({
        success: true,
        data: parameters
      } as TApiResponse<any>);

    } catch (error) {
      console.error('Error in config controller getOperationalParameters:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  }
}


