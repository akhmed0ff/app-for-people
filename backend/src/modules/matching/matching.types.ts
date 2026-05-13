import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../sockets/socket-events';

export type MatchingServer = Server<ClientToServerEvents, ServerToClientEvents>;

export type DriverCandidate = {
  driverId: string;
  distanceKm: number;
};

export type OrderOfferPayload = {
  offerId: string;
  orderId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  tariffCode?: string;
  estimatedPrice?: number;
  distanceToPickupKm: number;
  expiresAt: string;
};
