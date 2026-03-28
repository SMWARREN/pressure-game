# Production Deployment Guide — API & CORS Fix

## Problem Summary

Your production site (https://www.pressure.click) is failing with:
1. **Mixed Content Error**: HTTPS page trying to fetch from HTTP endpoint
2. **CORS Error**: No `Access-Control-Allow-Origin` header matching the request origin
3. **[Profile] API URL not configured**: Frontend can't reach backend

## Root Causes

| Issue | Cause | Impact |
|-------|-------|--------|
| Mixed Content | `.env` had `http://pressure.click` instead of `https://` | Browser blocks HTTP requests from HTTPS page |
| CORS Error | Backend returns wildcard `*` but frontend origin is `www.pressure.click` | Different domain causes CORS rejection |
| API URL Missing | `VITE_API_URL` not baked into production build | Runtime can't initialize backend |

---

## Solution: 5 Steps

### ✅ Step 1: Update Frontend Environment (DONE)

**What was done:**
- Changed `.env` from `VITE_API_URL=http://pressure.click/api.php` → `https://pressure.click/api.php`

**What to do next:**
```bash
npm run build
```
This bakes the HTTPS URL into your production bundle.

---

### Step 2: Deploy the Production Build

**Files to upload to your server:**

```
dist/
  ├── index.html
  ├── index-*.js          (main bundle)
  ├── react-vendor-*.js   (React)
  └── assets/             (images, fonts)
```

**Server location:** Deploy to your web root (`/var/www/html/`, `/home/user/public_html/`, etc.)

**How to deploy:**
```bash
# Locally
npm run build

# Upload to server (example — adjust for your host)
scp -r dist/* user@pressure.click:/path/to/webroot/
```

---

### Step 3: Configure Server .htaccess (for routing)

**File:** `apps/server/.htaccess`
**Current content:**
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

**What to do:**
1. Copy `apps/server/.htaccess` to your server's `/api/` directory (or wherever `api.php` lives)
2. **Make sure `mod_rewrite` is enabled** on your server:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

---

### Step 4: Deploy Backend API

**Ensure these files are on your server:**

```
/api/
  ├── .htaccess              (from step 3)
  ├── api.php                (entry point)
  ├── index.php              (bootstrap)
  ├── router.php             (optional: legacy)
  ├── autoload.php           (class loader)
  └── src/                   (all PHP classes)
      ├── Config.php
      ├── Database.php
      ├── Router.php
      └── ...controllers...
```

**Critical permissions:**
```bash
# Allow web server to read files
chmod 755 /api/
chmod 644 /api/*.php
chmod 755 /api/src
chmod 644 /api/src/*.php
```

---

### Step 5: Verify CORS Headers on Backend

**The backend (index.php) already has:**
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
```

**What to do:**
- Test that API responds with CORS headers:
  ```bash
  curl -i https://pressure.click/api/data/test
  ```
  Look for in response:
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
  ```

**If CORS headers are missing:**
1. Verify `index.php` is being called (not `api.php` directly)
2. Check that `.htaccess` is deployed and `mod_rewrite` is enabled
3. Ensure PHP is executing (not serving as text)

---

## Troubleshooting Checklist

- [ ] Frontend build runs: `npm run build` (no errors)
- [ ] `dist/` folder contains `index.html` and JS bundles
- [ ] `dist/` deployed to web root (accessible at `https://www.pressure.click/`)
- [ ] `apps/server/.htaccess` deployed to `/api/` directory
- [ ] Apache `mod_rewrite` enabled: `a2enmod rewrite && systemctl restart apache2`
- [ ] Backend files (`api.php`, `index.php`, `src/`) deployed to `/api/`
- [ ] File permissions allow web server read access (644 for files, 755 for dirs)
- [ ] Test API: `curl -i https://pressure.click/api/data/test`
- [ ] Confirm CORS headers in response: `Access-Control-Allow-Origin: *`
- [ ] Test frontend: navigate to `https://www.pressure.click/` in browser
- [ ] Check browser console for errors (should be none, or only network retries on storage sync)

---

## Quick Health Check

Once deployed, run this in browser console at `https://www.pressure.click`:

```javascript
fetch('https://pressure.click/api/data/test')
  .then(r => {
    console.log('Status:', r.status);
    console.log('CORS headers:', r.headers.get('Access-Control-Allow-Origin'));
    return r.json();
  })
  .then(d => console.log('API response:', d))
  .catch(e => console.error('API error:', e));
```

**Expected:**
- Status: 200
- CORS headers: `*`
- API response: `{status: 'ok', ...}`

---

## Domain/SSL Notes

- Frontend: `https://www.pressure.click` (with `www`)
- API: `https://pressure.click` (without `www`)
- SSL certificate must cover both domains or use a wildcard (`*.pressure.click`)
- If you have a redirect from `pressure.click` → `www.pressure.click`, make sure API stays on `pressure.click`

**If you want to use the same domain:**
- Change `.env`: `VITE_API_URL=https://www.pressure.click/api.php`
- Rebuild: `npm run build`
- Redeploy `dist/`

---

## File Locations Summary

**Frontend (Vite build):**
- Source: `./src/**/*.tsx`
- Build output: `./dist/**/*`
- Deploy to: Web root (e.g., `/var/www/html/`)

**Backend (PHP):**
- Source: `./apps/server/**/*.php`
- Deploy to: `/api/` subdirectory on same server
- Or: Separate domain/server (update `VITE_API_URL` accordingly)

**Config:**
- Frontend env: `./.env` → baked into `npm run build`
- Backend env: `apps/server/.env` (for SonarQube token, optional)
