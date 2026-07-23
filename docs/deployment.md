# Deployment Guide

## 1. Deployment Overview

The Voice Ordering Agent POC is deployed across multiple cloud services:

```mermaid
flowchart LR
    U[Customer Browser] --> F[Render Static Site]
    F --> B[Render Backend API]
    F <--> L[LiveKit Cloud Room]

    L <--> A[LiveKit Cloud Agent]
    A --> STT[Deepgram STT]
    A --> LLM[Groq LLM]
    A --> TTS[Deepgram TTS]

    B --> M[(MongoDB Atlas)]
    B --> R[(Upstash Redis)]

    A --> M
    A --> R
```

| Component | Platform |
|---|---|
| Frontend | Render Static Site |
| Backend | Render Web Service |
| Voice agent | LiveKit Cloud |
| Database | MongoDB Atlas |
| Session and cart store | Upstash Redis |
| Speech-to-text | Deepgram |
| Language model | Groq |
| Text-to-speech | Deepgram |

---

## 2. Prerequisites

Before deployment, create accounts and projects for:

- Render
- LiveKit Cloud
- MongoDB Atlas
- Upstash Redis
- Groq
- Deepgram

Install the required local tools:

```bash
node --version
npm --version
git --version
lk --version
```

Recommended:

```text
Node.js 20 or later
LiveKit CLI
Git
```

---

## 3. Repository Structure

The deployment assumes this structure:

```text
Voice-Agent-POC/
├── backend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── docs/
├── README.md
└── .gitignore
```

Commit the latest working version before deploying:

```bash
git add .
git commit -m "Prepare production deployment"
git push origin main
```

---

## 4. MongoDB Atlas Setup

### 4.1 Create the database

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add a network-access rule.
4. Copy the connection string.

Example:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/voice-ordering-agent
```

Replace:

```text
USERNAME
PASSWORD
CLUSTER
```

Do not commit the real URI.

### 4.2 Seed the database

From the backend directory:

```bash
cd backend
npm install
npm run seed
```

Confirm that the following collections contain data:

```text
restaurants
menus
```

Orders and analytics are created during application use.

---

## 5. Upstash Redis Setup

1. Create an Upstash Redis database.
2. Copy the Redis connection URL.
3. Use the TLS-enabled URL when provided.

Example:

```env
REDIS_URL=rediss://default:PASSWORD@HOST.upstash.io:6379
```

Redis stores:

- Active sessions
- Current session state
- Temporary carts
- Customer details during a call

Do not expose the Redis URL to the frontend.

---

## 6. LiveKit Cloud Setup

### 6.1 Create a LiveKit project

Create a LiveKit Cloud project and copy:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

The backend uses these values to generate participant tokens.

The deployed agent receives its LiveKit connection credentials through LiveKit Cloud.

### 6.2 Install and authenticate the LiveKit CLI

Install the CLI using the official method for your operating system.

Verify:

```bash
lk --version
```

Authenticate:

```bash
lk cloud auth
```

Select the correct LiveKit Cloud project when prompted.

---

## 7. Deepgram Setup

Create a valid Deepgram API key with access to:

- Speech-to-text
- Text-to-speech

Agent secret:

```env
DEEPGRAM_API_KEY=your_deepgram_api_key
```

Enter the key without quotes or surrounding spaces.

A Deepgram `401` error normally means:

- The key is invalid
- The key has expired
- The key was copied incorrectly
- The environment variable name is wrong
- The agent was not restarted after the secret changed

---

## 8. Groq Setup

Create a Groq API key.

Agent secrets:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TEMPERATURE=0.2
```

The selected model should support the tool-calling behavior required by the agent.

Provider limits may cause `429` errors when token usage or request frequency exceeds the account limit.

---

## 9. Backend Deployment on Render

### 9.1 Create the service

Create a new Render **Web Service** connected to the GitHub repository.

Use:

```text
Runtime: Node
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm run server:start
```

### 9.2 Backend environment variables

