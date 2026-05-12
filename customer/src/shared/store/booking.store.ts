import { create } from 'zustand';
import { DriverLocation, Order, Point, PriceEstimate, Tariff } from '../api/types';

type BookingState = {
  pickup: Point | null;
  dropoff: Point | null;
  selectedTariff: Tariff | null;
  estimate: PriceEstimate | null;
  activeOrder: Order | null;
  driverLocation: DriverLocation | null;
  setPickup: (point: Point) => void;
  setDropoff: (point: Point) => void;
  setTariff: (tariff: Tariff) => void;
  setEstimate: (estimate: PriceEstimate | null) => void;
  setActiveOrder: (order: Order | null) => void;
  setDriverLocation: (location: DriverLocation | null) => void;
  resetBooking: () => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  pickup: null,
  dropoff: null,
  selectedTariff: null,
  estimate: null,
  activeOrder: null,
  driverLocation: null,
  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setTariff: (selectedTariff) => set({ selectedTariff }),
  setEstimate: (estimate) => set({ estimate }),
  setActiveOrder: (activeOrder) => set({ activeOrder }),
  setDriverLocation: (driverLocation) => set({ driverLocation }),
  resetBooking: () =>
    set({
      dropoff: null,
      selectedTariff: null,
      estimate: null,
      activeOrder: null,
      driverLocation: null,
    }),
}));
