import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PricingService } from '../pricing/pricing.service';
import { RouteEstimateDto } from './dto/route-estimate.dto';
import { RouteEstimate, toRoutePricingBreakdown } from './routing.types';

type MapboxDirectionsResponse = {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: string;
  }>;
  message?: string;
};

const MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';
const MAPBOX_TIMEOUT_MS = 8000;

@Injectable()
export class RoutingService {
  constructor(
    private readonly config: ConfigService,
    private readonly pricingService: PricingService,
  ) {}

  async estimate(dto: RouteEstimateDto): Promise<RouteEstimate> {
    this.validateCoordinates(dto);
    const token = this.config.get<string>('MAPBOX_ACCESS_TOKEN');
    if (!token || token.startsWith('replace-with')) {
      throw new ServiceUnavailableException('Mapbox access token is not configured');
    }

    const route = await this.fetchRoute(dto, token);
    const distanceMeters = Math.ceil(route.distance);
    const durationSeconds = Math.ceil(route.duration);
    const price = await this.pricingService.estimate({
      tariffCode: dto.tariffCode,
      distanceMeters,
      waitingSeconds: 0,
      stopsCount: 0,
    });

    return {
      distanceMeters,
      distanceKm: Number((distanceMeters / 1000).toFixed(2)),
      durationSeconds,
      durationMinutes: Math.ceil(durationSeconds / 60),
      geometry: route.geometry ?? null,
      tariffCode: price.tariffCode,
      estimatedPrice: price.total,
      pricingBreakdown: toRoutePricingBreakdown(price),
    };
  }

  private validateCoordinates(dto: RouteEstimateDto) {
    if (!this.isLatitude(dto.pickupLat) || !this.isLatitude(dto.destinationLat)) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (!this.isLongitude(dto.pickupLng) || !this.isLongitude(dto.destinationLng)) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }
  }

  private isLatitude(value: number) {
    return Number.isFinite(value) && value >= -90 && value <= 90;
  }

  private isLongitude(value: number) {
    return Number.isFinite(value) && value >= -180 && value <= 180;
  }

  private async fetchRoute(dto: RouteEstimateDto, token: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAPBOX_TIMEOUT_MS);
    const coordinates = `${dto.pickupLng},${dto.pickupLat};${dto.destinationLng},${dto.destinationLat}`;
    const url = new URL(`${MAPBOX_DIRECTIONS_URL}/${coordinates}`);
    url.searchParams.set('overview', 'full');
    url.searchParams.set('geometries', 'polyline');
    url.searchParams.set('access_token', token);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        this.handleMapboxError(response.status);
      }

      const body = (await response.json()) as MapboxDirectionsResponse;
      const route = body.routes?.[0];
      if (!route) {
        throw new NotFoundException('No route found');
      }
      return route;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException('Mapbox routing is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private handleMapboxError(status: number): never {
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      throw new HttpException('Mapbox rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (status === HttpStatus.NOT_FOUND) {
      throw new NotFoundException('No route found');
    }
    throw new ServiceUnavailableException('Mapbox routing is unavailable');
  }
}
