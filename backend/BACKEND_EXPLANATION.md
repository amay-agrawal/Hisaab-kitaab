# Hisaab-Kitab ⚙️ Backend Architecture & Code Walkthrough

This document provides a full-fledged technical walkthrough of every directory and file in the backend codebase of the **Hisaab-Kitab** application. It serves as a developer guide for understanding the APIs, middleware flows, database models, and utilities.

---

## 📂 Backend Project Structure

```text
backend/
├── src/
│   ├── db/
│   │   └── db.js               # Database connection logic
│   ├── models/
│   │   ├── user.models.js       # User database schema & helper methods
│   │   ├── transaction.models.js# Financial records schema & indices
│   │   ├── follow.models.js     # Social connection schema & unique keys
│   │   └── notification.models.js# Notification logs schema
│   ├── controllers/
│   │   ├── user.controllers.js  # User auth, settings, & budget controllers
│   │   ├── transactions.controllers.js # CRUD & CSV bulk statement import
│   │   ├── dashboard.controllers.js    # Stat aggregates & budget alert checker
│   │   ├── analytics.controllers.js    # Financial charts & timeline aggregates
│   │   ├── leaderboard.controllers.js  # Global user performance ranking
│   │   ├── follow.controllers.js       # Social graphs (follow/unfollow)
│   │   └── notification.controllers.js # System alerts read/delete actions
│   ├── routes/
│   │   ├── user.routes.js       # Express routes mapping for users
│   │   ├── transaction.routes.js# Express routes mapping for transactions
│   │   ├── dashboard.routes.js  # Express routes mapping for stats
│   │   ├── analytics.routes.js  # Express routes mapping for charts
│   │   ├── leaderboard.routes.js# Express routes mapping for rankings
│   │   ├── follow.routes.js     # Express routes mapping for social links
│   │   └── notification.routes.js# Express routes mapping for alerts
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT authentication interceptor
│   │   └── multer.middleware.js # File upload disk storage system
│   ├── utils/
│   │   └── email.service.js     # SMTP transporter and email HTML templates
│   ├── app.js                   # Express application initialization & middleware
│   └── index.js                 # Entry point (bootstrapping database & server)
├── package.json                 # Node package configuration and scripts
├── .env                         # Local environment variables
└── .gitignore                   # Files omitted from git tracking
```

---

## 🔌 Root-Level Bootstrapping files

### 1. `index.js`
*   **Purpose**: Bootstraps the application.
*   **Logic**:
    1.  Loads environment variables using `dotenv.config()`.
    2.  Invokes `connectDB()` to connect to the MongoDB instance.
    3.  Once the connection is successful, starts the Express server listening on the specified port (defaults to `8000`).
    4.  Fails gracefully with a connection log if MongoDB Atlas fails to resolve.

