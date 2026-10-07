# ReliefConnect — Crowdsourced Disaster Relief Platform (Backend)

Backend API for **ReliefConnect**, built for Case Study 76 (Backend Development).
During disasters, coordination of supplies and volunteers is critical — this API
lets volunteers register skills/availability, NGOs post relief needs, donors
contribute funds/items, admins verify posts and coordinate logistics, and
everyone gets real-time updates and emergency push alerts.

## Tech Stack

- **Runtime**: Node.js + Express.js (REST API, modular routes/controllers)
- **Database**: MongoDB + Mongoose ODM
- **Auth**: JWT (primary) + Firebase Auth (optional ID-token verification)
- **Real-time**: Socket.io
- **Push notifications**: Firebase Cloud Messaging (mockable — see below)
- **Docs**: Swagger/OpenAPI (`/api-docs`) + Postman collection

## Project Structure

```
reliefconnect/
├── config/          # DB connection, constants/enums, Firebase init
├── models/          # Mongoose schemas: User, Volunteer, Need, Donation, ReliefCamp, Alert
├── controllers/      # Business logic per resource
├── routes/          # Express routers, one per resource
├── middleware/      # auth (JWT + roles), validation, error handling
├── sockets/         # Socket.io connection + room setup
├── utils/           # JWT helper, async wrapper, Firebase service, validators
├── docs/            # swagger.yaml + Postman collection
├── scripts/         # seed.js (demo data), smoke-test.js (structural tests)
├── app.js           # Express app (middleware + route wiring)
└── server.js        # HTTP server + Socket.io bootstrap
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Copy the example env file and fill in your values:
```bash
cp .env.example .env
```

At minimum, set:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `ADMIN_SIGNUP_KEY` — secret needed to register an admin account

Firebase is **mocked by default** (`FIREBASE_MOCK=true`) so the API runs and can
be graded/tested with zero external credentials — pushes are logged to the
console instead of actually sent. To use a real Firebase project:
1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts → Generate new private key
3. Fill `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in `.env`
4. Set `FIREBASE_MOCK=false`

### 4. Seed demo data (optional but recommended)
Creates one user of each role (admin/ngo/volunteer/donor, password `password123`),
5 relief camps, a need, a donation, and an emergency alert — matching the case
study's example user flow:
```bash
npm run seed
```

### 5. Run the server
```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start       # plain node
```

Server starts on `http://localhost:5000` by default.
- Health check: `GET /`
- Swagger UI: `GET /api-docs`

### 6. Explore the API

**Thunder Client (VS Code):** Collections → ⋯ → Import → `docs/ReliefConnect.thunder_collection.json`;
Env → ⋯ → Import → `docs/ReliefConnect.thunder_environment.json`, then select the
"ReliefConnect" environment. Run a **Login** request first — it saves `{{token}}`
automatically. If your port isn't 5000, edit `baseUrl` in the environment.

**Port 5000 busy on macOS?** AirPlay Receiver uses it. Set `PORT=5001` in `.env`
(or turn AirPlay Receiver off in System Settings → General → AirDrop & Handoff).

**Postman:** import `docs/ReliefConnect.postman_collection.json`. The collection
auto-captures your JWT into a `{{token}}` variable after login, and chains
`needId`/`campId`/`userId` across requests.

## Authentication & Roles

JWT-based. Register or log in to get a token, then send it as:
```
Authorization: Bearer <token>
```

Login also accepts a Firebase Auth ID token instead of email/password
(`{ "firebaseIdToken": "..." }`) — the response is still our JWT. Send an optional
`fcmToken` on register/login to receive push alerts on that device.

Admin accounts can't be self-registered by just anyone: `POST /api/auth/register`
with `"role": "admin"` also needs `"adminKey"` equal to `ADMIN_SIGNUP_KEY` from `.env`
(or just use `npm run seed`, which creates an admin).

Roles: `volunteer`, `ngo`, `donor`, `admin`. Role-based authorization middleware
(`middleware/auth.js`) restricts write operations — e.g. only `ngo`/`admin` can
post needs, only `admin` can create relief camps, verify needs, or send alerts.

## API Endpoints

