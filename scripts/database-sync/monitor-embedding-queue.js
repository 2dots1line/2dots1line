#!/usr/bin/env node

/**
 * Monitor Embedding Queue Script
 * 
 * This script provides real-time monitoring of the embedding queue,
 * showing job status, progress, and performance metrics.
 * 
 * Usage: node scripts/monitor-embedding-queue.js [options]
 * Options:
 *   --watch          Continuously monitor (refresh every 5 seconds)
 *   --duration N     Watch for N seconds (default: 60)
 *   --detailed       Show detailed job information
 */

const { Queue } = require('bullmq');

class EmbeddingQueueMonitor {
  constructor() {
    this.embeddingQueue = new Queue('embedding-queue', {
      connection: { host: 'localhost', port: 6379 }
    });
  }

  async monitor(options = {}) {
    const {
      watch = false,
      duration = 60,
      detailed = false
    } = options;

    console.log('📊 [EmbeddingQueueMonitor] Starting queue monitoring...\n');
    
    try {
      if (watch) {
        await this.watchQueue(duration, detailed);
      } else {
        await this.showQueueStatus(detailed);
      }
    } catch (error) {
      console.error('❌ [EmbeddingQueueMonitor] Error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async showQueueStatus(detailed = false) {
    console.log('📈 Current Queue Status:');
    console.log('=' .repeat(40));
    
    // Get queue statistics
    const waiting = await this.embeddingQueue.getWaiting();
    const active = await this.embeddingQueue.getActive();
    const completed = await this.embeddingQueue.getCompleted();
    const failed = await this.embeddingQueue.getFailed();
    const delayed = await this.embeddingQueue.getDelayed();
    
    console.log(`Waiting: ${waiting.length}`);
    console.log(`Active: ${active.length}`);
    console.log(`Completed: ${completed.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Delayed: ${delayed.length}`);
    
    // Show recent completed jobs
    if (completed.length > 0) {
      console.log('\n✅ Recent Completed Jobs:');
      completed.slice(-5).forEach((job, index) => {
        const duration = job.finishedOn - job.processedOn;
        console.log(`  ${index + 1}. Job ${job.id} - ${job.data.entityType} ${job.data.entityId}`);
        console.log(`     Duration: ${duration}ms`);
      });
    }
    
    // Show recent failed jobs
    if (failed.length > 0) {
      console.log('\n❌ Recent Failed Jobs:');
      failed.slice(-5).forEach((job, index) => {
        console.log(`  ${index + 1}. Job ${job.id} - ${job.data.entityType} ${job.data.entityId}`);
        console.log(`     Error: ${job.failedReason}`);
        console.log(`     Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
      });
    }
    
    // Show active jobs
    if (active.length > 0) {
      console.log('\n🔄 Currently Active Jobs:');
      active.forEach((job, index) => {
        const duration = Date.now() - job.processedOn;
        console.log(`  ${index + 1}. Job ${job.id} - ${job.data.entityType} ${job.data.entityId}`);
        console.log(`     Running for: ${Math.round(duration / 1000)}s`);
      });
    }
    
    if (detailed) {
      await this.showDetailedJobInfo();
    }
    
    // Calculate performance metrics
    await this.showPerformanceMetrics();
  }

  async watchQueue(duration, detailed) {
    console.log(`👀 Watching queue for ${duration} seconds...\n`);
    
    const startTime = Date.now();
    let lastCompleted = 0;
    let lastFailed = 0;
    
    while (Date.now() - startTime < duration * 1000) {
      // Clear screen and show current status
      process.stdout.write('\x1B[2J\x1B[0f');
      console.log(`📊 [EmbeddingQueueMonitor] Live Queue Status (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
      console.log('=' .repeat(60));
      
      const waiting = await this.embeddingQueue.getWaiting();
      const active = await this.embeddingQueue.getActive();
      const completed = await this.embeddingQueue.getCompleted();
      const failed = await this.embeddingQueue.getFailed();
      
      console.log(`Waiting: ${waiting.length}`);
      console.log(`Active: ${active.length}`);
      console.log(`Completed: ${completed.length} (+${completed.length - lastCompleted} since last check)`);
      console.log(`Failed: ${failed.length} (+${failed.length - lastFailed} since last check)`);
      
      if (active.length > 0) {
        console.log('\n🔄 Active Jobs:');
        active.forEach((job, index) => {
          const duration = Date.now() - job.processedOn;
          console.log(`  ${index + 1}. ${job.data.entityType} ${job.data.entityId} (${Math.round(duration / 1000)}s)`);
        });
      }
      
      lastCompleted = completed.length;
      lastFailed = failed.length;
      
      // Wait 5 seconds before next update
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('\n✅ Monitoring complete!');
  }

  async showDetailedJobInfo() {
    console.log('\n📋 Detailed Job Information:');
    
    const jobs = await this.embeddingQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 20);
    
    for (let index = 0; index < jobs.length; index++) {
      const job = jobs[index];
      console.log(`\n${index + 1}. Job ${job.id}:`);
      console.log(`   Type: ${job.name}`);
      console.log(`   Status: ${await job.getState()}`);
      console.log(`   Entity: ${job.data.entityType} ${job.data.entityId}`);
      console.log(`   User: ${job.data.userId}`);
      console.log(`   Source: ${job.data.source || 'unknown'}`);
      
      if (job.processedOn) {
        console.log(`   Processed: ${new Date(job.processedOn).toISOString()}`);
      }
      if (job.finishedOn) {
        console.log(`   Finished: ${new Date(job.finishedOn).toISOString()}`);
        const duration = job.finishedOn - job.processedOn;
        console.log(`   Duration: ${duration}ms`);
      }
      if (job.failedReason) {
        console.log(`   Error: ${job.failedReason}`);
      }
    }
  }

  async showPerformanceMetrics() {
    console.log('\n📊 Performance Metrics:');
    
    const completed = await this.embeddingQueue.getCompleted();
    const failed = await this.embeddingQueue.getFailed();
    
    if (completed.length > 0) {
      const durations = completed
        .filter(job => job.processedOn && job.finishedOn)
        .map(job => job.finishedOn - job.processedOn);
      
      if (durations.length > 0) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        console.log(`Average processing time: ${Math.round(avgDuration)}ms`);
        console.log(`Fastest job: ${minDuration}ms`);
        console.log(`Slowest job: ${maxDuration}ms`);
      }
    }
    
    const totalJobs = completed.length + failed.length;
    if (totalJobs > 0) {
      const successRate = (completed.length / totalJobs) * 100;
      console.log(`Success rate: ${successRate.toFixed(1)}%`);
    }
    
    // Show queue health
    const waiting = await this.embeddingQueue.getWaiting();
    const active = await this.embeddingQueue.getActive();
    
    if (waiting.length === 0 && active.length === 0) {
      console.log('✅ Queue is idle - all jobs processed');
    } else if (waiting.length > 100) {
      console.log('⚠️ Queue is backed up - consider scaling workers');
    } else {
      console.log('🔄 Queue is processing normally');
    }
  }

  async cleanup() {
    await this.embeddingQueue.close();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    watch: false,
    duration: 60,
    detailed: false
  };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--watch':
        options.watch = true;
        break;
      case '--duration':
        options.duration = parseInt(args[++i]);
        break;
      case '--detailed':
        options.detailed = true;
        break;
    }
  }

  const monitor = new EmbeddingQueueMonitor();
  
  try {
    await monitor.monitor(options);
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [EmbeddingQueueMonitor] Monitoring failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { EmbeddingQueueMonitor };
