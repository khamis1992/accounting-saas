# Railway Deployment Setup Guide

## Problem Diagnosed

Railway deployment was failing with:
```
Error: Cannot find module '/app/dist/main'
```

### Root Causes:
1. **Incorrect Start Path**: The `start:prod` script in `backend/package.json` was pointing to `dist/main` but NestJS compiles to `dist/src/main`
2. **Conflicting Configuration**: Multiple configuration files (Dockerfile, Procfile, nixpacks.toml, railway.json) were confusing Railway's build system
3. **No Root Directory Specification**: Railway wasn't explicitly told to use `backend/` as the root directory

---

## Solution Implemented

### 1. Fixed Package.json Start Command
**File**: `backend/package.json`

**Changed from**:
```json
"start:prod": "node dist/main"
```

**Changed to**:
```json
"start:prod": "node dist/src/main"
```

### 2. Cleaned Up Configuration Files
**Removed conflicting files** from `backend/`:
- `backend/Dockerfile`
- `backend/Procfile`
- `backend/nixpacks.toml`
- `backend/railway.json`

### 3. Added Proper Railway Configuration

**Created**: `railway.json` (at repository root)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  }
}
```

**Updated**: `backend/.railway/railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build",
    "watchPatterns": ["src/**"]
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## Railway Dashboard Configuration Steps

### CRITICAL: Root Directory Setting

**This is the most important step!** Railway MUST be configured to use `backend/` as the root directory.

1. Go to your Railway project: https://railway.com/project/4895c287-d49e-4025-bcf4-c3195097fca3
2. Click on your backend service
3. Go to **Settings** tab
4. Find **Root Directory** field
5. Set it to: `backend`
6. Click **Save Changes**

### Verify Build Settings

In the Railway dashboard, under your service's **Settings**:

1. **Builder**: Should be `NIXPACKS`
2. **Build Command**: Should be `npm run build`
3. **Start Command**: Should be `npm run start:prod`

These should be automatically detected from the `.railway/railway.json` file, but verify them.

---

## How Railway Will Now Build and Deploy

### Build Phase (runs automatically):
```bash
cd /app (which is the backend/ directory)
npm install
npm run build  # This creates dist/src/main.js
```

### Start Phase (runs after build):
```bash
npm run start:prod  # This runs: node dist/src/main
```

---

## Verification Steps

### 1. Monitor the Build
After pushing the latest commit, go to Railway and watch the build logs:

1. Railway should automatically detect the new commit
2. Click on **Deployments** tab
3. Click on the latest deployment
4. Click on **View Logs**

**Expected to see**:
```
Building...
npm install
npm run build

[build output showing TypeScript compilation]

Starting...
npm run start:prod
node dist/src/main

[Nest] ... LOG Starting Nest application...
[Nest] ... LOG Nest application successfully started
```

### 2. Check Health Endpoint
Once deployed, the service should respond to:
```
https://github-production-b6e4.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {...},
  "error": {},
  "details": {...}
}
```

### 3. Verify API is Running
Test the main API endpoint:
```
https://github-production-b6e4.up.railway.app/
```

---

## Troubleshooting

### If build still fails:

#### Issue: "Cannot find module '/app/dist/main'"
**Cause**: Start command still using wrong path
**Fix**: Verify `backend/package.json` has `"start:prod": "node dist/src/main"`

#### Issue: "Build command not found"
**Cause**: Railway not running build step
**Fix**: Check Railway Settings → Root Directory is set to `backend`

#### Issue: "npm command not found"
**Cause**: Nixpacks not detecting Node.js correctly
**Fix**: Ensure `backend/package.json` exists at root of service

#### Issue: Build succeeds but app crashes immediately
**Cause**: Environment variables missing
**Fix**: Add required environment variables in Railway dashboard:
- `DATABASE_URL`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- etc. (see `backend/.env.production.example`)

---

## Environment Variables Setup

In Railway dashboard, under your service → **Variables** tab, add:

### Required Variables:
```
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=your_postgres_connection_string

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRATION=7d

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email (if using)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
```

**Reference**: See `backend/.env.production.example` for complete list

---

## Testing Locally Before Pushing

To verify the same commands Railway will run:

```bash
cd backend

# Clean build (simulates Railway environment)
rm -rf dist node_modules
npm install
npm run build

# Test start command
npm run start:prod
```

The application should start without errors.

---

## File Structure After Fix

```
accounting-saas/
├── railway.json                  # NEW: Root-level Railway config
├── backend/
│   ├── .railway/
│   │   └── railway.json          # UPDATED: Explicit build/deploy commands
│   ├── package.json              # FIXED: Correct start:prod path
│   ├── src/                      # Source code
│   └── dist/                     # Built by: npm run build
│       └── src/
│           └── main.js           # Entry point
│   ├── Dockerfile                # REMOVED (conflicting)
│   ├── Procfile                  # REMOVED (conflicting)
│   ├── nixpacks.toml             # REMOVED (conflicting)
│   └── railway.json              # REMOVED (conflicting)
```

---

## Deployment URL

Once successfully deployed:
- **URL**: https://github-production-b6e4.up.railway.app
- **Health**: https://github-production-b6e4.up.railway.app/health
- **API Docs** (if Swagger enabled): https://github-production-b6e4.up.railway.app/api

---

## Next Steps

1. ✅ Code fixes pushed to GitHub
2. ⏳ **Configure Railway Dashboard** (Root Directory = `backend`)
3. ⏳ Monitor build logs for successful deployment
4. ⏳ Test health endpoint
5. ⏳ Configure environment variables if not already done
6. ⏳ Test API endpoints

---

## Commit Reference

**Commit**: `ad3fb1d`
**Message**: "fix: resolve Railway deployment build and start issues"

**Changes**:
- Fixed `backend/package.json` start:prod path
- Updated `backend/.railway/railway.json` with explicit commands
- Added root-level `railway.json`
- Removed conflicting configuration files

---

**Created**: 2026-01-16
**Last Updated**: 2026-01-16
**Status**: Ready for Railway Deployment
