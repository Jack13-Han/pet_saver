# Pet Saver - Gamified Savings App

Full-stack savings gamification app with PHP + MySQL + React + Vite.

## Features

- Savings Goals with avatars (Dog, Cat, Tree, Bird, Rabbit)
- Daily Transactions (+/-) with scrollable quick amounts
- Pet avatars react to progress (Happy, Sad, Dirty, Celebrating)
- Rankings: Bronze -> Silver -> Gold -> Diamond -> Platinum
- Coin economy + Accessory Shop
- Receipt Scanner (upload photo, auto-detect details)
- Transaction history with filters
- Daily streaks + Achievement badges

## Project Structure

```
pet_saver/
├── api/
│   ├── .env              # Backend config (DB, JWT)
│   ├── .env.example      # Template
│   ├── .htaccess         # Apache CORS + rewrite
│   ├── config.php        # Database & JWT
│   └── index.php         # API router (all endpoints)
├── database/
│   └── schema.sql        # MySQL schema
├── frontend/
│   ├── .env              # Frontend config (API URL)
│   ├── .env.example      # Template
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── api.js
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   └── Sidebar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Goals.jsx
│           ├── Transactions.jsx
│           ├── Shop.jsx
│           ├── Achievements.jsx
│           ├── ReceiptScanner.jsx
│           ├── Rankings.jsx
│           └── Settings.jsx
```

## Quick Start

### 1. Database

```bash
mysql -u root -p
CREATE DATABASE pet_saver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
mysql -u root -p pet_saver < database/schema.sql
```

### 2. Backend (PHP)

1. Copy `api/` to your web server:
   - XAMPP: `C:\xampp\htdocs\pet_saver\api\`
   - MAMP: `/Applications/MAMP/htdocs/pet_saver/api/`

2. Configure `.env`:
   ```bash
   cd api/
   cp .env.example .env
   ```
   Edit `api/.env`:
   ```ini
   DB_HOST=localhost
   DB_NAME=pet_saver
   DB_USER=root
   DB_PASS=your_password
   JWT_SECRET=change_this_to_random_string
   ```

3. Enable Apache modules:
   - Open `httpd.conf`
   - Uncomment: `LoadModule rewrite_module` and `LoadModule headers_module`
   - Restart Apache

4. Verify: `http://localhost/pet_saver/api/auth/login`
   Should show JSON response.

### 3. Frontend (React + Vite)

```bash
cd frontend/
npm install
```

Configure API URL:
```bash
cp .env .env.local
```
Edit `frontend/.env.local`:
```ini
# XAMPP/WAMP (port 80)
VITE_API_URL=http://localhost/pet_saver/api

# MAMP (port 8888)
# VITE_API_URL=http://localhost:8888/pet_saver/api
```

Start:
```bash
npm run dev
```
Opens at `http://localhost:3000`

## Troubleshooting

### "Network error" or "Failed to fetch"

1. Check PHP server: `http://localhost/pet_saver/api/auth/login`
2. Check CORS: `.htaccess` handles this automatically
3. Check `VITE_API_URL` in `.env.local` matches your server URL
4. Common URLs:
   | Server | URL |
   |--------|-----|
   | XAMPP | `http://localhost/pet_saver/api` |
   | MAMP | `http://localhost:8888/pet_saver/api` |
   | WAMP | `http://localhost/pet_saver/api` |

### "Database connection failed"

1. Check MySQL is running
2. Verify `DB_PASS` in `api/.env`
3. Test: `mysql -u root -p -e "USE pet_saver; SHOW TABLES;"`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register |
| `/auth/login` | POST | Login |
| `/user` | GET | Profile |
| `/dashboard` | GET | Dashboard data |
| `/targets` | GET/POST | Goals |
| `/transactions` | GET/POST | Transactions |
| `/avatars/care` | POST | Pet care |
| `/shop` | GET | Shop items |
| `/shop/buy` | POST | Buy item |
| `/receipts` | GET/POST | Receipts |
| `/rankings` | GET | Leaderboard |

## Security

- JWT authentication
- Bcrypt password hashing
- Prepared statements (SQL injection safe)
- NEVER commit `.env` files

## License

MIT License