| Resource | Method | Endpoint | Auth |
|---|---|---|---|
| Auth | POST | `/api/auth/register` | Public |
| Auth | POST | `/api/auth/login` | Public |
| Volunteers | GET | `/api/volunteers` | JWT |
| Volunteers | GET | `/api/volunteers/:id` | JWT |
| Volunteers | POST | `/api/volunteers` | JWT (volunteer) |
| Volunteers | PUT | `/api/volunteers/:id` | JWT (owner/admin) |
| Needs | GET | `/api/needs` | Public |
| Needs | GET | `/api/needs/:id` | Public |
| Needs | POST | `/api/needs` | JWT (ngo/admin) |
| Needs | PUT | `/api/needs/:id` | JWT (owner/admin) |
| Needs | DELETE | `/api/needs/:id` | JWT (owner/admin) |
| Donations | POST | `/api/donations` | JWT (donor) |
| Donations | GET | `/api/donations` | JWT (admin/ngo) |
| Donations | GET | `/api/donations/user/:id` | JWT (owner/admin) |
| Relief Camps | GET | `/api/relief-camps` | Public |
| Relief Camps | GET | `/api/relief-camps/:id` | Public |
| Relief Camps | POST | `/api/relief-camps` | JWT (admin) |
| Relief Camps | PUT | `/api/relief-camps/:id` | JWT (admin) |
| Alerts | GET | `/api/alerts` | Public |
| Alerts | POST | `/api/alerts` | JWT (admin) |
| Alerts | GET | `/api/alerts/emergency` | Public |
| Map | GET | `/api/map/affected-areas` | Public |
| Map | GET | `/api/map/relief-camps` | Public |
| Admin | GET | `/api/admin/needs` | JWT (admin) |
| Admin | PUT | `/api/admin/verify/:id` | JWT (admin) |
| Notifications | POST | `/api/notifications/send` | JWT (admin) |

Full request/response schemas: see `docs/swagger.yaml` or run the server and
open `/api-docs`.

## Real-time Updates (Socket.io)

Clients connect to the same host/port as the REST API and can join rooms:
```js
const socket = io('http://localhost:5000');
socket.emit('join', 'map');     // live affected-areas / relief-camp updates
socket.emit('join', 'alerts');  // emergency alert broadcasts
// admin room needs a token: io({ auth: { token: adminJwt } }); socket.emit("join", "admin");
```

**Live demo page:** open `http://localhost:<port>/live` — it connects to the Socket.io
server and prints every event as it happens, so you can call an endpoint in Swagger
and watch the update appear. The `admin` room (donations, new volunteers) is locked:
connect with `io({ auth: { token: <admin JWT> } })`, or paste an admin token into the
box on the page.

Events emitted: `need:new`, `need:updated`, `need:verified`, `need:deleted`,
`donation:new`, `camp:new`, `camp:updated`, `map:update`, `alert:new`,
`volunteer:new`.

## Firebase Push Notifications

When an `emergency`-severity alert is created (`POST /api/alerts`), the API
automatically fans out a push notification to every user with a registered
FCM device token, via `utils/firebaseService.js`. Admins can also trigger an
arbitrary push via `POST /api/notifications/send`. In mock mode, this logs the
payload to the console instead of hitting Firebase.

## Example User Flow (from the case study)

1. `POST /api/needs` (NGO) → Posts need: 500 blankets, 200 food packets in Flood Zone A
2. `POST /api/volunteers` → Volunteer registers: "Medical aid, available tomorrow"
3. `POST /api/donations` (donor) → Contributes ₹10,000 for relief supplies
4. `GET /api/map/relief-camps` → Real-time map shows 5 relief camps active
5. `PUT /api/admin/verify/:id` (admin) → Verifies NGO, approves supply request
6. `POST /api/alerts` (admin) → Emergency alert sent: "Cyclone approaching, prepare shelters"

Run `npm run seed` to pre-populate exactly this scenario, then explore it via
Postman or Swagger.

## Testing

Two test scripts run with no database needed (models are stubbed):
`scripts/smoke-test.js` (routing, auth middleware, validation, error shape) and
`scripts/logic-test.js` (admin-signup key, Firebase login, NGO can't self-verify).
```bash
npm test
```

## Deployment (Render / Heroku)

This repo is deploy-ready:
- `render.yaml` — one-click Render Blueprint (set `MONGO_URI` and Firebase vars
  as secrets in the Render dashboard after import)
- `Procfile` — for Heroku (`web: node server.js`)

Steps for Render:
1. Push this repo to GitHub
2. New → Blueprint → connect the repo (Render reads `render.yaml`)
3. Fill in `MONGO_URI` (e.g. an Atlas connection string) and Firebase secrets
4. Deploy — Render builds with `npm install` and starts with `npm start`

## Advanced / Optional Features (not implemented, noted per spec)

The case study lists these as **optional**: SMS alert integration, supply
chain tracking, volunteer training modules, and post-disaster impact reports.
They're out of scope for this deliverable but the architecture (modular
routes/controllers/models) makes each a straightforward additive module —
e.g. an SMS gateway would slot into `utils/` alongside `firebaseService.js`.
