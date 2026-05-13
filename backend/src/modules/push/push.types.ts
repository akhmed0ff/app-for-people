export type PushNotificationType =
  | 'NEW_ORDER'
  | 'ORDER_ACCEPTED'
  | 'DRIVER_ARRIVED'
  | 'ORDER_STARTED'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELED';

export type PushRole = 'PASSENGER' | 'DRIVER';

export type OrderPushPayload = {
  type: PushNotificationType;
  orderId: string;
  role: PushRole;
};

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: OrderPushPayload;
  sound?: 'default';
  channelId?: string;
};

export type ExpoPushTicket = {
  status?: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
};

export type ExpoPushResult = {
  invalidTokens: string[];
  failed: Array<{ token: string; message: string }>;
};
