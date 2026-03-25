# 💬 Chat App — Server

Backend for a real-time chat app. Built with Node.js + TypeScript, Socket.io for live messaging, JWT auth, Google OAuth, S3 media uploads, and a Gemini-powered AI assistant.

---

## ✨ Features

- ⚡ **Real-time messaging** via Socket.io
- 🔐 **JWT auth** — access + refresh tokens in `httpOnly` cookies
- 🔑 **Google OAuth 2.0** sign-in
- 👥 **Contacts** — requests, blocking, blacklisting
- 🖼️ **Image & voice messages** via S3
- 🤖 **AI chat** — multi-turn conversations with Gemini 2.5 Flash
- 🛡️ **RBAC** with a custom path-matching middleware
- ☁️ **S3-compatible storage** — AWS S3 or self-hosted (MinIO, etc.)

---

## 🛠️ Tech Stack

| Layer        | Technology                                               |
| ------------ | -------------------------------------------------------- |
| 🟢 Runtime   | Node.js + TypeScript                                     |
| 🚀 Framework | Express 4                                                |
| 🔌 Real-time | Socket.io 4                                              |
| 🗄️ Database  | MongoDB + Mongoose                                       |
| 🔐 Auth      | `jsonwebtoken` + `cookie-parser`                         |
| 🤖 AI        | LangChain + Gemini 2.5 Flash (`@langchain/google-genai`) |
| ☁️ Storage   | AWS S3 SDK v3 + `express-fileupload`                     |

---

## 📁 Project Structure

```
src/
├── main.ts                    # Entry point
├── app/
│   └── app.ts                 # Express app setup, middleware, routes
├── auth/
│   └── AuthentificationHandler.ts   # Custom JWT + RBAC middleware
├── connection/
│   ├── server/server.ts       # HTTP server bootstrap
│   └── sockets/sockets.ts     # Socket.io event handlers
├── controllers/
│   ├── aiController.ts        # Gemini AI chat (LangChain)
│   ├── authenticationController.ts
│   ├── messageController.ts
│   ├── userController.ts
│   └── validationController.ts
├── error/
│   ├── ApiError.ts            # Typed HTTP error class
│   ├── ApiErrorHandler.ts     # Centralized error handler middleware
│   └── ErrorCatcher.ts        # Async error wrapper HOF
├── routes/
│   ├── aiRoutes.ts
│   ├── authenticationRoutes.ts
│   ├── messageRoutes.ts
│   └── userRoutes.ts
├── schema/
│   ├── message/               # Conversation + Message models
│   ├── request/               # Contact request model
│   └── user/                  # User model
├── security/
│   └── EncryptionHandler.ts   # AES-256-CBC encryption
├── storage/
│   └── s3Storage.ts           # S3 upload / delete helpers
└── types/                     # TypeScript ambient declarations
```

---

## 🔗 API Reference

### 🔑 Authentication — `/api/auth`

| Method | Endpoint                 | Description                                  | Auth   |
| ------ | ------------------------ | -------------------------------------------- | ------ |
| `POST` | `/login`                 | Credential login (username/email + password) | Public |
| `POST` | `/login/oauth/google`    | Google OAuth login via `id_token`            | Public |
| `POST` | `/signup`                | Register a new account                       | Public |
| `POST` | `/logout`                | Clear auth cookies                           | Public |
| `POST` | `/refresh`               | Refresh access token                         | Public |
| `GET`  | `/check/email/:value`    | Check email availability                     | Public |
| `GET`  | `/check/username/:value` | Check username availability                  | Public |

### 👤 Users — `/api/users` _(protected)_

| Method   | Endpoint                  | Description                              |
| -------- | ------------------------- | ---------------------------------------- |
| `GET`    | `/profile`                | Get own profile                          |
| `PATCH`  | `/profile`                | Update own profile                       |
| `PUT`    | `/profile/picture`        | Upload profile picture                   |
| `GET`    | `/profile/:id`            | Get a user's public profile              |
| `GET`    | `/profile/:id/contact`    | Get contact's profile by conversation ID |
| `GET`    | `/contacts`               | List contacts                            |
| `POST`   | `/contacts/:id`           | Add contact                              |
| `DELETE` | `/contacts/:id`           | Remove contact                           |
| `PATCH`  | `/contacts/:id/block`     | Block contact                            |
| `PATCH`  | `/contacts/:id/unblock`   | Unblock contact                          |
| `PATCH`  | `/contacts/:id/blacklist` | Blacklist contact                        |
| `GET`    | `/requests`               | List incoming contact requests           |
| `POST`   | `/requests/:id`           | Send contact request                     |
| `DELETE` | `/requests/:id`           | Cancel contact request                   |
| `GET`    | `/candidates/contacts`    | Get suggested contacts                   |
| `GET`    | `/conversations/public`   | List conversations                       |

