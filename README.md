# School Inventory System - Backend

## Project Structure
```
BackEnd/
├── server.js              # Main entry point
├── package.json           # Dependencies
├── .env                   # Environment variables
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Category.js
│   ├── Equipment.js
│   ├── Transaction.js
│   └── Penalty.js
└── routes/                # API routes
    ├── auth.js
    ├── users.js
    ├── categories.js
    ├── equipment.js
    ├── transactions.js
    └── penalties.js
```

## Setup Instructions

### 1. Install MongoDB
- Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
- Install and make sure MongoDB service is running

### 2. Install Node.js
- Download from: https://nodejs.org/ (LTS version recommended)
- Verify: `node -v` and `npm -v`

### 3. Install Dependencies
```bash
cd BackEnd
npm install
```

### 4. Run the Server
```bash
# Development mode (auto-restart on file changes)
npm run dev

# OR production mode
npm start
```

### 5. Test the API
Open browser or Postman and go to:
- `http://localhost:3000/` - Should show "API is running!"
- `http://localhost:3000/api/users` - Should return empty array at first

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/users | Get all users |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |
| GET | /api/equipment | Get all equipment |
| POST | /api/equipment | Add equipment |
| PUT | /api/equipment/:id | Update equipment |
| DELETE | /api/equipment/:id | Delete equipment |
| GET | /api/categories | Get all categories |
| POST | /api/categories | Add category |
| GET | /api/transactions | Get all transactions |
| GET | /api/transactions/requests/pending | Get pending requests |
| POST | /api/transactions | Create borrowing request |
| PUT | /api/transactions/:id | Update transaction status |
| GET | /api/penalties | Get all penalties |
| POST | /api/penalties | Create penalty |
