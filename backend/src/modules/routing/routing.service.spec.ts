import { BadRequestException, HttpException, HttpStatus, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PricingService } from '../pricing/pricing.service';
import { RoutingService } from './routing.service';

const routeDto = {
  pickupLat: 41.311081,
  pickupLng: 69.240562,
  destinationLat: 41.299496,
  destinationLng: 69.240073,
  tariffCode: 'ECONOMY',
};

describe('RoutingService', () => {
  const config = { get: jest.fn() };
  const pricing = { estimate: jest.fn() };
  let service: RoutingService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string) => (key === 'MAPBOX_ACCESS_TOKEN' ? 'mapbox-token' : undefined));
    pricing.estimate.mockResolvedValue({
      tariffCode: 'ECONOMY',
      carSupplyPrice: 8000,
      distancePrice: 9400,
      waitingPrice: 0,
      stopsPrice: 0,
      minimumOrderPrice: 10000,
      total: 17400,
    });
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        routes: [{ distance: 4700.4, duration: 690.2, geometry: 'polyline' }],
      }),
    });
    global.fetch = fetchMock;
    service = new RoutingService(config as unknown as ConfigService, pricing as unknown as PricingService);
  });

  it('validates coordinates', async () => {
    await expect(service.estimate({ ...routeDto, pickupLat: 100 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws if token is missing', async () => {
    config.get.mockReturnValue(undefined);

    await expect(service.estimate(routeDto)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('converts meters to km and seconds to minutes', async () => {
    const result = await service.estimate(routeDto);

    expect(result.distanceMeters).toBe(4701);
    expect(result.distanceKm).toBe(4.7);
    expect(result.durationSeconds).toBe(691);
    expect(result.durationMinutes).toBe(12);
  });

  it('calls PricingService with Mapbox distance', async () => {
    await service.estimate(routeDto);

    expect(pricing.estimate).toHaveBeenCalledWith({
      tariffCode: 'ECONOMY',
      distanceMeters: 4701,
      waitingSeconds: 0,
      stopsCount: 0,
    });
  });

  it('handles no route', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ routes: [] }),
    });

    await expect(service.estimate(routeDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('handles Mapbox rate limit', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: HttpStatus.TOO_MANY_REQUESTS });

    await expect(service.estimate(routeDto)).rejects.toBeInstanceOf(HttpException);
  });

  it('handles Mapbox network errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'));

    await expect(service.estimate(routeDto)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
