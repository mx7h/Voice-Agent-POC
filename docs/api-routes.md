# API Routes

## 1. Base URL

### Local development

```text
http://localhost:5000/api/v1
```

### Deployed backend

```text
https://voice-agent-poc-f2tv.onrender.com/api/v1
```

All routes below are relative to the `/api/v1` base path.

---

## 2. Response Format

Successful responses generally follow this structure:

```json
{
  "success": true,
  "data": {}
}
```

Error responses generally follow this structure:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 3. Health Check

### Check backend status

```http
GET /health
```

Example response:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

---

## 4. Session Routes

Sessions represent one active restaurant ordering conversation.

### Create a session

```http
POST /sessions
```

Example response:

```json
{
  "success": true,
  "data": {
    "sessionId": "cbcdec12-ec54-4fa0-8725-1d52c86d285a"
  }
}
```

The backend creates:

- A unique session ID
- An empty Redis cart
- An active session state
- Default customer/session metadata

### Get a session

```http
GET /sessions/:sessionId
```

Example response:

```json
{
  "success": true,
  "data": {
    "sessionId": "cbcdec12-ec54-4fa0-8725-1d52c86d285a",
    "currentState": "active",
    "customer": {},
    "cart": {
      "items": [],
      "subtotal": 0,
      "tax": 0,
      "total": 0
    }
  }
}
```

### Close a session

```http
PATCH /sessions/:sessionId/close
```

Example response:

```json
{
  "success": true,
  "data": {
    "sessionId": "cbcdec12-ec54-4fa0-8725-1d52c86d285a",
    "currentState": "closed"
  }
}
```

Use this route only if it exists in the final router. Otherwise, the session is closed internally by the agent or service layer.

---

## 5. LiveKit Routes

### Generate a LiveKit token

```http
GET /livekit/token/:sessionId
```

The same `sessionId` is used as:

- LiveKit room name
- Participant identity
- Redis session key
- Agent session ID
- Cart polling session ID

Example response:

```json
{
  "success": true,
  "data": {
    "token": "livekit-participant-token",
    "url": "wss://your-project.livekit.cloud",
    "room": "cbcdec12-ec54-4fa0-8725-1d52c86d285a"
  }
}
```

The frontend connects using:

```ts
await room.connect(url, token);
```

---

## 6. Restaurant Routes

### Get restaurant details

```http
GET /restaurants
```

or, depending on the final router:

```http
GET /restaurant
```

Example response:

```json
{
  "success": true,
  "data": {
    "_id": "restaurant-object-id",
    "name": "Food Palace",
    "phone": "0000000000",
    "address": "Restaurant address",
    "isOpen": true,
    "openingHours": {}
  }
}
```

### Check restaurant availability

Restaurant availability is normally validated internally by the order service before order placement.

---

## 7. Menu Routes

### Get all menu items

```http
GET /menu
```

Example response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "menu-object-id",
      "name": "Margherita Pizza",
      "description": "Classic pizza",
      "basePrice": 399,
      "category": "Pizza",
      "available": true,
      "modifierGroups": []
    }
  ]
}
```

### Get available menu items

```http
GET /menu/available
```

Use this route if it exists in the final router.

### Search menu

```http
GET /menu/search?query=chicken
```

Example response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "menu-object-id",
      "name": "Chicken Combo",
      "basePrice": 399,
      "category": "Combo",
      "available": true
    }
  ]
}
```

### Get menu item by ID

```http
GET /menu/:menuId
```

Example response:

```json
{
  "success": true,
  "data": {
    "_id": "menu-object-id",
    "name": "Chicken Combo",
    "basePrice": 399,
    "available": true,
    "modifierGroups": [
      {
        "name": "Entree",
        "required": true,
        "multiple": false,
        "minSelection": 1,
        "maxSelection": 1,
        "options": [
          {
            "name": "Burger",
            "price": 0,
            "available": true
          },
          {
            "name": "Wrap",
            "price": 0,
            "available": true
          }
        ]
      }
    ]
  }
}
```

### Create a menu item

```http
POST /menu
```

Example request:

