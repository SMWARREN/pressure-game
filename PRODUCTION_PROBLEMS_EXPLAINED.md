# Production Problems Explained — Why It Broke & How It's Fixed

## The Three Errors You Saw

### 1. Mixed Content Error
```
Mixed Content: The page at 'https://www.pressure.click/' was loaded over HTTPS,
but requested an insecure resource 'http://pressure.click/api/data/user_*/pressure_storage_v1'.
This request has been blocked
```

**What this means:**
- Your website is served over HTTPS (secure)
- But the code was trying to fetch from HTTP (insecure)
- Modern browsers block this for security reasons

**Root cause:**
- `.env` file had: `VITE_API_URL=http://pressure.click/api.php`
- Should have been: `VITE_API_URL=https://pressure.click/api.php`

**Why it happened:**
- Probably copied from local dev environment where HTTP is fine
- `.env` wasn't updated before deploying to production

**Fixed by:**
- Changing `.env` to use HTTPS
- Rebuilding: `npm run build`
- Redeploying the new `dist/` folder

---

### 2. CORS Error
```
Access to fetch at 'https://pressure.click/api/data/...' from origin
'https://www.pressure.click' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header
```

**What this means:**
- Frontend (at `www.pressure.click`) is trying to fetch from API (at `pressure.click`)
- These are technically different domains/origins in browser security model
- API must explicitly allow requests from `www.pressure.click`

**Why it happens:**
The browser's Same-Origin Policy says:
- `https://www.pressure.click/page` can only fetch from `https://www.pressure.click/*`
- Fetching from `https://pressure.click/*` requires explicit CORS permission

**What CORS headers look like:**

**API must send:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Status:**
- ✅ Your backend (`apps/server/index.php`) **already has these headers**
- The issue is that the backend wasn't being called properly (wrong URL, missing routing)

---

### 3. API URL Not Configured Error
```
[Profile] API URL not configured
```

**What this means:**
- Frontend code checked `VITE_API_URL` environment variable
- It was either empty, undefined, or not baked into the JavaScript bundle

**Root cause:**
- `.env` is only read during `npm run build`
- If you don't rebuild after editing `.env`, old code runs with empty API URL
- The deployed JavaScript still has the old (empty or wrong) API URL

**How env variables work in Vite (React):**

```
┌─────────────────────────────────────────┐
│ Local: .env                             │
│ VITE_API_URL=https://pressure.click/api │
└─────────────────────────────────────────┘
          ↓ (npm run build)
┌─────────────────────────────────────────┐
│ Build output: dist/assets/*.js          │
│ (hard-coded value)                      │
│ const apiUrl = 'https://pressure.click' │
└─────────────────────────────────────────┘
          ↓ (upload to server)
┌─────────────────────────────────────────┐
│ Production: https://www.pressure.click  │
│ Browser runs the hard-coded JS          │
└─────────────────────────────────────────┘
```

**Key point:** The `.env` file is **not** uploaded to production. It's only used during the build. The values are "baked in" to the JavaScript.

**Fixed by:**
1. Editing `.env` locally
2. Running `npm run build` (bundles the new URL)
3. Uploading `dist/` folder to server

---

## Architecture Overview

