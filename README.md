# School Inventory System

A web-based School Equipment Borrowing and Inventory Management System built for a school in the Philippines. The system allows custodians and administrators to manage equipment inventory, process borrowing and return transactions, track borrowing history, and manage penalties for overdue or damaged items.

---

## Features

- **User & Account Management**: Manage students, teachers, custodians, and admin accounts
- **Equipment Inventory**: Add, edit, delete, and view equipment with stock tracking
- **Borrowing & Return Transactions**: Process equipment borrowing with automatic stock updates and receipt generation
- **Payment & Penalty Management**: Automatic overdue detection and penalty recording
- **Role-Based Access Control**: Separate permissions for admin, custodian, and borrower roles
- **Responsive Dashboard**: Overview of equipment stats, active borrowings, and recent activities

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |
| Security | express-rate-limit, CORS |

---

## Project Structure

```
SchoolInventorySystem/
├── BackEnd/
│   ├── server.js              # Main entry point
│   ├── package.json           # Dependencies
│   ├── .env                   # Environment variables (not in repo)
│   ├── .env.example           # Environment variable template
│   ├── middleware/            # Auth & role middleware
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Equipment.js
│   │   ├── Transaction.js
│   │   └── Penalty.js
│   └── routes/                # API routes
│       ├── auth.js
│       ├── users.js
│       ├── categories.js
│       ├── equipment.js
│       ├── transactions.js
│       └── penalties.js
├── docs/                      # Frontend files
│   ├── js/
│   │   ├── common.js
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── equipment.js
│   │   ├── history.js
│   │   ├── penalties.js
│   │   └── users.js
│   ├── index.html             # Login page
│   ├── dashboard.html
│   ├── equipment.html
│   ├── user.html
│   ├── history.html
│   ├── penalties.html
│   ├── style.css
│   └── logo.jpg
├── .gitignore
└── README.md
```

---

## Setup Instructions

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account or local MongoDB

### 2. Install Backend Dependencies

```bash
cd BackEnd
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `BackEnd` folder:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_random_string_here
```

> **Important:** Never commit the `.env` file to GitHub. It is already listed in `.gitignore`.

### 4. Run the Server

```bash
# Development mode (auto-restart on file changes)
npm run dev

# OR production mode
npm start
```

### 5. Open the Frontend

Open `docs/index.html` in your browser, or use Live Server in VS Code.

---

## Default Login

The system is designed for admin and custodian login only. Students and teachers do not log in directly; staff process borrowing requests on their behalf.

| Field | Value |
|-------|-------|
| Username | (admin) |
| Password | (admin123) |
| Username | (custodian) |
| Password | (custodian) |

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/login | Login | No |
| GET | /api/users | Get all users | Yes |
| POST | /api/users | Create user | Yes |
| PUT | /api/users/:id | Update user | Yes |
| DELETE | /api/users/:id | Delete user | Yes |
| GET | /api/equipment | Get all equipment | Yes |
| POST | /api/equipment | Add equipment | Yes |
| PUT | /api/equipment/:id | Update equipment | Yes (Admin) |
| DELETE | /api/equipment/:id | Delete equipment | Yes (Admin) |
| GET | /api/categories | Get all categories | Yes |
| POST | /api/categories | Add category | Yes |
| PUT | /api/categories/:id | Update category | Yes |
| DELETE | /api/categories/:id | Delete category | Yes |
| GET | /api/transactions | Get all transactions | Yes |
| GET | /api/transactions/requests/pending | Get pending requests | Yes |
| POST | /api/transactions | Create borrowing request | Yes |
| PUT | /api/transactions/:id | Update transaction status | Yes |
| POST | /api/transactions/check-overdue | Check and flag overdue items | Yes |
| GET | /api/penalties | Get all penalties | Yes |
| POST | /api/penalties | Create penalty | Yes |
| PUT | /api/penalties/:id | Update penalty status | Yes |

---

## Security Features

- JWT-based authentication with Bearer tokens
- Password hashing with bcryptjs
- Login rate limiting (5 attempts per 15 minutes)
- Role-based access control (admin vs custodian permissions)
- CORS configured for frontend origin
- Environment variables for sensitive data

---

## Authors

- **Alvin Serdan** — Developer (BackEnd)
- **John Bato** — Developer (FrontEnd)
- **Kyle Gallenero** — Documentation

---

## License

This project is for educational purposes.
