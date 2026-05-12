import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  updateDriverLocation(dto: UpdateDriverLocationDto) {
    return this.prisma.driverLocation.create({ data: dto });
  }

  latestDriverLocations() {
    return this.prisma.driverLocation.findMany({
      distinct: ['driverId'],
      include: { driver: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