Add these variables in Render:

```env
NODE_ENV=production
PORT=5000

CLIENT_URL=https://YOUR-FRONTEND.onrender.com

MONGO_URI=mongodb+srv://...
REDIS_URL=rediss://...

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

Render normally provides its own runtime port. The backend should read:

```ts
process.env.PORT
```

### 9.3 Deploy the backend

Trigger a manual deployment or push to the configured branch.

Production backend:

```text
https://voice-agent-poc-f2tv.onrender.com
```

API base URL:

```text
https://voice-agent-poc-f2tv.onrender.com/api/v1
```

### 9.4 Verify the backend

Test a health route if configured:

```bash
curl https://voice-agent-poc-f2tv.onrender.com/api/v1/health
```

Test session creation:

```bash
curl -X POST \
  https://voice-agent-poc-f2tv.onrender.com/api/v1/sessions
```

Test menu retrieval:

```bash
curl \
  https://voice-agent-poc-f2tv.onrender.com/api/v1/menu
```

If the health route is mounted outside `/api/v1`, use the path defined in the final backend router.

---

## 10. Frontend Deployment on Render

### 10.1 Create the static site

Create a new Render **Static Site** connected to the same repository.

Use:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

### 10.2 Frontend environment variable

Add:

```env
VITE_API_URL=https://voice-agent-poc-f2tv.onrender.com/api/v1
```

Vite only exposes variables prefixed with `VITE_`.

Do not add these secrets to the frontend:

```text
LIVEKIT_API_SECRET
GROQ_API_KEY
DEEPGRAM_API_KEY
MONGO_URI
REDIS_URL
```

### 10.3 React Router rewrite

Add this rewrite rule in Render:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

This prevents `404` errors when refreshing routes such as:

```text
/orders
/analytics
/menu
```

### 10.4 Update backend CORS

After the frontend URL is generated, update the backend environment variable:

```env
CLIENT_URL=https://YOUR-FRONTEND.onrender.com
```

Redeploy the backend after changing it.

---

## 11. LiveKit Agent Deployment

### 11.1 Prepare agent secrets

Create a local secret file that is excluded from Git:

```text
backend/secrets.env
```

Example:

```env
MONGO_URI=mongodb+srv://...
REDIS_URL=rediss://...

GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key

GROQ_MODEL=llama-3.1-8b-instant
GROQ_TEMPERATURE=0.2
```

Never commit this file.

Add it to `.gitignore`:

```gitignore
.env
.env.*
secrets.env
```

### 11.2 Create the agent deployment

From the backend directory:

```bash
cd backend
lk agent create --secrets-file ./secrets.env .
```

If the agent already exists, deploy the latest code:

```bash
lk agent deploy .
```

### 11.3 View agent status

```bash
lk agent status
```

### 11.4 View logs

```bash
lk agent logs
```

On Windows, when `lk` is not available in `PATH`, invoke the installed executable directly:

```powershell
& "C:\Users\marya\AppData\Local\Microsoft\WinGet\Packages\LiveKit.LiveKitCLI_Microsoft.Winget.Source_8wekyb3d8bbwe\lk.exe" agent deploy .
```

---

## 12. Production Environment Summary

### Backend

```env
NODE_ENV=production
CLIENT_URL=https://YOUR-FRONTEND.onrender.com
MONGO_URI=...
REDIS_URL=...
LIVEKIT_URL=wss://voice-agent-poc-vx5xjz20.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

### Frontend

```env
VITE_API_URL=https://voice-agent-poc-f2tv.onrender.com/api/v1
```

### LiveKit agent

```env
MONGO_URI=...
REDIS_URL=...
GROQ_API_KEY=...
DEEPGRAM_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TEMPERATURE=0.2
```

---

## 13. Deployment Order

Use this order to reduce configuration problems:

