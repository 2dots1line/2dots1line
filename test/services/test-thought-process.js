/**
 * Test script for thought extraction process
 * 
 * Usage:
 *   node test-thought-process.js <user_id> <interaction_id>
 * or
 *   node test-thought-process.js <user_id> batch
 */

const { PrismaClient } = require('@prisma/client');
const thoughtService = require('./services/thoughtService');

const prisma = new PrismaClient();
require('dotenv').config();

// Parse arguments
const userId = process.argv[2];
const interactionId = process.argv[3];

if (!userId) {
  console.error('Error: user_id argument is required');
  console.log('Usage:');
  console.log('  node test-thought-process.js <user_id> <interaction_id>');
  console.log('  node test-thought-process.js <user_id> batch');
  process.exit(1);
}

async function main() {
  try {
    // Process a single interaction
    if (interactionId && interactionId !== 'batch') {
      console.log(`Processing interaction ${interactionId} for thoughts...`);
      
      // Check if the interaction exists
      const interaction = await prisma.interaction.findUnique({
        where: { interaction_id: interactionId }
      });
      
      if (!interaction) {
        console.error(`Error: Interaction ${interactionId} not found`);
        process.exit(1);
      }
      
      // Process the interaction
      const thoughts = await thoughtService.processInteractionForThoughts(interactionId);
      
      console.log(`Successfully processed interaction. Created ${thoughts.length} thoughts.`);
      if (thoughts.length > 0) {
        console.log('Extracted thoughts:');
        thoughts.forEach(thought => {
          console.log(`- ${thought.title}: "${thought.content.substring(0, 50)}..."`);
        });
      }
    } 
    // Process a batch of interactions
    else if (interactionId === 'batch') {
      console.log(`Batch processing interactions for user ${userId}...`);
      
      const options = {
        limit: 10,
        skipProcessed: false
      };
      
      const results = await thoughtService.batchProcessInteractionsForThoughts(userId, options);
      
      console.log('Batch processing completed:');
      console.log(`- Total interactions: ${results.total}`);
      console.log(`- Successfully processed: ${results.processed}`);
      console.log(`- Total thoughts created: ${results.thoughtsCreated}`);
      console.log(`- Errors: ${results.errors}`);
      
      if (results.details.length > 0) {
        console.log('\nDetails:');
        results.details.forEach(detail => {
          if (detail.status === 'success') {
            console.log(`- Interaction ${detail.interactionId}: ${detail.thoughtsCreated} thoughts created`);
          } else {
            console.log(`- Interaction ${detail.interactionId}: ERROR - ${detail.error}`);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 