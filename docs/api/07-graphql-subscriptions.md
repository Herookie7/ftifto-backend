# Chunk 7: GraphQL Subscriptions

**Transport:** WebSocket at `/graphql` (same path as HTTP)

**Connection:** Use `subscriptions-transport-ws` or compatible client. Pass `Authorization: Bearer <token>` in connection params (`authorization` or `Authorization` key).

**Auth:** Token is validated on connect. Subscriptions may filter data by authenticated user.

---

## Subscription Operations

| Subscription | Arguments | Payload Type | Description |
|--------------|-----------|--------------|-------------|
| `subscriptionOrder` | `id: String!` | `Order` | Real-time updates for a specific order |
| `subscriptionRiderLocation` | `riderId: String!` | `User` | Real-time rider location updates (User with location) |
| `orderStatusChanged` | `userId: String!` | `OrderStatusUpdate` | Order status updates for a user's orders |
| `subscriptionNewMessage` | `order: ID!` | `ChatMessage` | New chat messages for an order |
| `subscriptionZoneOrders` | `zoneId: String!` | `ZoneOrderUpdate` | New/updated orders in a zone |
| `subscribePlaceOrder` | `restaurant: String!` | `OrderStatusUpdate` | Order updates for a restaurant (e.g. new orders) |

---

## Payload Types

### OrderStatusUpdate

```graphql
type OrderStatusUpdate {
  userId: ID
  origin: String
  order: Order
}
```

### ZoneOrderUpdate

```graphql
type ZoneOrderUpdate {
  zoneId: String
  origin: String
  order: Order
}
```

---

## Example Subscription (subscriptions-transport-ws)

```javascript
import { SubscriptionClient } from 'subscriptions-transport-ws';

const wsLink = new SubscriptionClient('wss://your-api.com/graphql', {
  reconnect: true,
  connectionParams: {
    authorization: `Bearer ${token}`
  }
});
```

### Subscribe to order updates

```graphql
subscription OnOrderUpdate($id: String!) {
  subscriptionOrder(id: $id) {
    _id
    orderId
    orderStatus
    paymentStatus
    rider { _id name }
  }
}
```

### Subscribe to rider location

```graphql
subscription OnRiderLocation($riderId: String!) {
  subscriptionRiderLocation(riderId: $riderId) {
    _id
    name
    riderProfile {
      location {
        coordinates
      }
    }
  }
}
```

### Subscribe to order status changes for user

```graphql
subscription OnOrderStatusChanged($userId: String!) {
  orderStatusChanged(userId: $userId) {
    userId
    origin
    order {
      _id
      orderId
      orderStatus
    }
  }
}
```

### Subscribe to new chat messages

```graphql
subscription OnNewMessage($order: ID!) {
  subscriptionNewMessage(order: $order) {
    id
    message
    user { _id name }
    createdAt
  }
}
```

### Subscribe to zone orders (admin/dispatcher)

```graphql
subscription OnZoneOrders($zoneId: String!) {
  subscriptionZoneOrders(zoneId: $zoneId) {
    zoneId
    origin
    order {
      _id
      orderId
      orderStatus
      restaurant { name }
      customer { name phone }
    }
  }
}
```

### Subscribe to restaurant order updates (seller)

```graphql
subscription OnPlaceOrder($restaurant: String!) {
  subscribePlaceOrder(restaurant: $restaurant) {
    userId
    origin
    order {
      _id
      orderId
      orderStatus
      items { title quantity }
      customer { name phone }
    }
  }
}
```

---

## WebSocket Connection Flow

1. Client opens WebSocket to `ws(s)://host/graphql`
2. Client sends `connection_init` with `payload: { authorization: "Bearer <token>" }`
3. Server validates token and returns `connection_ack`
4. Client sends `start` with subscription query and variables
5. Server streams `data` messages when events occur
6. Client sends `stop` to unsubscribe

---

**Source file:** `src/graphql/schema.js`, `src/app.js` (SubscriptionServer setup)
