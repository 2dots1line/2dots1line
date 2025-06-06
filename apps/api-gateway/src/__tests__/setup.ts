import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '../../.env' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-2dots1line-v7';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/2d1l_dev';

console.log('🔧 Test environment setup complete');
console.log(`📊 Database URL: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')}`);
console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET?.substring(0, 10)}...`); 