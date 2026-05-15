import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  // Баг 4: upsert вместо create — всегда ровно одна запись на водителя
  updateDriverLocation(dto: UpdateDriverLocationDto) {
    return this.prisma.driverLocation.upsert({
      where: { driverId: dto.driverId },
      update: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        updatedAt: new Date(),
      },
      create: dto,
    });
  }

  latestDriverLocations() {
    return this.prisma.driverLocation.findMany({
      include: { driver: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
