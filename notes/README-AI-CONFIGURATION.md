# AI Configuration Guide for 2Dots1Line

This guide explains how to configure and troubleshoot the AI features of the 2Dots1Line application.

## OpenRouter API Configuration

The application uses OpenRouter API to generate AI analysis of children's stories. Follow these steps to configure it:

### 1. Setting Up OpenRouter

1. Create an account at [OpenRouter](https://openrouter.ai/)
2. Generate an API key from your dashboard
3. Add the API key to your `.env` file in the backend directory:

```
OPENROUTER_API_KEY=your_api_key_here
```

### 2. Configuring the AI Model

You can configure which AI model to use by setting the `OPENROUTER_MODEL` environment variable:

```
OPENROUTER_MODEL=deepseek/deepseek-chat
```

Available models that work well with this application:
- `deepseek/deepseek-chat` (default)
- `deepseek/deepseek-r1-zero:free`
- `gryphe/mythomist-7b`

If you experience issues with one model, you can easily switch to another by changing this environment variable.

## Troubleshooting

### Restarting the Backend Server

If the backend server is stuck or port 8000 is in use, you can use the provided scripts to restart it:

#### On macOS/Linux:
```bash
# Make the script executable
chmod +x restart-backend.sh
# Run the script
./restart-backend.sh
```

#### On any platform with Python:
```bash
python restart_backend.py
```

### Common Issues and Solutions

1. **"Error: Load failed" on AI Test page**
   - Check if the backend server is running (`curl http://localhost:8000/health`)
   - Verify your OpenRouter API key is valid
   - Try switching to a different model using the `OPENROUTER_MODEL` environment variable

2. **Backend server won't start due to port in use**
   - Use the restart scripts provided to kill the process and restart the server
   - Manually find and kill the process:
     - On macOS/Linux: `lsof -i :8000 | grep LISTEN` then `kill -9 <PID>`
     - On Windows: `netstat -ano | findstr :8000` then `taskkill /F /PID <PID>`

3. **Slow AI responses**
   - The free tier of OpenRouter has rate limits and can be slow
   - Consider upgrading to a paid plan for faster responses
   - If using a large model, try switching to a smaller, faster model

## Testing the AI Configuration

1. Visit `http://localhost:3000/test-ai` to test the AI service directly
2. Use this page to verify that your OpenRouter connection is working
3. If the test page works but story analysis doesn't, the issue is likely in the analysis-specific code rather than the OpenRouter connection

## API Endpoints

The following backend endpoints are available for testing and configuration:

- `GET /health` - Check if the backend server is running
- `GET /config` - See the current configuration settings
- `GET /test-openrouter` - Test the connection to OpenRouter
- `POST /api/test/ask` - Send a direct question to the AI model
- `POST /api/direct/analyze` - Send a story for analysis

## Child Activation Flow

The application now includes an improved child activation flow:

1. Parents create child accounts which generate activation codes
2. Parents provide these activation codes to their children
3. Children visit `/activate` to enter their code
4. After activation, children complete their account setup with name, email, and password

This ensures a smooth onboarding experience while maintaining control over child accounts. 