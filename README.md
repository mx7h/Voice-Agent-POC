# Voice Ordering Agent POC

A full-stack AI voice ordering system that lets restaurant customers browse menus, customize items, manage a live cart, and place orders through natural voice conversations.

## Overview

This project is a restaurant voice-ordering proof of concept built with React, Node.js, LiveKit Agents, Groq, Deepgram, MongoDB, and Redis.

A customer can speak naturally with the AI agent, ask about the menu, select required or optional modifiers, add items to a live cart, confirm the order, and view the completed order and analytics from the frontend dashboard.

## Key Features

- Real-time voice conversations using LiveKit
- Speech-to-text and text-to-speech using Deepgram
- LLM-powered restaurant assistant using Groq
- Tool-based menu and ordering workflow
- Menu search and item lookup
- Required and optional modifier handling
- Live cart updates using REST polling
- Redis-backed session and cart management
- MongoDB order persistence
- Live caller and agent transcript
- Orders dashboard
- Analytics dashboard
- Token, turn, cart, tool-call, and latency tracking
- Responsive React interface
- Cloud deployment for frontend, backend, and agent

## Agent Tools

The AI agent uses structured tools instead of inventing menu or order information.

| Tool          | Purpose                                         |
| ------------- | ----------------------------------------------- |
| `listMenu`    | Returns all available menu items                |
| `searchMenu`  | Searches menu items using customer words        |
| `getMenuItem` | Returns item details and modifier choices       |
| `addToCart`   | Adds a validated item and modifiers to the cart |
| `getCart`     | Returns current cart items and totals           |
| `placeOrder`  | Places the order after customer confirmation    |

## Example Conversation

```text
Customer: I would like a Margherita Pizza.

Agent: Which size would you like: Small, Medium, or Large?
Would you like Extra Cheese, Olives, Jalapenos, or no toppings?

Customer: Medium with Extra Cheese.

Agent: One Medium Margherita Pizza with Extra Cheese has been added.
Would you like to place the order?

Customer: Yes.

Agent: Your order has been confirmed.
```

## Architecture

```mermaid
flowchart LR
    U[Customer] --> F[React Frontend]
    F --> B[Node.js REST API]
    F --> L[LiveKit Cloud]

    L --> A[LiveKit Voice Agent]
    A --> STT[Deepgram STT]
    A --> LLM[Groq LLM]
    A --> TTS[Deepgram TTS]

    A --> T[Agent Tools]
    T --> M[(MongoDB)]
    T --> R[(Redis)]

    B --> M
    B --> R

    B --> O[Orders API]
    B --> AN[Analytics API]

    O --> F
    AN --> F
```

## Request Flow

1. The frontend creates a new ordering session.
2. The backend stores the session and empty cart in Redis.
3. The frontend requests a LiveKit access token for the same session ID.
4. The customer joins a LiveKit room whose room name matches the session ID.
5. The LiveKit agent receives the room and uses it as the active ordering session.
6. The agent uses tools to read menu data and update the cart.
7. The frontend polls the cart API and displays live updates.
8. After confirmation, the order is saved in MongoDB.
9. The cart is cleared and the order appears in the Orders page.
10. Analytics are stored and displayed in the dashboard.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Redux Toolkit
- Tailwind CSS
- shadcn/ui
- LiveKit Client
- Axios
- React Router

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Redis
- Zod
- LiveKit Server SDK

### Voice Agent

- LiveKit Agents
- Groq
- Deepgram STT
- Deepgram TTS
- Structured tool calling

### Deployment

- Render Static Site — frontend
- Render Web Service — backend
- LiveKit Cloud — voice agent
- MongoDB Atlas — database
- Upstash Redis — session and cart storage

## Project Structure

```text
Voice-Agent-POC/
├── backend/
│   ├── src/
│   │   ├── agent/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── docs/
└── README.md
```

## Environment Variables

### Backend `.env`

```env
NODE_ENV=development
PORT=5000

CLIENT_URL=http://localhost:8080

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/voice-ordering-agent
REDIS_URL=rediss://default:password@host.upstash.io:6379

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### Agent secrets

```env
NODE_ENV=production

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/voice-ordering-agent
REDIS_URL=rediss://default:password@host.upstash.io:6379

GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key

GROQ_MODEL=llama-3.1-8b-instant
GROQ_TEMPERATURE=0.2
```

LiveKit Cloud injects the agent connection credentials automatically during deployment.

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
```

The frontend receives both the LiveKit token and LiveKit URL from the backend token endpoint.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/mx7h/Voice-Agent-POC.git
cd Voice-Agent-POC
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment variables

Create:

```text
backend/.env
```

Add the required backend variables.

