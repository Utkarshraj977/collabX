# CollabX — Real-Time Collaboration Platform

## 🚀 Overview

**CollabX** is a full-stack real-time collaboration platform built to combine **team chat, task management, GitHub integration, and video meetings** inside structured **workspaces** and **channels**.

It is designed as a lightweight collaboration system inspired by tools like Slack + Zoom + GitHub, while focusing on scalable real-time architecture and secure multi-user communication.

---

## ✨ Features

### Workspace & Channel Management
- Create and manage workspaces
- Create channels inside workspaces
- Role-based permissions:
  - Admin
  - Manager
  - Member
- Add users to workspaces and channels

### Real-Time Chat
- Channel-based messaging
- Socket.IO-powered real-time communication
- Redis-backed presence tracking
- Typing indicators
- Online/offline user status
- Message persistence in MongoDB

### Task Management
- Create tasks inside channels
- Assign tasks to members
- Update task status
- Track progress within collaboration flow

### GitHub Integration
- Connect repositories to channels
- GitHub webhook event handling
- Push / PR activity reflected in channel discussions
- Webhook signature verification
- Replay protection

### Video Meetings
- Multi-user WebRTC meetings
- Peer-to-peer mesh topology (MVP)
- Socket.IO signaling
- Join/leave room handling
- Camera & microphone support

### Security
- JWT authentication
- Role-based access control
- Rate limiting
- Protected routes
- Input validation

---

## 🏗 Tech Stack

## Frontend
- React.js
- Redux
- Tailwind CSS
- Socket.IO Client
- Simple-Peer

## Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO
- Redis

## Integrations
- GitHub Webhooks
- Cloudinary

## Authentication
- JWT
- Refresh Tokens

---

## 📂 Project Structure

## Backend

```bash
server/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── redis.js
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── utils/
│   └── app.js
└── server.js
```

## Frontend

```bash
client/
├── app/
├── components/
├── pages/
├── routes/
├── services/
├── App.jsx
└── main.jsx
```

---

## ⚙️ Environment Variables

Create a `.env` file inside server:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri

ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=7d

REDIS_URL=your_redis_url

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

GEMINI_API_KEY=xxx

GITHUB_WEBHOOK_SECRET=xxx
```

---

# 🛠 Installation

## Clone Repository

```bash
git clone https://github.com/Utkarshraj977/CollabX.git

cd CollabX
```

---

## Backend Setup

```bash
cd server
npm install
```

Run backend:

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Run Tests

The backend and frontend test suites are isolated from production services. They do not require MongoDB, Redis, Cloudinary, or other external credentials.

```bash
cd server
npm test

cd ../client
npm test
```

Use `npm run test:watch` inside either directory while developing.

---

## Redis (if running locally)

```bash
redis-server
```

---

## Run Full Application

Start:

1. MongoDB
2. Redis
3. Backend Server
4. Frontend

Then open:

```bash
http://localhost:5173
```

---

# 🔌 API Highlights

## Auth

```http
POST /api/v1/users/register
POST /api/v1/users/login
```

## Workspace

```http
POST /api/v1/workspaces
GET /api/v1/workspaces
```

## Channels

```http
POST /api/v1/channels/:workspaceId
GET /api/v1/channels/:workspaceId
```

## Tasks

```http
POST /api/v1/tasks
PATCH /api/v1/tasks/:id
```

## GitHub

```http
POST /api/v1/github/connect
POST /api/v1/github/webhook
```

---

# 🔄 Socket Events

## Chat

```javascript
join-channel
send-message
new-message
typing
stop-typing
```

## Meet

```javascript
join-room
sending-signal
returning-signal
user-left
```

---

# 🧠 Architecture Notes

## Redis Used For

- Online presence
- Pub/Sub message synchronization
- Typing events
- Socket scaling
- Session-related temporary data

---

## WebRTC Topology

Current:

```text
Mesh (Peer-to-Peer)
```

Future upgrade:

```text
SFU (Selective Forwarding Unit)
```

---

# 🧪 Testing GitHub Webhooks

Using ngrok:

```bash
ngrok http 5000
```

Use generated public URL in GitHub webhook settings.

---

# 🚀 Future Improvements

- SFU-based video scaling
- Notifications system
- File sharing in chat
- AI task suggestions
- Meeting recording
- Kubernetes deployment
- CI/CD pipeline

---

# 📸 Screenshots



```md
<img width="1111" height="737" alt="Screenshot 2026-02-20 031928" src="https://github.com/user-attachments/assets/611ed928-effb-426c-bbbd-35ad5e04f28b" />
<img width="1916" height="860" alt="Screenshot 2026-02-20 023448" src="https://github.com/user-attachments/assets/26b10ceb-e4b2-4560-b398-03bc2b2cc31d" />

<img width="1888" height="868" alt="Screenshot 2026-02-20 023252" src="https://github.com/user-attachments/assets/fa9826b2-57c1-4863-916f-89ee584b231b" />


```

---

# 🤝 Contributing

Contributions are welcome.

```bash
Fork repo
Create feature branch
Commit changes
Open Pull Request
```

---

# 🐛 Known Limitations

- WebRTC currently uses mesh topology
- Large meetings need SFU upgrade
- GitHub integration currently channel scoped

---

# 👨‍💻 Author

**Utkarsh Raj**

GitHub:

https://github.com/Utkarshraj977

LinkedIn:

https://www.linkedin.com/in/utkarsh-raj-28a7ab272

---

# 📄 License

MIT License

---

## ⭐ If you found this project interesting, consider starring the repository.
