# Production Deployment Checklist

## What's Been Fixed Locally ✅

- [x] Updated `.env` file: `VITE_API_URL=http://...` → `https://pressure.click/api.php`
- [x] Built web app: `npm run build` ✅ (4.41s, no errors)
- [x] Verified backend CORS headers already configured in `apps/server/index.php`

---

## What YOU Need to Do on Your Server

### Phase 1: Deploy Frontend (Website)

**Step 1.1 — Build locally**
```bash
npm run build
```
Output: `apps/web/dist/` folder

**Step 1.2 — Upload to web root**

Upload ALL files from `apps/web/dist/` to your server's public folder:
- If using cPanel: `/home/username/public_html/`
- If using direct SSH: `/var/www/html/` (or wherever your web root is)
- If using FTP: Upload to root directory

Example using `scp`:
```bash
scp -r apps/web/dist/* user@pressure.click:/var/www/html/
```

Example using `rsync`:
```bash
rsync -avz apps/web/dist/ user@pressure.click:/var/www/html/
```

**Files to expect on server:**
```
/var/www/html/
  ├── index.html
  ├── assets/
  │   ├── index-*.js      (main bundle)
  │   ├── react-vendor-*.js
  │   ├── modes-*.js
  │   └── *.css
  └── loading.png
```

**Verify:** Visit `https://www.pressure.click/` in browser. Should see the Pressure game menu.

---

### Phase 2: Deploy Backend (API)

**Step 2.1 — Create API directory**

On your server, create `/api/` directory (or `/api.php` if using a single-file approach):
```bash
mkdir -p /var/www/html/api
cd /var/www/html/api
```

**Step 2.2 — Copy backend files**

Upload everything from `apps/server/` EXCEPT `.git/`, `node_modules/`, `.phpunit.result.cache`:

```
/var/www/html/api/
  ├── .htaccess              ← CRITICAL
  ├── api.php
  ├── index.php              ← Main entry point
  ├── router.php
  ├── autoload.php
  ├── src/                   ← All PHP classes
  │   ├── Config.php
  │   ├── Database.php
  │   ├── Router.php
  │   ├── Controllers/
  │   └── Models/
  ├── .env.example           (optional - for reference)
  └── composer.json          (optional - no deps needed)
```

Example with `scp`:
```bash
scp -r apps/server/*.php user@pressure.click:/var/www/html/api/
scp -r apps/server/.htaccess user@pressure.click:/var/www/html/api/
scp -r apps/server/src user@pressure.click:/var/www/html/api/
```

**Step 2.3 — Set file permissions**

On your server:
```bash
cd /var/www/html/api
chmod 755 .
chmod 644 *.php
chmod 755 src
find src -type f -name '*.php' -exec chmod 644 {} \;
chown -R www-data:www-data /var/www/html/api  # if running as www-data
```

**Step 2.4 — Enable mod_rewrite (Apache only)**

If using Apache, enable the rewrite module:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

Verify it's enabled:
```bash
apache2ctl -M | grep rewrite
# Should output: rewrite_module (shared)
```

**Verify:** Test the API endpoint
```bash
curl -i https://pressure.click/api/data/test
```

Expected response:
```
HTTP/2 200
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Content-Type: application/json; charset=utf-8

{"status":"ok","time":"2026-03-28T...","database":"connected"}
```

---

### Phase 3: Database Configuration (if needed)

If your backend needs database access:

**Step 3.1 — Create `.env` file in `/api/`**

```bash
cd /var/www/html/api
cp .env.example .env
nano .env
```

Edit `.env`:
```bash
# MySQL connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=pressure_game

# Optional: SonarQube token
SONAR_TOKEN=squ_xxxxx
```

**Step 3.2 — Initialize database (if first time)**

If you have a `schema.sql`:
```bash
mysql -u your_db_user -p your_db_password < schema.sql
```

---

## Quick Health Check 🏥

Once everything is deployed, test in your browser console:

```javascript
// Test 1: Frontend is served with HTTPS
console.log('Frontend URL:', window.location.href);
// Expected: https://www.pressure.click/

// Test 2: API endpoint responds with CORS headers
fetch('https://pressure.click/api/data/test')
  .then(r => {
    console.log('Status:', r.status);
    console.log('CORS origin header:', r.headers.get('Access-Control-Allow-Origin'));
    console.log('CORS methods header:', r.headers.get('Access-Control-Allow-Methods'));
    return r.json();
  })
  .then(d => console.log('API response:', d))
  .catch(e => console.error('ERROR:', e.message));

// Expected output:
// Status: 200
// CORS origin header: *
// CORS methods header: GET, POST, DELETE, OPTIONS
// API response: {status: 'ok', ...}
```

---

