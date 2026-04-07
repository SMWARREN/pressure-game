# Quick Deploy Guide — Do This Now

## TL;DR: 6 Commands to Fix Production

Run these commands locally, then upload to your server.

### 1. Build frontend with fixed API URL
```bash
npm run build
```
✅ Done: `apps/web/dist/` is ready to deploy

### 2. Upload frontend to web root
```bash
# Example with scp
scp -r apps/web/dist/* user@pressure.click:/var/www/html/

# Or with rsync (better for large files)
rsync -avz apps/web/dist/ user@pressure.click:/var/www/html/
```

### 3. Upload backend to /api/ directory
```bash
# Create /api directory if it doesn't exist
ssh user@pressure.click "mkdir -p /var/www/html/api"

# Upload all PHP files
scp apps/server/*.php user@pressure.click:/var/www/html/api/
scp apps/server/.htaccess user@pressure.click:/var/www/html/api/
scp -r apps/server/src user@pressure.click:/var/www/html/api/
```

### 4. Enable mod_rewrite on server
```bash
ssh user@pressure.click
sudo a2enmod rewrite
sudo systemctl restart apache2
exit
```

### 5. Set permissions on server
```bash
ssh user@pressure.click
chmod 755 /var/www/html/api
chmod 644 /var/www/html/api/*.php
chmod 755 /var/www/html/api/src
find /var/www/html/api/src -type f -exec chmod 644 {} \;
exit
```

### 6. Test API
```bash
curl -i https://pressure.click/api/data/test
```

Expected response:
```
HTTP/2 200
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{"status":"ok","time":"2026-03-28T...","database":"connected"}
```

---

## What Was Fixed ✅

- [x] `.env` changed from `http://pressure.click` → `https://pressure.click`
- [x] Frontend rebuilt with correct API URL
- [x] Backend already has CORS headers configured
- [x] Three detailed guides created for reference

---

## What You Need to Do 📋

1. Run **`npm run build`** locally
2. Upload **`apps/web/dist/*`** to your web root
3. Upload **`apps/server/*`** to your `/api/` directory
4. SSH to server and run:
   - `sudo a2enmod rewrite && sudo systemctl restart apache2`
   - Set file permissions (see step 5 above)
5. Test with curl command above
6. Visit https://www.pressure.click/ in browser

---

## Reference Docs

For detailed explanations and troubleshooting:

- **PRODUCTION_PROBLEMS_EXPLAINED.md** — Why it broke, how it works
- **PRODUCTION_CHECKLIST.md** — Step-by-step with all details
- **DEPLOYMENT.md** — Architecture and configuration

---

## Test in Browser

Once deployed, open https://www.pressure.click/ and check console:

```javascript
fetch('https://pressure.click/api/data/test')
  .then(r => r.json())
  .then(d => console.log('✅ API works:', d))
  .catch(e => console.error('❌ API failed:', e));
```

Should see: `✅ API works: {status: "ok", ...}`

---

## Hosting Notes

If using cPanel:
- Web root is typically `/home/username/public_html/`
- File manager available in cPanel
- SSH access available through Terminal

If using VPS/Dedicated:
- Web root is typically `/var/www/html/`
- Use SSH (PuTTY, Terminal) to connect
- Use `scp` or `rsync` to upload files

If using FTP:
- Upload `dist/` files to root folder
- Upload `api/` folder to root
- May need to enable mod_rewrite in hosting control panel

---

## Still Stuck?

1. Check **PRODUCTION_CHECKLIST.md** troubleshooting section
2. Run the health check commands (curl, browser console)
3. Check server error logs:
   ```bash
   tail -f /var/log/apache2/error.log
   ```
4. Verify files exist on server:
   ```bash
   ssh user@pressure.click ls -la /var/www/html/
   ssh user@pressure.click ls -la /var/www/html/api/
   ```