```text
1. MongoDB Atlas
2. Upstash Redis
3. LiveKit Cloud project
4. Deepgram and Groq keys
5. Backend deployment
6. Frontend deployment
7. Update backend CLIENT_URL
8. LiveKit agent deployment
9. Seed production database if required
10. Run the end-to-end test
```

---

## 14. End-to-End Verification

After every deployment, complete this test.

### Step 1: Load the frontend

Confirm that:

- The page loads
- Menu data appears
- No CORS error appears
- Direct route refresh works

### Step 2: Start a voice session

Confirm that:

- A new session ID is created
- The LiveKit connection succeeds
- Microphone permission is requested
- The agent joins the room
- The greeting is played

### Step 3: Test speech-to-text

Say:

```text
What is available on the menu?
```

Confirm that:

- Customer speech appears in the transcript
- Deepgram does not return `401`
- The agent understands the request

### Step 4: Test text-to-speech

Confirm that:

- The agent response is audible
- The agent transcript appears
- The response is not duplicated

### Step 5: Test tools

Ask for a menu item with modifiers.

Confirm:

- `searchMenu` runs
- `getMenuItem` runs
- Valid modifier choices are suggested
- `addToCart` runs
- The cart panel updates

### Step 6: Test order placement

Confirm:

- The agent calls `getCart`
- The cart total is spoken in rupees
- The agent requests final confirmation
- `placeOrder` succeeds
- The cart clears
- The new order appears on the Orders page

### Step 7: Test analytics

Confirm:

- The call count increases
- Turns are recorded
- Tool calls are recorded
- Token usage is recorded
- Order count increases
- Duration and status are updated

---

## 15. Troubleshooting

### Frontend cannot reach backend

Check:

```env
VITE_API_URL
CLIENT_URL
```

Confirm the Render frontend origin is allowed by backend CORS.

### LiveKit connection fails

Check:

```env
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

Confirm that the backend token response contains:

```json
{
  "token": "...",
  "url": "wss://...",
  "room": "session-id"
}
```

### Agent does not join

Run:

```bash
lk agent status
lk agent logs
```

Confirm the agent deployment is active and connected to the correct LiveKit project.

### Deepgram returns `401`

Update:

```env
DEEPGRAM_API_KEY=valid_key
```

Then redeploy:

```bash
lk agent deploy .
```

### Groq returns `429`

Possible fixes:

- Reduce conversation history
- Shorten instructions
- Shorten tool descriptions
- Use a smaller model
- Wait for the rate-limit window to reset
- Increase provider limits

### Cart does not update

Verify that these identifiers are identical:

```text
Frontend active session ID
Redux session ID
LiveKit room name
Agent session ID
Cart polling session ID
Redis session ID
```

### Frontend route returns `404`

Add the Render rewrite:

```text
/* → /index.html
```

with action:

```text
Rewrite
```

### Backend sleeps or responds slowly

Render free services may cold-start after inactivity. Open the backend or retry after the initial request completes.

---

## 16. Security Checklist

Before deployment:

- Do not commit `.env`
- Do not commit `secrets.env`
- Do not expose provider keys in the frontend
- Keep the LiveKit API secret on the backend
- Rotate any exposed key
- Restrict MongoDB users appropriately
- Use TLS Redis URLs
- Configure CORS for the deployed frontend
- Avoid logging full secrets or access tokens
- Store production secrets in platform environment settings

---

## 17. Final Deployment Checklist

```text
[ ] Latest code pushed to GitHub
[ ] MongoDB connection works
[ ] Production menu data exists
[ ] Redis connection works
[ ] Backend Render deployment succeeds
[ ] Frontend Render build succeeds
[ ] React Router rewrite is configured
[ ] Backend CLIENT_URL matches frontend URL
[ ] LiveKit token route works
[ ] Agent deployment is active
[ ] Deepgram STT works
[ ] Groq tool calling works
[ ] Deepgram TTS works
[ ] Cart updates live
[ ] Order placement works
[ ] Orders page shows the order
[ ] Analytics page updates
[ ] No secrets are committed
```
