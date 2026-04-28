# realtime

Node.js · socket.io · Redis pub/sub

WebSocket server for presence tracking and live event delivery.

## Stack

- **Runtime**: Node.js 20
- **Transport**: socket.io
- **Pub/sub**: Redis adapter
- **Auth**: JWT verification on connect

## Events

| Event            | Direction      | Description                    |
|------------------|----------------|--------------------------------|
| `presence:join`  | server → room  | User came online               |
| `presence:leave` | server → room  | User went offline              |
| `file:processed` | server → user  | File pipeline finished         |
| `payment:updated`| server → user  | Subscription state changed     |

## Dev

```bash
npm install
npm run dev
```