## Troubleshooting

### "API URL not configured" error

**Cause:** Frontend wasn't rebuilt after `.env` change, or API URL isn't baked into JS

**Fix:**
```bash
npm run build    # Rebuild locally
# Verify .env was updated
cat .env | grep API_URL
# Redeploy dist/ folder
```

### "Mixed Content" error in browser console

**Cause:** Frontend trying to fetch from `http://` instead of `https://`

**Fix:**
```bash
cat .env | grep API_URL
# Should show: VITE_API_URL=https://pressure.click/api.php (with https)
npm run build
# Redeploy
```

### "CORS error: No 'Access-Control-Allow-Origin' header"

**Cause:** API not returning CORS headers, or wrong URL

**Test:**
```bash
curl -i https://pressure.click/api/data/test
# Look for: Access-Control-Allow-Origin: *
```

**Fixes:**
1. Verify `.htaccess` is deployed to `/api/` directory
2. Verify `mod_rewrite` is enabled: `sudo a2enmod rewrite && sudo systemctl restart apache2`
3. Verify `index.php` is being called (not `api.php` directly)
4. Check PHP error logs: `tail -f /var/log/apache2/error.log`

### "Can't find api.php" or "404 on /api/data/*"

**Cause:** `.htaccess` not deployed or `mod_rewrite` disabled

**Fix:**
1. Verify `.htaccess` exists in `/var/www/html/api/.htaccess`
2. Verify it contains the rewrite rule: `RewriteRule ^(.*)$ api.php [L,QSA]`
3. Enable `mod_rewrite`: `sudo a2enmod rewrite && sudo systemctl restart apache2`
4. Verify `AllowOverride` is set to `All` in Apache config for the `/api/` directory

### Frontend loads but no game renders

**Cause:** JavaScript bundle not loaded or JS errors

**Fix:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab: are all `.js` files loading? (200 status)
- If 404s on `.js` files, verify they were uploaded to `dist/assets/`

---

## File Deployment Summary

| What | Where | How |
|------|-------|-----|
| Frontend (website) | `https://www.pressure.click/` | Upload `apps/web/dist/*` to web root |
| Backend (API) | `https://pressure.click/api/*` | Upload `apps/server/*` to `/api/` subdir |
| Config (frontend) | `.env` | Already updated locally to use HTTPS |
| Config (backend) | `apps/server/.env` | Optional, only if using database |
| Routing rules | `/api/.htaccess` | Must be deployed to `/api/` directory |

---

## Domain Configuration Notes

**Current setup:**
- Frontend: `https://www.pressure.click` (with www)
- API: `https://pressure.click` (without www)

**SSL certificate requirement:**
- Must cover both `www.pressure.click` and `pressure.click`
- OR use a wildcard: `*.pressure.click`

**To use same domain for both:**
1. Edit `.env`: `VITE_API_URL=https://www.pressure.click/api.php`
2. Rebuild: `npm run build`
3. Deploy both `dist/` and `/api/` to same root
4. OR redirect one domain to the other (e.g., `pressure.click` → `www.pressure.click`)

---

## Completion Checklist

After deployment, verify each step:

- [ ] Frontend files uploaded to web root
- [ ] Can visit `https://www.pressure.click/` in browser
- [ ] Game menu loads (no 404s on `.js` files)
- [ ] Backend files uploaded to `/api/` directory
- [ ] `.htaccess` present in `/api/` directory
- [ ] `mod_rewrite` enabled (Apache)
- [ ] File permissions set (755 for dirs, 644 for files)
- [ ] API endpoint responds: `curl https://pressure.click/api/data/test`
- [ ] CORS headers present: `Access-Control-Allow-Origin: *`
- [ ] Browser console health check passes (all 3 tests)
- [ ] Can play a game (loads level, accepts input, saves progress)
- [ ] Leaderboard sync works (check Network tab for successful API calls)

---

## Getting Help

If you get stuck:

1. **Check browser console** (F12 → Console tab)
   - Look for error messages
   - Screenshot and share

2. **Check server logs:**
   ```bash
   # Apache error log
   tail -f /var/log/apache2/error.log
   # PHP error log (if configured)
   tail -f /var/log/php-errors.log
   ```

3. **Test API manually:**
   ```bash
   curl -v https://pressure.click/api/data/test
   ```

4. **Review DEPLOYMENT.md** for detailed explanation of each step

---

## What Not To Do ❌

- Don't upload `node_modules/` (it's huge and unnecessary)
- Don't upload `.git/` directory (not needed in production)
- Don't edit production files directly (always rebuild + redeploy)
- Don't forget to set file permissions (will cause 403 Forbidden)
- Don't mix HTTP and HTTPS (must use HTTPS everywhere on production)
