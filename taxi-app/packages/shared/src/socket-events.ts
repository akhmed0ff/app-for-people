export const SocketEvent = {
  Connected: 'connected',
  Heartbeat: 'heartbeat',
  HeartbeatAck: 'heartbeat.ack',
  DriverOnline: 'driver.online',
  DriverOffline: 'driver.offline',
  DriverLocationUpdate: 'driver.location.update',
  DriverLocationUpdated: 'driver.location.updated',
  OrderOffered: 'order.offered',
  OrderAccept: 'order.accept',
  OrderAccepted: 'order.accepted',
  OrderCancel: 'order.cancel',
  OrderCanceled: 'order.canceled',
  OrderStatusUpdate: 'order.status.update',
  OrderStatusUpdated: 'order.status.updated',
  EtaRequest: 'eta.request',
  EtaUpdated: 'eta.updated',
  Error: 'error',
} as const;

export type SocketEventName = (typeof SocketEvent)[keyof typeof SocketEvent];
