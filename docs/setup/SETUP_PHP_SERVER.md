# Setup PHP Server with MySQL

This guide shows how to set up the PHP backend server for the Pressure Game.

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- PHP `mysqli` extension enabled
- Web server (Apache, Nginx, etc.) or PHP built-in server

## Installation Steps

### 1. Create `.env` File

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
# Persistence Configuration
VITE_PERSISTENCE_BACKEND=syncing
VITE_API_URL=http://localhost:8000/api.php
VITE_USER_ID=user123

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=pressure_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=pressure_game
```

### 2. Create MySQL Database

Connect to MySQL and create the database:

```sql
CREATE DATABASE pressure_game;
CREATE USER 'pressure_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON pressure_game.* TO 'pressure_user'@'localhost';
FLUSH PRIVILEGES;
```

Or from command line:

```bash
mysql -u root -p -e "CREATE DATABASE pressure_game;"
mysql -u root -p -e "CREATE USER 'pressure_user'@'localhost' IDENTIFIED BY 'your_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON pressure_game.* TO 'pressure_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### 3. Place PHP Server File

Option A: Use PHP built-in server (development only)

```bash
# In project root
php -S localhost:8000
```

Option B: Deploy to web server (production)

```bash
# Copy to web server root
cp api.php /var/www/html/

# Or in a subdirectory
cp api.php /var/www/html/pressure-game/
```

Update `VITE_API_URL` accordingly:
```env
VITE_API_URL=http://your-domain/api.php
# or
VITE_API_URL=http://your-domain/pressure-game/api.php
```

## Development Setup

### Local Testing

1. **Start MySQL:**
   ```bash
   # macOS with Homebrew
   brew services start mysql

   # Linux
   sudo systemctl start mysql

   # Windows
   mysql -u root -p
   ```

2. **Start PHP server:**
   ```bash
   php -S localhost:8000
   ```

3. **Update .env:**
   ```env
   VITE_PERSISTENCE_BACKEND=syncing
   VITE_API_URL=http://localhost:8000/api.php
   VITE_USER_ID=dev-user-123
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```

5. **Access the game:**
   - Open http://localhost:5173
   - Game data now syncs with MySQL!

## Frontend Configuration

In your React app, use the MySQLBackend:

```typescript
// src/game/GameProviders.tsx or src/main.tsx
import { MySQLBackend, SyncingBackend } from '@/game/engine/persistence';
import { createPressureEngine } from '@/game/engine';

// Option 1: Direct MySQL (online only)
const mysqlBackend = new MySQLBackend(
  import.meta.env.VITE_API_URL,
  import.meta.env.VITE_USER_ID
);
const engine = createPressureEngine({ persistenceBackend: mysqlBackend });

// Option 2: Offline-first with sync (recommended)
const syncBackend = new SyncingBackend(import.meta.env.VITE_API_URL);
const engine = createPressureEngine({ persistenceBackend: syncBackend });
```

Or configure in GameEngineProvider:

```typescript
export function GameEngineProvider({ children }: GameEngineProviderProps) {
  const persistenceBackend =
    import.meta.env.VITE_PERSISTENCE_BACKEND === 'syncing'
      ? new SyncingBackend(import.meta.env.VITE_API_URL)
      : new MySQLBackend(
          import.meta.env.VITE_API_URL,
          import.meta.env.VITE_USER_ID
        );

  const engine = createPressureEngine({ persistenceBackend });
  // ...
}
```

## API Endpoints

The PHP server provides these endpoints:

### Get Data
```
GET /api.php/api/data/{userId}/{key}

Response:
{
  "value": "serialized_data"
}
```

### Save Data
```
POST /api.php/api/data/{userId}/{key}

Body:
{
  "value": "serialized_data"
}

Response:
{
  "success": true
}
```

### Delete Data
```
DELETE /api.php/api/data/{userId}/{key}

Response:
{
  "success": true
}
```

### Get All User Data (Export/Backup)
```
GET /api.php/api/user/{userId}/data

Response:
{
  "pressure_save_v3": "...",
  "pressure_unlimited_highscores": "...",
  "walkthrough-classic-1": "true",
  ...
}
```

### Health Check
```
GET /api.php/api/health

Response:
{
  "status": "ok",
  "time": "2026-03-06T10:30:00+00:00",
  "database": "connected"
}
```

## Database Schema

The server automatically creates this table:

```sql
CREATE TABLE game_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  data_key VARCHAR(255) NOT NULL,
  data_value LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_key (user_id, data_key),
  INDEX idx_user_id (user_id),
  INDEX idx_updated_at (updated_at)
)
```

## Testing the Server

### Using cURL

```bash
# Health check
curl http://localhost:8000/api.php/api/health

# Save data
curl -X POST http://localhost:8000/api.php/api/data/user123/test_key \
  -H "Content-Type: application/json" \
  -d '{"value":"test_value"}'

# Get data
curl http://localhost:8000/api.php/api/data/user123/test_key

# Delete data
curl -X DELETE http://localhost:8000/api.php/api/data/user123/test_key
```

## Production Deployment

### Apache Setup

1. Place `api.php` in web root
2. Enable `.htaccess` routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.php [L]
</IfModule>
```

### Nginx Setup

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/pressure-game/public;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php-fpm.sock;
        fastcgi_index api.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
}
```

### Docker Setup

```dockerfile
FROM php:8.0-apache

# Enable mysqli
RUN docker-php-ext-install mysqli

# Copy server file
COPY api.php /var/www/html/

# Enable mod_rewrite
RUN a2enmod rewrite

# Set up web root
WORKDIR /var/www/html
```

## Troubleshooting

### "Connection refused"
- Ensure MySQL is running
- Check credentials in `.env`
- Verify MYSQL_HOST is correct

### "Access denied for user"
- MySQL user password incorrect
- User doesn't have privileges
- Check grants: `SHOW GRANTS FOR 'pressure_user'@'localhost';`

### CORS errors
- Verify `Access-Control-Allow-Origin` headers
- Check VITE_API_URL matches server location
- Ensure CORS is enabled in api.php

### Data not syncing
- Check browser console for errors
- Verify API endpoint is accessible: `curl http://your-api/api/health`
- Check `navigator.onLine` status
- Review sync queue in localStorage

## Next Steps

1. ✅ Database created
2. ✅ PHP server running
3. ✅ Frontend configured with VITE_API_URL
4. Test offline functionality (disconnect network)
5. Test sync on reconnect
6. Monitor MySQL for data persistence

## Security Notes

For production:

1. **Add authentication:**
   ```php
   $userId = $_SESSION['user_id'] ?? die('Unauthorized');
   ```

2. **Validate input:**
   ```php
   if (!preg_match('/^[\w\-]+$/', $key)) {
     die('Invalid key');
   }
   ```

3. **Use HTTPS:** Required for `navigator.onLine` to work reliably

4. **Rate limiting:** Add IP-based rate limiting

5. **Database backups:** Set up automated MySQL backups

6. **Logs:** Monitor `error_log` and MySQL slow query logs

---

Need help? Check the server logs:

```bash
# PHP errors
tail -f /var/log/php-fpm.log

# MySQL logs
tail -f /var/log/mysql/error.log

# Browser console
F12 → Console tab
```
