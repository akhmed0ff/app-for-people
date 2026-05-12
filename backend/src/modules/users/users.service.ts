import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: this.publicSelect(),
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: this.publicSelect(),
    });
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash: await bcrypt.hash(dto.password, 10),
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
      select: this.publicSelect(),
    });
  }

  private publicSelect() {
    return {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }
}
