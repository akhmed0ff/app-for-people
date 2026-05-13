import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import {
  AssignedDriver,
  DriverLocation,
  Order,
  OrderStatus,
  PassengerTripState,
  Point,
  RouteEstimate,
  Tariff,
} from '../api/types';
import { createOrder as createOrderApi, fetchActiveOrder } from '../api/customer-api';

const ACTIVE_ORDER_KEY = 'customer.activeOrder';
const statusRank: Record<OrderStatus, number> = {
  SEARCHING: 1,
  DRIVER_ASSIGNED: 2,
  DRIVER_ARRIVED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  CANCELED: 5,
};

type CreateOrderInput = {
  tariffCode: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
};

type BookingState = {
  pickup: Point | null;
  dropoff: Point | null;
  selectedTariff: Tariff | null;
  estimate: RouteEstimate | null;
  activeOrder: Order | null;
  tripState: PassengerTripState;
  assignedDriver: AssignedDriver | null;
  driverLocation: DriverLocation | null;
  hydrated: boolean;
  isLoading: boolean;
  isCreatingOrder: boolean;
  isRecoveringTrip: boolean;
  error: string | null;
  lastSyncAt: string | null;
  setPickup: (point: Point | null) => void;
  setDropoff: (point: Point | null) => void;
  setTariff: (tariff: Tariff) => void;
  setEstimate: (estimate: RouteEstimate | null) => void;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  setActiveOrder: (order: Order | null) => void;
  clearActiveOrder: () => void;
  hydrateActiveOrder: () => Promise<void>;
  recoverActiveTrip: () => Promise<Order | null>;
  syncActiveOrder: () => Promise<Order | null>;
  handleOrderAccepted: (order: Order) => void;
  handleDriverArrived: (order: Order) => void;
  handleOrderStarted: (order: Order) => void;
  handleOrderCompleted: (order: Order) => void;
  handleOrderCanceled: (order: Order) => void;
  handleNoDriversAvailable: () => void;
  setDriverLocation: (location: DriverLocation | null) => void;
  resetBooking: () => void;
};

export const useBookingStore = create<BookingState>((set, get) => ({
  pickup: null,
  dropoff: null,
  selectedTariff: null,
  estimate: null,
  activeOrder: null,
  tripState: 'IDLE',
  assignedDriver: null,
  driverLocation: null,
  hydrated: false,
  isLoading: false,
  isCreatingOrder: false,
  isRecoveringTrip: false,
  error: null,
  lastSyncAt: null,
  setPickup: (pickup) => set({ pickup, estimate: null }),
  setDropoff: (dropoff) => set({ dropoff, estimate: null }),
  setTariff: (selectedTariff) => set({ selectedTariff }),
  setEstimate: (estimate) => set({ estimate }),
  createOrder: async (input) => {
    set({ isCreatingOrder: true, error: null });
    try {
      const order = await createOrderApi(input);
      get().setActiveOrder(order);
      set({ tripState: 'SEARCHING_DRIVER' });
      return order;
    } catch (error) {
      set({ tripState: 'ERROR', error: 'Не удалось создать заказ' });
      throw error;
    } finally {
      set({ isCreatingOrder: false });
    }
  },
  setActiveOrder: (activeOrder) => {
    if (!activeOrder) {
      void SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
      set({
        activeOrder: null,
        assignedDriver: null,
        driverLocation: null,
        tripState: 'IDLE',
      });
      return;
    }

    set((state) => {
      const current = state.activeOrder;
      if (
        current &&
        current.id === activeOrder.id &&
        statusRank[activeOrder.status] < statusRank[current.status]
      ) {
        return state;
      }

      if (!['COMPLETED', 'CANCELED'].includes(activeOrder.status)) {
        void SecureStore.setItemAsync(ACTIVE_ORDER_KEY, JSON.stringify(activeOrder));
      } else {
        void SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
      }

      return {
        activeOrder,
        tripState: tripStateFromStatus(activeOrder.status),
        assignedDriver: activeOrder.driver ?? state.assignedDriver,
        error: null,
        lastSyncAt: new Date().toISOString(),
      };
    });
  },
  clearActiveOrder: () => {
    void SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
    set({
      activeOrder: null,
      assignedDriver: null,
      driverLocation: null,
      tripState: 'IDLE',
      error: null,
    });
  },
  hydrateActiveOrder: async () => {
    const raw = await SecureStore.getItemAsync(ACTIVE_ORDER_KEY);
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    try {
      const activeOrder = JSON.parse(raw) as Order;
      set({
        activeOrder,
        tripState: tripStateFromStatus(activeOrder.status),
        assignedDriver: activeOrder.driver ?? null,
        hydrated: true,
      });
    } catch {
      await SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
      set({ activeOrder: null, tripState: 'IDLE', hydrated: true });
    }
  },
  recoverActiveTrip: async () => {
    set({ isRecoveringTrip: true, error: null });
    try {
      const order = await fetchActiveOrder();
      get().setActiveOrder(order);
      return order;
    } catch {
      set({ error: 'Не удалось восстановить поездку' });
      return get().activeOrder;
    } finally {
      set({ isRecoveringTrip: false });
    }
  },
  syncActiveOrder: async () => {
    set({ isLoading: true, error: null });
    try {
      const order = await fetchActiveOrder();
      if (order) {
        get().setActiveOrder(order);
      }
      return order;
    } catch {
      set({ error: 'Не удалось обновить статус поездки' });
      return get().activeOrder;
    } finally {
      set({ isLoading: false, lastSyncAt: new Date().toISOString() });
    }
  },
  handleOrderAccepted: (order) => get().setActiveOrder(order),
  handleDriverArrived: (order) => get().setActiveOrder(order),
  handleOrderStarted: (order) => get().setActiveOrder(order),
  handleOrderCompleted: (order) => get().setActiveOrder(order),
  handleOrderCanceled: (order) => get().setActiveOrder(order),
  handleNoDriversAvailable: () => set({ tripState: 'NO_DRIVERS_AVAILABLE', error: null }),
  setDriverLocation: (driverLocation) => set({ driverLocation }),
  resetBooking: () => {
    void SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
    set({
      dropoff: null,
      selectedTariff: null,
      estimate: null,
      activeOrder: null,
      assignedDriver: null,
      driverLocation: null,
      tripState: 'IDLE',
      error: null,
    });
  },
}));

function tripStateFromStatus(status: OrderStatus): PassengerTripState {
  switch (status) {
    case 'SEARCHING':
      return 'SEARCHING_DRIVER';
    case 'DRIVER_ASSIGNED':
      return 'DRIVER_ASSIGNED';
    case 'DRIVER_ARRIVED':
      return 'DRIVER_ARRIVED';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELED':
      return 'CANCELED';
    default:
      return 'IDLE';
  }
}
