
import { HybridRetrievalTool } from '@2dots1line/tools';
import { DatabaseService } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';

async function testHybridRetrieval() {
  const databaseService = DatabaseService.getInstance();
  const configService = new ConfigService();
  const hybridRetrievalTool = new HybridRetrievalTool(databaseService, configService);
  
  const result = await hybridRetrievalTool.execute({
    keyPhrasesForRetrieval: ['machine learning', 'churn prediction', '50000 customers', 'rolling window features', 'precision recall'],
    userId: '59f01cf2-6b5f-4917-96c0-0c69748c56cf'
  });
  
  console.log('HybridRetrievalTool Result:', JSON.stringify(result, null, 2));
}

testHybridRetrieval().catch(console.error);

