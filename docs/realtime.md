# Realtime API

Socket.IO namespace: `/taxi`.

Authenticate with an access token in one of these places:

- `Authorization: Bearer <accessToken>`
- `auth.token`
Core rooms:

- `driver:{driverId}`
- `passenger:{passengerId}`
- `order:{orderId}`
- `admins`
- `drivers:online`

Core events:

- `driver.online`
- `driver.offline`
- `driver.location.update`
- `driver.location.updated`
- `driver.nearest.search`
- `driver.nearest.found`
- `order.dispatch`
- `order.offered`
- `order.accept`
- `order.accepted`
- `order.cancel`
- `order.canceled`
- `order.status.update`
- `order.status.updated`
- `eta.request`
- `eta.updated`
- `heartbeat`
- `heartbeat.ack`

Clients should emit `heartbeat` every 25 seconds. The server stores heartbeat state in Redis with a 45 second TTL and restores rooms from JWT identity on reconnect. After reconnect, clients should re-emit their active `order.dispatch`/room-related workflow event if they need a fresh snapshot.
