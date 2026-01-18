# Railway Deployment - Quick Start

## What Was Fixed

### The Error
```
Error: Cannot find module '/app/dist/main'
```

### The Solution
Changed `backend/package.json` line 14:
```diff
- "start:prod": "node dist/main",
+ "start:prod": "node dist/src/main",
```

That's it! The path was wrong.

---

## What You Must Do in Railway

### 1. Go to Railway Dashboard
https://railway.com/project/4895c287-d49e-4025-bcf4-c3195097fca3

### 2. Click on Your Service

### 3. Go to Settings Tab

### 4. Find "Root Directory" Field

### 5. Set it to: `backend`

### 6. Click Save

### 7. Wait for Automatic Redeploy

Railway will detect the new commit and rebuild.

---

## Expected Timeline

1. **Immediate**: Railway detects new commit (1-2 minutes)
2. **Build Phase**: npm install + npm run build (3-5 minutes)
3. **Start Phase**: node dist/src/main (1 minute)
4. **Total**: ~5-10 minutes

---

## How to Verify Success

### Check Logs
In Railway dashboard:
1. Click on latest deployment
2. Click "View Logs"
3. Should see: `Nest application successfully started`

### Test Health Endpoint
```bash
curl https://github-production-b6e4.up.railway.app/health
```

Should return JSON with `"status": "ok"`

---

## Configuration Files Changed

### ✅ Added/Updated:
- `railway.json` (root level)
- `backend/.railway/railway.json` (explicit commands)
- `backend/package.json` (fixed path)

### ❌ Removed (conflicting):
- `backend/Dockerfile`
- `backend/Procfile`
- `backend/nixpacks.toml`
- `backend/railway.json`

---

## If It Still Fails

### Check 1: Root Directory
Settings → Root Directory = `backend` ⚠️ **MOST IMPORTANT**

### Check 2: Build Logs
Look for "npm run build" - this must run

### Check 3: Start Command
Look for "node dist/src/main" - not "dist/main"

### Check 4: Environment Variables
Settings → Variables → Add missing ones from `.env.production.example`

---

## Git Commit

**Hash**: `ad3fb1d`
**Branch**: `main`
**Pushed**: Yes ✅

---

**Status**: Ready to Deploy
**Next Action**: Configure Railway Root Directory setting