### 2. `app.js`
*   **Purpose**: Initializes and configures the Express server.
*   **Configured Middlewares**:
    *   **`cors`**: Set dynamically to read origin from `process.env.CORS_ORIGIN` (or fallback to React's local dev server `http://localhost:5173`). Features `credentials: true` to support sending cookies.
    *   **`express.json()`**: Parses incoming JSON payloads.
    *   **`express.static("public")`**: Exposes assets (like uploaded avatar photos) located in the public directory.
    *   **`cookieParser()`**: Reads and parses cookies from headers to support secure sessions.
    *   **Router Declarations**: Mounts the routers for all modules (`/api/v1/...`).

---

## 🗄️ Database Layer (`src/db/` & `src/models/`)

### 1. `db/db.js`
*   **Purpose**: Manages connections to the MongoDB database.
*   **Logic**: Connects to the URI using Mongoose, establishing a collection connection mapping to `${process.env.MONGODB_URI}/${process.env.DB_NAME}`. Features console logs of connection statuses.

### 2. `models/user.models.js`
*   **Purpose**: Models users and user-specific settings.
*   **Instance Methods**:
    *   **`isPasswordCorrect(password)`**: Compares input password with the stored hash using `bcrypt.compare`.
    *   **`generateAccessToken()`**: Encrypts standard session claims (`_id`, `email`, `username`, `fullName`) into a short-lived JWT.
    *   **`generateRefreshToken()`**: Generates a long-lived JWT stored in the DB to manage persistent login state.

### 3. `models/transaction.models.js`
*   **Purpose**: Models user expenses/incomes.
*   **Indices**: Features a compound index of `{ owner: 1, date: -1 }` to optimize timeline queries and page loads.

### 4. `models/follow.models.js`
*   **Purpose**: Models follow metrics.
*   **Indices**: Features a compound unique index of `{ follower: 1, following: 1 }` ensuring that a user cannot follow another user multiple times.

### 5. `models/notification.models.js`
*   **Purpose**: Models user alerts.
*   **Logic**: Holds keys like `recipient`, `sender`, `type` (follow, budget, trend, info), and `read` status.

---

## 🛡️ Middlewares Layer (`src/middlewares/`)

### 1. `auth.middleware.js`
*   **Purpose**: Intercepts requests to confirm active user authorization.
*   **Logic**:
    1.  Tries to extract the `accessToken` from cookies or the `Authorization` request header.
    2.  Decodes and verifies the JWT signature using `process.env.ACCESS_TOKEN_SECRET`.
    3.  Fetches user from database (excluding sensitive fields like password and refresh token).
    4.  Attaches the profile to the request object (`req.user`) and calls `next()` to proceed to controllers.

### 2. `multer.middleware.js`
*   **Purpose**: Upload middleware configuration.
*   **Logic**:
    1.  Configures `multer.diskStorage` to write avatar images to `./public/uploads`.
    2.  Generates randomized filename suffixes using `Date.now()`.
    3.  Includes a file filter enforcing that only images (`image/*`) are accepted.
    4.  Imposes a 5MB size limit to prevent Denial of Service (DoS) attacks from massive files.

---

## 🎛️ Controllers Layer (`src/controllers/`)

### 1. `user.controllers.js`
*   **Main APIs**:
    *   **`registerUser`**: Hashes the password using `bcrypt` and creates a new user database record.
    *   **`loginUser`**: Validates the email and password, creates access/refresh tokens, sets them in secure HttpOnly cookies, and returns the user object.
    *   **`logoutUser`**: Resets the refresh token in MongoDB and clears the HTTP credentials cookies.
    *   **`refreshAccessToken`**: Decodes the refresh token, verifies it against the database, and issues a new access token.
    *   **`updateAccountDetails` / `updateUserSettings` / `updateUserBudgets`**: Updates specific parts of the user document (e.g., name, currency, weekly email settings, category limits).

### 2. `transactions.controllers.js`
*   **Main APIs**:
    *   **`getTransactions`**: Retrieves the list of transactions for the logged-in user, supporting pagination, date filtering, category filtering, and search queries.
    *   **`createTransaction`**: Saves a new income/expense. It also triggers a check to see if the budget for that category has been exceeded.
    *   **`bulkImportTransactions`**: Handles array uploads of parsed CSV data for fast batch inserts.

### 3. `dashboard.controllers.js`
*   **Main APIs**:
    *   **`getDashboardStats`**: Performs database aggregations using MongoDB's pipeline to compile:
        1.  Total Income, Total Expense, and Current Balance.
        2.  Budget limit vs. actual spending comparison for each category.
        3.  Recent transactions and unread notifications.

### 4. `analytics.controllers.js`
*   **Main APIs**:
    *   **`getAnalyticsStats`**: Compiles visual charts and financial trends:
        1.  Month-on-month income vs. expense progress.
        2.  Category-wise spending distribution (useful for pie charts).
        3.  Financial ratios and trends.

### 5. `leaderboard.controllers.js`
*   **Main APIs**:
    *   **`getLeaderboard`**: Compiles a global list of users, sorting them by their total savings or financial discipline scores. It only includes users who have enabled `showOnLeaderboard` in their settings.

### 6. `follow.controllers.js`
*   **Main APIs**:
    *   **`followUser` / `unfollowUser`**: Creates or deletes records in the `Follow` collection and triggers follow notifications.
    *   **`getFollowers` / `getFollowing`**: Fetches the directory lists of users connected to a specific profile.

### 7. `notification.controllers.js`
*   **Main APIs**:
    *   **`getNotifications`**: Retrieves notifications sent to the active user.
    *   **`markNotificationAsRead` / `markAllAsRead` / `deleteNotification`**: Updates the read state or removes alerts by ID.

---

## 📡 Routers Layer (`src/routes/`)
All files in `routes/` bind paths (e.g. `/register`, `/:id`) and HTTP verbs (GET, POST, PUT, DELETE) to their matching controller logic. Routes are categorized into public routes (like registration and login) and protected routes that run the `verifyJWT` middleware first.

---

## 📧 Utilities Layer (`src/utils/`)

### `email.service.js`
*   **Purpose**: Connects to SMTP email services to dispatch automated emails.
*   **Features**:
    *   Utilizes **Nodemailer** with the Gmail transporter.
    *   Generates beautifully structured HTML email templates for:
        1.  Welcome emails on user registration.
        2.  Budget warnings when thresholds are crossed.
        3.  Weekly financial summaries summarizing expenses.