### 💬 Messages — `/api/messages` _(protected)_

| Method   | Endpoint     | Description                             |
| -------- | ------------ | --------------------------------------- |
| `GET`    | `/:id`       | Get paginated messages for conversation |
| `POST`   | `/:id`       | Send a text message                     |
| `DELETE` | `/:id`       | Delete a message                        |
| `POST`   | `/:id/image` | Upload & send an image message          |
| `POST`   | `/:id/voice` | Upload & send a voice message           |

### 🤖 AI — `/api/ai` _(protected)_

| Method | Endpoint | Description                    |
| ------ | -------- | ------------------------------ |
| `POST` | `/chat`  | Multi-turn AI chat with Gemini |

**Request body:**

```json
{
  "input": "Hello, what can you do?",
  "sessionId": "optional-existing-session-uuid"
}
```

**Response:**

```json
{
  "content": "I'm a helpful assistant...",
  "sessionId": "uuid-to-reuse-this-conversation"
}
```

---

## ⚡ Real-time Events (Socket.io)

| Client emits     | Server broadcasts  | Description                    |
| ---------------- | ------------------ | ------------------------------ |
| `self connect`   | —                  | Join user's personal room      |
| `chat`           | —                  | Join a conversation room       |
| `send message`   | `receive message`  | Send and broadcast a message   |
| `delete message` | `remove message`   | Delete and broadcast removal   |
| `send request`   | `receive request`  | Send a contact request         |
| `cancel request` | `canceled request` | Cancel a contact request       |
| `accept request` | `accepted request` | Accept a contact request       |
| `notify request` | `receive request`  | Notify both sides of a request |
| `remove contact` | `remove contact`   | Remove a contact               |
| `block`          | `user blocked`     | Block notification             |
| `unblock`        | `user unblocked`   | Unblock notification           |

---

## 🔄 Authentication Flow

```
Client                          Server
  |                               |
  |-- POST /api/auth/login ------>|
  |                               |-- Verify credentials
  |                               |-- Sign access token  (15 min)
  |                               |-- Sign refresh token (7 days)
  |<-- Set-Cookie: accessToken ---|
  |<-- Set-Cookie: refreshToken --|
  |                               |
  |-- GET /api/users/profile ---->|  (cookie sent automatically)
  |                               |-- Verify JWT, populate req.userInfo
  |<-- 200 profile data ----------|
  |                               |
  |-- POST /api/auth/refresh ---->|  (when access token expires)
  |<-- New accessToken cookie ----|
```

- 🍪 Tokens go in **`httpOnly`** cookies — no JS access
- 📨 `Authorization: Bearer <token>` header works too if you prefer
- 🛡️ Everything under `/api/*` is locked; `/api/auth/*` is public

---

## ⚙️ Environment Variables

Create a `.env` file at the project root:

```env
# Server
PORT=5000
environment=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/chat_app

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Encryption
ENCRYPTION_KEY=your_32_byte_hex_key
ENCRYPTION_IV=your_16_byte_hex_iv

# AWS S3 / S3-compatible storage
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
AWS_S3_ENDPOINT=           # Optional: for S3-compatible providers (e.g. MinIO)
AWS_S3_FORCE_PATH_STYLE=   # Optional: true for path-style S3 URLs

# Google Gemini (AI)
GEMINI_API_KEY=your_gemini_api_key

# CORS
CLIENT_ORIGIN=http://localhost:3000
```

---

## 🚀 Getting Started

Needs Node.js 18+, pnpm, and MongoDB running.

```bash
git clone https://github.com/your-username/chat-app-server.git
cd chat-app-server
pnpm install

cp .env.example .env
# fill in your values

pnpm build
pnpm start

# or for dev with watch mode
pnpm dev
```

---

## 📄 License

MIT
