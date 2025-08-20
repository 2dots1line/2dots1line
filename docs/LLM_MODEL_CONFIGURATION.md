# LLM Model Configuration Guide

## Overview

The 2dots1line system now uses an **environment-first** approach for LLM model selection, providing a more reliable and straightforward way to configure which models are used for different tasks.

## Configuration Hierarchy

The system follows this precedence order (highest to lowest priority):

1. **Environment Variables** (`.env` file or system environment)
2. **JSON Configuration** (`config/gemini_models.json`)
3. **Hardcoded Fallbacks** (built into the code)

## Environment Variables

### Primary Configuration Variables

Add these to your `.env` file to control model selection:

```bash
# Chat and conversation models
LLM_CHAT_MODEL=gemini-2.5-flash
LLM_VISION_MODEL=gemini-2.5-flash
LLM_EMBEDDING_MODEL=text-embedding-004
LLM_FALLBACK_MODEL=gemini-2.0-flash-exp
```

### Available Models

#### Chat Models
- `gemini-2.5-flash` (recommended)
- `gemini-2.0-flash-exp`
- `gemini-1.5-flash`

#### Vision Models
- `gemini-2.5-flash` (recommended)
- `gemini-2.0-flash-exp`
- `gemini-1.5-flash`

#### Embedding Models
- `text-embedding-004` (recommended)

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp envexample.md .env
   ```

2. **Edit `.env` and set your models:**
   ```bash
   # Set your preferred models
   LLM_CHAT_MODEL=gemini-2.5-flash
   LLM_VISION_MODEL=gemini-2.5-flash
   LLM_EMBEDDING_MODEL=text-embedding-004
   LLM_FALLBACK_MODEL=gemini-2.0-flash-exp
   
   # Don't forget your API key
   GOOGLE_API_KEY=your_actual_api_key_here
   ```

3. **Validate your configuration:**
   ```bash
   node scripts/validate-llm-config.js
   ```

## Troubleshooting

### Model Not Changing

If you're still seeing the old model being used:

1. **Check environment variables:**
   ```bash
   node scripts/validate-llm-config.js
   ```

2. **Restart your services:**
   ```bash
   # Stop all services
   docker-compose down
   
   # Start fresh
   docker-compose up -d
   ```

3. **Clear any cached configurations:**
   ```bash
   # Clear Redis cache if using
   redis-cli flushall
   ```

### Common Issues

#### Issue: Still using gemini-1.5-flash
**Solution:** Ensure your `.env` file has the correct variables and restart services.

#### Issue: Environment variables not being read
**Solution:** Check that your `.env` file is in the project root and properly formatted.

#### Issue: JSON configuration overriding environment
**Solution:** The system should prioritize environment variables. Check the validation script output.

## Advanced Configuration

### Using Different Models for Different Environments

You can use different `.env` files for different environments:

```bash
# Development
.env.development
LLM_CHAT_MODEL=gemini-2.5-flash

# Production
.env.production
LLM_CHAT_MODEL=gemini-2.0-flash-exp

# Testing
.env.test
LLM_CHAT_MODEL=gemini-1.5-flash
```

### Programmatic Configuration

You can also set environment variables programmatically:

```bash
export LLM_CHAT_MODEL=gemini-2.5-flash
export LLM_VISION_MODEL=gemini-2.5-flash
```

### Docker Environment Variables

When using Docker, you can pass environment variables:

```yaml
# docker-compose.yml
services:
  dialogue-service:
    environment:
      - LLM_CHAT_MODEL=gemini-2.5-flash
      - LLM_VISION_MODEL=gemini-2.5-flash
```

## Validation and Monitoring

### Configuration Validation Script

Run the validation script to check your configuration:

```bash
node scripts/validate-llm-config.js
```

This will show:
- Current active configuration
- Environment variable status
- JSON configuration details
- Configuration precedence

### Logging

The system provides detailed logging about model selection:

```
🔧 EnvironmentModelConfigService: Using environment variable for chat: gemini-2.5-flash
🤖 LLMChatTool: Initializing with model gemini-2.5-flash
```

## Migration from JSON Configuration

If you were previously using only the JSON configuration:

1. **Keep your JSON config as fallback:**
   The system will still use `config/gemini_models.json` if environment variables are not set.

2. **Add environment variables for control:**
   Set the environment variables in your `.env` file to override the JSON configuration.

3. **Test the new configuration:**
   Use the validation script to ensure everything is working correctly.

## Best Practices

1. **Use environment variables for active control**
2. **Keep JSON configuration as documentation/fallback**
3. **Validate configuration before deployment**
4. **Use different models for different environments**
5. **Monitor logs for model selection confirmation**

## Support

If you encounter issues:

1. Run the validation script: `node scripts/validate-llm-config.js`
2. Check the logs for model selection messages
3. Ensure your `.env` file is properly formatted
4. Restart services after configuration changes
