require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔧 Environment Check:');
console.log('GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);
console.log('API Key (first 10 chars):', process.env.GOOGLE_API_KEY?.substring(0, 10));

async function testGoogleAPI() {
  try {
    console.log('\n🔍 Testing Google Gemini API...');
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // First, let's list available models
    console.log('📋 Listing available models...');
    try {
      const models = await genAI.listModels();
      console.log('Available models:');
      models.forEach(model => {
        console.log(`- ${model.name} (${model.description || 'No description'})`);
      });
    } catch (listError) {
      console.log('Could not list models:', listError.message);
    }
    
    // Try with the correct model name
    console.log('\n🧪 Testing with gemini-1.5-flash...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Hello, respond with just "API_TEST_SUCCESS" if this works');
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Google API Test Success!');
      console.log('Response:', text);
      console.log('✅ API Key is working correctly');
      return true;
    } catch (flashError) {
      console.log('gemini-1.5-flash failed:', flashError.message);
    }
    
    // Try with gemini-pro-1.5
    console.log('\n🧪 Testing with gemini-1.5-pro...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent('Hello, respond with just "API_TEST_SUCCESS" if this works');
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Google API Test Success!');
      console.log('Response:', text);
      console.log('✅ API Key is working correctly');
      return true;
    } catch (proError) {
      console.log('gemini-1.5-pro failed:', proError.message);
    }
    
  } catch (error) {
    console.log('❌ Google API Test Failed:');
    console.log('Error:', error.message);
    console.log('Error code:', error.code);
    if (error.status) {
      console.log('HTTP Status:', error.status);
    }
    return false;
  }
}

testGoogleAPI(); 