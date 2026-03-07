# Quick Start — MySQL + PHP Backend

Get your Pressure game connected to MySQL in 5 minutes.

## TL;DR

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE pressure_game;"
mysql -u root -p -e "CREATE USER 'pressure_user'@'localhost' IDENTIFIED BY 'your_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON pressure_game.* TO 'pressure_user'@'localhost';"

# 2. Configure .env
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Start PHP server
php -S localhost:8000

# 4. Configure frontend (in another terminal)
# Edit .env:
VITE_PERSISTENCE_BACKEND=syncing
VITE_API_URL=http://localhost:8000/api.php

# 5. Start frontend
npm run dev
```

Done! Your game data now syncs with MySQL.

---

## Step-by-Step Setup

### Step 1: Create MySQL Database

```bash
# Connect to MySQL
mysql -u root -p

# In MySQL shell:
CREATE DATABASE pressure_game;
CREATE USER 'pressure_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON pressure_game.* TO 'pressure_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Or use a single command:

```bash
mysql -u root -p << EOF
CREATE DATABASE pressure_game;
CREATE USER 'pressure_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON pressure_game.* TO 'pressure_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### Step 2: Configure Environment

Copy and edit `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Frontend
VITE_PERSISTENCE_BACKEND=syncing
VITE_API_URL=http://localhost:8000/api.php
VITE_USER_ID=user123

# Backend MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=pressure_user
MYSQL_PASSWORD=secure_password
MYSQL_DATABASE=pressure_game
```

### Step 3: Start PHP Server

```bash
php -S localhost:8000
```

You should see:
```
[Wed Mar  6 10:00:00 2026] PHP 8.1.0 Development Server started...
```

### Step 4: Test the Server

In a new terminal:

```bash
# Health check
curl http://localhost:8000/api.php/api/health

# Should return:
# {"status":"ok","time":"2026-03-06T10:00:00+00:00","database":"connected"}
```

### Step 5: Start Frontend

In another terminal:

```bash
npm run dev
```

Open browser to `http://localhost:5173`

### Step 6: Test Offline Sync

1. **Play a level** — game saves to MySQL automatically
2. **Disconnect internet** — game still works, saves to localStorage
3. **Reconnect internet** — changes sync back to MySQL

Check the browser console for sync messages:
```
[SyncingBackend] Successfully synced changes to server
```

---

## Usage Options

### Option 1: Offline-First with Sync (Recommended)

Use `SyncingBackend` for best UX:

```env
VITE_PERSISTENCE_BACKEND=syncing
VITE_API_URL=http://localhost:8000/api.php
```

**Benefits:**
- ✅ Works offline
- ✅ Auto-syncs when online
- ✅ No data loss on disconnect

**Default in .env.example**

### Option 2: Direct MySQL (Online Only)

Use `MySQLBackend` if you want cloud-only storage:

```env
VITE_PERSISTENCE_BACKEND=database
VITE_API_URL=http://localhost:8000/api.php
VITE_USER_ID=user123
```

**Benefits:**
- ✅ Single source of truth
- ✅ No local cache issues
- ❌ Doesn't work offline

### Option 3: Development (localStorage)

```env
VITE_PERSISTENCE_BACKEND=localStorage
```

**Benefits:**
- ✅ No server needed
- ✅ Fast
- ❌ No data persistence

---

## Verify Setup

Check that everything is working:

```bash
# 1. PHP server running
curl http://localhost:8000/api.php/api/health
# Should show: {"status":"ok",...}

# 2. Database connected
mysql -u pressure_user -p pressure_game -e "SHOW TABLES;"
# Should show: game_data table

# 3. Frontend loading
# Open http://localhost:5173 in browser
# Check Network tab for /api/data calls

# 4. Save a game
# Play a level, check MySQL:
mysql -u pressure_user -p pressure_game -e "SELECT * FROM game_data;"
```

---

## Troubleshooting

### "Cannot connect to MySQL"
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Check credentials in .env
grep MYSQL .env
```

### "API endpoint not found"
```bash
# Verify PHP server running
curl http://localhost:8000/api.php/api/health

# Check VITE_API_URL in .env
grep VITE_API_URL .env
```

### "Data not syncing"
```bash
# Open browser console (F12)
# Look for errors in Network tab
# Check SyncingBackend status: navigator.onLine
```

### "CORS errors"
```bash
# api.php has CORS enabled by default
# If using different domain, ensure VITE_API_URL is correct
grep VITE_API_URL .env
```

---

## Database Contents

After playing a few levels, your database should contain:

```sql
SELECT user_id, data_key, SUBSTR(data_value, 1, 50) as preview
FROM game_data
LIMIT 5;
```

You'll see entries like:
- `pressure_save_v3` — Main game state
- `pressure_unlimited_highscores` — High scores
- `walkthrough-classic-1` — Walkthrough progress
- `state-editor-presets` — Editor presets (if used)

---

## Next Steps

1. ✅ Database created
2. ✅ PHP server running
3. ✅ Frontend connected
4. 📊 **Monitor data**: `SELECT COUNT(*) FROM game_data;`
5. 🔒 **Add authentication**: Update `api.php` to validate user_id
6. 🚀 **Deploy**: Copy to production server
7. 📱 **Test mobile**: Install PWA, test offline

---

## Production Deployment

See `SETUP_PHP_SERVER.md` for:
- Apache/Nginx setup
- Docker configuration
- Security hardening
- Performance tuning

---

## File Reference

| File | Purpose |
|------|---------|
| `api.php` | PHP backend (handles API requests) |
| `.env` | Configuration (database credentials) |
| `SETUP_PHP_SERVER.md` | Detailed setup guide |
| `PERSISTENCE_BACKENDS.md` | All backend options |

---

## Support

If you get stuck:

1. Check browser console (F12 → Console tab)
2. Check PHP server output
3. Check MySQL error log: `tail -f /var/log/mysql/error.log`
4. Run health check: `curl http://localhost:8000/api.php/api/health`

---

Enjoy your offline-first game! 🎮