```json
{
  "restaurantId": "restaurant-object-id",
  "name": "Veg Burger",
  "description": "Grilled vegetable burger",
  "basePrice": 249,
  "category": "Burger",
  "available": true,
  "modifierGroups": []
}
```

### Update a menu item

```http
PATCH /menu/:menuId
```

Example request:

```json
{
  "basePrice": 279,
  "available": true
}
```

### Delete a menu item

```http
DELETE /menu/:menuId
```

Only document these create, update, and delete routes if they are present in the final router.

---

## 8. Cart Routes

The cart is stored in Redis and is scoped by `sessionId`.

### Get cart

```http
GET /cart/:sessionId
```

Example response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cartItemId": "cart-item-uuid",
        "menuId": "menu-object-id",
        "itemName": "Chicken Combo",
        "quantity": 1,
        "basePrice": 399,
        "selectedModifiers": [
          {
            "modifierOptionId": "modifier-object-id",
            "groupName": "Entree",
            "optionName": "Burger",
            "name": "Burger",
            "price": 0
          },
          {
            "modifierOptionId": "modifier-object-id",
            "groupName": "Side",
            "optionName": "Fries",
            "name": "Fries",
            "price": 0
          }
        ],
        "totalPrice": 399
      }
    ],
    "subtotal": 399,
    "tax": 19.95,
    "total": 418.95
  }
}
```

### Add item to cart

```http
POST /cart/:sessionId/items
```

Example request:

```json
{
  "menuId": "menu-object-id",
  "quantity": 1,
  "selectedModifiers": [
    {
      "groupName": "Entree",
      "name": "Burger"
    },
    {
      "groupName": "Side",
      "name": "Fries"
    }
  ]
}
```

Validation includes:

- Menu item exists
- Menu item is available
- Quantity is a positive integer
- Required modifier groups are selected
- Modifier names are valid
- Modifier selection limits are respected

### Remove item from cart

```http
DELETE /cart/:sessionId/items/:cartItemId
```

### Clear cart

```http
DELETE /cart/:sessionId
```

Example response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "subtotal": 0,
    "tax": 0,
    "total": 0
  }
}
```

---

## 9. Order Routes

Orders are persisted in MongoDB.

### Place an order

```http
POST /orders/:sessionId
```

Example request:

```json
{
  "confirmed": true
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "_id": "order-object-id",
    "sessionId": "cbcdec12-ec54-4fa0-8725-1d52c86d285a",
    "orderNumber": "ORD-1784722164877-990F48",
    "orderStatus": "confirmed",
    "subtotal": 399,
    "tax": 19.95,
    "total": 418.95
  }
}
```

After successful order placement:

- The order is saved in MongoDB
- Analytics are updated
- The Redis cart is cleared
- The session state becomes `order_placed`

### Get all orders

```http
GET /orders
```

### Get order by ID

```http
GET /orders/:orderId
```

### Update order status

```http
PATCH /orders/:orderId/status
```

Example request:

```json
{
  "status": "preparing"
}
```

Supported values may include:

```text
pending
confirmed
preparing
completed
cancelled
```

---

## 10. Analytics Routes

Analytics are stored per session.

### Start analytics session

```http
POST /analytics/:sessionId/start
```

### Record transcript turn

```http
POST /analytics/:sessionId/turn
```

Example request:

```json
{
  "role": "user"
}
```

Supported roles:

```text
user
assistant
```

### End analytics session

```http
POST /analytics/:sessionId/end
```

Example request:

```json
{
  "status": "completed"
}
```

Supported values may include:

```text
active
completed
failed
```

### Get analytics summary

```http
GET /analytics/summary
```

Example response:

```json
{
  "success": true,
  "data": {
    "totalCalls": 18,
    "completedCalls": 18,
    "failedCalls": 0,
    "ordersPlaced": 8,
    "totalTurns": 157,
    "totalToolCalls": 70,
    "totalCartUpdates": 19,
    "totalPromptTokens": 222209,
    "totalCompletionTokens": 8059,
    "totalTokens": 230268,
    "averageDurationSeconds": 97,
    "averageLatency": 432
  }
}
```

### Get all analytics sessions

```http
GET /analytics
```

### Get analytics by session ID

```http
GET /analytics/:sessionId
```

---