### Current Setup (What You Have)

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (React/Vite)                                       │
├──────────────────────────────────────────────────────────────┤
│  apps/web/                                                   │
│  ├── src/                 ← TypeScript/React code            │
│  │   ├── game/            ← Game logic                        │
│  │   ├── api/             ← API client calls (leaderboards)   │
│  │   └── ...              ← UI components                     │
│  ├── vite.config.ts       ← Build config                      │
│  └── dist/                ← Build output (what to deploy)     │
│      ├── index.html                                          │
│      ├── assets/*.js      ← Hard-coded VITE_API_URL here    │
│      └── assets/*.css                                        │
│                                                              │
│  Deployment: Upload dist/ to web root                        │
│  Access: https://www.pressure.click/                         │
└──────────────────────────────────────────────────────────────┘
                            ↓ (fetch calls)
┌──────────────────────────────────────────────────────────────┐
│  BACKEND (PHP)                                               │
├──────────────────────────────────────────────────────────────┤
│  apps/server/                                                │
│  ├── index.php            ← Bootstrap, CORS headers          │
│  ├── api.php              ← Entry point                       │
│  ├── router.php           ← Route dispatcher                  │
│  ├── autoload.php         ← Class loader                      │
│  └── src/                 ← PHP classes                       │
│      ├── Config.php       ← Env/config loading               │
│      ├── Database.php     ← MySQL connection                  │
│      ├── Router.php       ← Route handler                     │
│      └── Controllers/     ← API endpoints                     │
│                                                              │
│  Deployment: Upload to /api/ subdirectory                    │
│  Access: https://pressure.click/api/data/*                   │
└──────────────────────────────────────────────────────────────┘
```

### How a Request Flows

**User plays a game on `https://www.pressure.click/`:**

```
1. Browser loads index.html
   ↓
2. JavaScript runs (assets/index-*.js)
   - Contains hard-coded VITE_API_URL from .env
   - Starts game, player completes level
   ↓
3. Frontend calls saveHighscore()
   - Calls fetch('https://pressure.click/api/highscore/...')
   ↓
4. Browser makes HTTP request
   - ORIGIN: https://www.pressure.click
   - URL: https://pressure.click/api/highscore/...
   ↓
5. Server receives request at /api/
   - .htaccess routes to api.php
   - api.php calls index.php
   - index.php sets CORS headers:
     - Access-Control-Allow-Origin: *
     - Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
   ↓
6. index.php dispatches to Router
   - Router finds Controller (e.g., HighscoreController)
   - Controller processes the request, queries database
   ↓
7. Server responds with JSON
   - Includes CORS headers (browser checks)
   - Includes actual data (200 OK)
   ↓
8. Browser receives response
   - Checks CORS headers: ✅ "Access-Control-Allow-Origin: *"
   - Allows frontend to read the data
   ↓
9. Frontend code processes response
   - Updates leaderboard
   - Shows "Score saved!" message
   ↓
10. User is happy
```

---

## Why .htaccess is Critical

Your `.htaccess` file in `/api/` directory:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite actual files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Route everything to api.php
  RewriteRule ^(.*)$ api.php [L,QSA]
</IfModule>
```

**What it does:**

```
Request:  GET /api/highscore/user123/classic/1
           ↓ (mod_rewrite rewrites to)
Actual:   GET /api/api.php
           ↓ (api.php requires index.php)
Router:   Router::dispatch('GET', ['highscore', 'user123', ...], $db)
```

Without this `.htaccess`:
- `/api/highscore/user123/classic/1` → 404 (file not found)
- Browser can't reach the API

With `.htaccess`:
- `/api/highscore/user123/classic/1` → `api.php` → works ✅

---

## Why Different Domains (www vs non-www)?

**Current architecture:**
- Frontend: `https://www.pressure.click` (with www)
- API: `https://pressure.click` (without www)

**Why?**
- DNS usually sets `www.pressure.click` → CDN or hosting
- API often runs on root domain for simplicity
- Modern browsers treat them as different origins (CORS required)

**If you want to unify them:**

Option A (use `www` for everything):
```bash
# Edit .env
VITE_API_URL=https://www.pressure.click/api.php

# Deploy both frontend and backend to www
# Frontend: https://www.pressure.click/ (dist files)
# Backend: https://www.pressure.click/api/ (PHP files)
```

Option B (use root domain for everything):
```bash
# Edit .env
VITE_API_URL=https://pressure.click/api.php

# Configure DNS/server to redirect www → root
# Or just access via https://pressure.click/
```

Option C (current - keep separate):
```bash
# Frontend on www, API on root
# This is fine, just need CORS headers (already configured)
```

**Current setup is actually good** because:
- Separation of concerns
- API could scale to different server later
- No conflicts between static files and PHP routes

---

## Summary: What Was Wrong & What's Fixed

| Issue | Was | Now | Fixed By |
|-------|-----|-----|----------|
| **API URL scheme** | `http://` (insecure) | `https://` | Edit `.env`, rebuild |
| **API domain origin** | Wrong | `pressure.click` (no www) | ✅ Already correct |
| **CORS headers** | ❌ Missing | ✅ Configured | ✅ Already in PHP |
| **Frontend JS build** | Had old/no API URL | ✅ Fresh build | `npm run build` |
| **.htaccess deployed** | ❌ Missing? | Need to deploy | Upload to `/api/` |

---

## Next Steps

1. **Rebuild locally:**
   ```bash
   npm run build
   ```

2. **Deploy frontend:**
   ```bash
   # Upload apps/web/dist/* to web root
   scp -r apps/web/dist/* user@pressure.click:/var/www/html/
   ```

3. **Deploy backend:**
   ```bash
   # Upload apps/server/* to /api/ directory
   scp -r apps/server/*.php user@pressure.click:/var/www/html/api/
   scp apps/server/.htaccess user@pressure.click:/var/www/html/api/
   scp -r apps/server/src user@pressure.click:/var/www/html/api/
   ```

4. **Enable mod_rewrite:**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

5. **Set permissions:**
   ```bash
   chmod 755 /var/www/html/api
   chmod 644 /var/www/html/api/*.php
   chmod 755 /var/www/html/api/src
   find /var/www/html/api/src -type f -exec chmod 644 {} \;
   ```

6. **Test:**
   ```bash
   curl https://pressure.click/api/data/test
   # Should see: {"status":"ok",...}
   ```

See **PRODUCTION_CHECKLIST.md** for step-by-step instructions.
