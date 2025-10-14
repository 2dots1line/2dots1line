# AI Media Generation - Quick Setup Guide
## Get Started in 5 Minutes

---

## 🚀 Quick Start

### Step 1: Run Database Migration

```bash
# Option A: If PostgreSQL is running locally
psql $DATABASE_URL -f packages/database/prisma/migrations/20251013_add_generated_media.sql

# Option B: Using Docker (check your POSTGRES_USER in .env first)
docker exec -i postgres-2d1l psql -U <your_postgres_user> -d twodots1line \
  < packages/database/prisma/migrations/20251013_add_generated_media.sql

# Option C: Manual
# 1. Copy the contents of packages/database/prisma/migrations/20251013_add_generated_media.sql
# 2. Run it in your PostgreSQL client (pgAdmin, DBeaver, etc.)
```

### Step 2: Install Dependencies

```bash
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L

# Install new workspace dependencies
pnpm install
```

### Step 3: Build Packages

```bash
# Build database package
cd packages/database
pnpm run build

# Build media generation service
cd ../../services/media-generation-service
pnpm run build

# Return to root
cd ../..
```

### Step 4: Verify Environment Variables

Make sure these are set in your `.env`:

```bash
# Required for AI generation
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional (for DALL-E support)
OPENAI_API_KEY=your_openai_api_key_here

# Database (should already be set)
DATABASE_URL=postgresql://...

# Redis (should already be set)
REDIS_URL=redis://localhost:6379

# API Gateway (should already be set)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Step 5: Start Services

```bash
# Start Docker services (if not running)
docker-compose -f docker-compose.dev.yml up -d

# Start PM2 workers
pm2 start ecosystem.config.js

# Verify video generation worker is running
pm2 logs video-generation-worker --lines 20
```

### Step 6: Start Development Server

```bash
# In one terminal
cd apps/api-gateway
pnpm run dev

# In another terminal
cd apps/web-app
pnpm run dev
```

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

### 1. Database
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM generated_media;"
# Should return 0 (table exists but empty)
```

### 2. Redis
```bash
redis-cli ping
# Should return PONG
```

### 3. Workers
```bash
pm2 list
# Should show video-generation-worker in "online" status
```

### 4. API Gateway
```bash
curl http://localhost:3001/api/v1/health
# Should return {"status":"ok"}
```

### 5. Web App
```bash
# Open browser to http://localhost:3000
# Login with dev-token
# Open chat and say: "Can you generate a peaceful ocean video?"
```

---

## 🧪 Quick Test

### Test Image Generation
```bash
curl -X POST http://localhost:3000/api/cards/test-card-123/generate-cover \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "motif": "peaceful zen garden with koi pond",
    "style_pack": "nature",
    "export": { "quality": "medium" }
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "image_url": "/covers/test-card-123-1697123456789.png",
  "provider": "gemini",
  "model": "imagen-4"
}
```

### Test Video Generation
```bash
curl -X POST http://localhost:3001/api/v1/media/generate-video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "prompt": "calm ocean waves at golden hour",
    "mood": "calm",
    "quality": "fast",
    "viewContext": "dashboard"
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "jobId": "1234567890",
    "message": "Video generation job started"
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution:** Table already exists, skip migration

### Issue: Worker shows "Redis connection failed"
**Solution:**
```bash
docker-compose -f docker-compose.dev.yml up -d redis-2d1l
redis-cli ping  # Verify it's running
```

### Issue: "Cannot find module '@2dots1line/database'"
**Solution:**
```bash
cd packages/database
pnpm run build
cd ../..
pnpm install  # Re-link workspace dependencies
```

### Issue: TypeScript errors in ChatInterface
**Solution:** These will resolve on build. For now:
```bash
cd apps/web-app
pnpm run build  # Full build will resolve type caching issues
```

### Issue: Video generation hangs
**Solution:** Check worker logs:
```bash
pm2 logs video-generation-worker --lines 50
```

### Issue: WebSocket notifications not working
**Solution:** Verify API Gateway is running on correct port:
```bash
curl http://localhost:3001/socket.io/
# Should return socket.io response
```

---

## 📝 Next Steps

Once setup is complete, you can:

1. **Test in Chat**: Say "Generate a mystical forest background"
2. **Check Settings**: Open Settings modal → Background Media section
3. **View Library**: See "AI Generated Videos" section with your creations
4. **Apply Videos**: Click any generated video to apply it to a view
5. **Delete Old Ones**: Click "×" to remove unwanted videos

---

## 💡 Tips

- **Start with `fast` quality** for video generation (30-60s, $4)
- **Use `standard` quality** for final videos (1-6min, $6)
- **Be specific in prompts** for better results
- **Check costs** before confirming (agent will show estimate)
- **Monitor logs** while testing: `pm2 logs video-generation-worker`

---

## 📚 Additional Resources

- Full implementation details: `IMPLEMENTATION_SUMMARY_AI_MEDIA_GENERATION.md`
- Original plan: `.cursor/plans/ai-media-generation-suite-6630e2ed.plan.md`
- Configuration: `config/agent_capabilities.json`
- Prompt templates: `config/prompt_templates.yaml`

---

## 🎉 Ready to Go!

Your AI Media Generation Suite is now fully set up and ready for testing. Start by asking Dot to generate something creative! 🚀