### 4. Build and start the backend

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run server:start:local
```

### 5. Run the agent locally

```bash
npm run agent:dev
```

### 6. Seed restaurant and menu data

```bash
npm run seed
```

### 7. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 8. Configure frontend environment variables

Create:

```text
frontend/.env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 9. Start the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:8080
```

## Backend Scripts

```json
{
  "dev": "tsx watch --env-file=.env src/server.ts",
  "agent:dev": "tsx --env-file=.env src/agent/index.ts dev",
  "dev:all": "concurrently \"npm run dev\" \"npm run agent:dev\"",
  "seed": "tsx --env-file=.env src/scripts/seed.ts",
  "build": "tsc",
  "server:start": "node dist/server.js",
  "server:start:local": "node --env-file=.env dist/server.js",
  "agent:start": "node --max-old-space-size=2048 dist/agent/index.js start",
  "start": "npm run agent:start"
}
```

## Main API Routes

### Sessions

```http
POST /api/v1/sessions
GET  /api/v1/sessions/:sessionId
```

### LiveKit

```http
GET /api/v1/livekit/token/:sessionId
```

### Restaurant and Menu

```http
GET /api/v1/restaurants
GET /api/v1/menu
GET /api/v1/menu/:menuId
GET /api/v1/menu/search
```

### Cart

```http
GET    /api/v1/cart/:sessionId
POST   /api/v1/cart/:sessionId/items
DELETE /api/v1/cart/:sessionId/items/:cartItemId
DELETE /api/v1/cart/:sessionId
```

### Orders

```http
POST  /api/v1/orders/:sessionId
GET   /api/v1/orders
GET   /api/v1/orders/:orderId
PATCH /api/v1/orders/:orderId/status
```

### Analytics

```http
POST /api/v1/analytics/:sessionId/start
POST /api/v1/analytics/:sessionId/turn
POST /api/v1/analytics/:sessionId/end
GET  /api/v1/analytics
GET  /api/v1/analytics/summary
GET  /api/v1/analytics/:sessionId
```

Route names may differ slightly depending on the final router configuration.

## Deployment

### Backend on Render

```text
Service Type: Web Service
Runtime: Node
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm run server:start
```

### Frontend on Render

```text
Service Type: Static Site
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

React Router rewrite:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

### LiveKit Agent

From the backend directory:

```bash
lk agent create --secrets-file ./secrets.env .
```

For later deployments:

```bash
lk agent deploy .
```

View status and logs:

```bash
lk agent status
lk agent logs
```

## Analytics Tracked

- Total calls
- Completed calls
- Orders placed
- Success rate
- Total turns
- User turns
- Agent turns
- Tool calls
- Cart updates
- Call duration
- Prompt tokens
- Completion tokens
- Total tokens
- Tool latency
- First-response latency where available

## Demo Flow

1. Open the deployed frontend.
2. Start the voice session.
3. Ask the agent to list the menu.
4. Ask for a specific menu item.
5. Select the required and optional modifiers.
6. Confirm that the cart updates in real time.
7. Ask what is currently in the cart.
8. Confirm and place the order.
9. Open the Orders page.
10. Open the Analytics page.

## Tested Scenarios

- LiveKit token generation
- LiveKit Cloud connection
- Speech-to-text input
- Agent voice response
- Menu listing
- Menu search
- Menu item details
- Required modifier validation
- Optional modifier handling
- Cart addition
- Cart quantity updates
- Live cart polling
- Order placement
- Cart clearing after order
- Orders dashboard
- Analytics dashboard
- React Router refresh handling
- Session ID consistency across frontend, backend, Redis, and LiveKit room

## Known Limitations

- Token usage can be optimized further by reducing prompt size, tool descriptions, and conversation history.
- The current POC uses a web voice interface rather than a production SIP/phone integration.
- Payments are outside the current POC scope.
- LLM TTFT and LLM duration may display `0ms` when the provider usage event does not expose those values.
- Render free services may introduce cold-start delays.
- The agent depends on third-party service limits from Groq, Deepgram, LiveKit, MongoDB Atlas, and Upstash.

## Future Improvements

- Conversation-history trimming or summarization
- SMS and email order confirmation
- Real phone-call/SIP integration
- Payment integration
- Customer authentication
- Admin menu management
- Improved call logs and transcript storage
- Multi-restaurant support
- Retry and fallback providers for STT, TTS, and LLM
- More advanced analytics and observability

## Security Notes

- Never commit `.env` or `secrets.env`.
- Keep `LIVEKIT_API_SECRET` on the backend only.
- Keep provider API keys on the backend or agent only.
- LiveKit participant tokens may be sent to the frontend because they are short-lived room-access tokens

## Author

**Mohammed Bin Yahiya**

## Repository

```text
https://github.com/mx7h/Voice-Agent-POC
```
