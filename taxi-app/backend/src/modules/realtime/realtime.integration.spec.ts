import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DriverStatus, OrderStatus, UserRole } from '@prisma/client';
import { io, Socket } from 'socket.io-client';
import { PrismaService } from '../../database/prisma.service';
import { SERVER_SOCKET_EVENTS } from './realtime.events';

class InMemoryPrisma {
  users: any[] = [];
  passengers: any[] = [];
  drivers: any[] = [];
  orders: any[] = [];
  locations: any[] = [];
  tariffs = [
    {
      id: 'tariff_economy',
      code: 'ECONOMY',
      name: 'Эконом',
      baseFare: 8000,
      pricePerKm: 2000,
      freeWaitingMinutes: 3,
      waitingPricePerMinute: 500,
      stopPricePerMinute: 500,
      minimumFare: 10000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  user = {
    upsert: async ({ where, update, create, select }: any) => {
      let user = this.users.find((item) => item.phone === where.phone);

      if (user) {
        Object.assign(user, update, { updatedAt: new Date() });
      } else {
        user = {
          id: `user_${this.users.length + 1}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        this.users.push(user);
      }

      return this.pick(user, select);
    },
    findUnique: async ({ where, include, select }: any) => {
      const user = this.users.find((item) => item.id === where.id || item.phone === where.phone);

      if (!user) {
        return null;
      }

      const result = {
        ...user,
        passenger: include?.passenger
          ? this.passengers.find((item) => item.userId === user.id) ?? null
          : undefined,
        driver: include?.driver ? this.drivers.find((item) => item.userId === user.id) ?? null : undefined,
      };

      return this.pick(result, select);
    },
    findUniqueOrThrow: async ({ where, select }: any) => {
      const user = await this.user.findUnique({ where, select });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    },
  };

  passenger = {
    upsert: async ({ where, create }: any) => {
      let passenger = this.passengers.find((item) => item.userId === where.userId);

      if (!passenger) {
        passenger = {
          id: `passenger_${this.passengers.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        this.passengers.push(passenger);
      }

      return passenger;
    },
    findUnique: async ({ where }: any) =>
      this.passengers.find((item) => item.userId === where.userId || item.id === where.id) ?? null,
    deleteMany: async ({ where }: any) => {
      const before = this.passengers.length;
      this.passengers = this.passengers.filter((item) => item.userId !== where.userId);
      return { count: before - this.passengers.length };
    },
  };

  driver = {
    upsert: async ({ where, create, update }: any) => {
      let driver = this.drivers.find((item) => item.userId === where.userId);

      if (driver) {
        Object.assign(driver, update, { updatedAt: new Date() });
      } else {
        driver = {
          id: `driver_${this.drivers.length + 1}`,
          balance: 0,
          rating: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        this.drivers.push(driver);
      }

      return driver;
    },
    findUnique: async ({ where }: any) =>
      this.drivers.find((item) => item.userId === where.userId || item.id === where.id) ?? null,
    update: async ({ where, data }: any) => {
      const driver = this.drivers.find((item) => item.id === where.id);
      Object.assign(driver, data, { updatedAt: new Date() });
      return driver;
    },
    findMany: async ({ where, include }: any = {}) =>
      this.drivers
        .filter((driver) => !where?.status || driver.status === where.status)
        .map((driver) => ({
          ...driver,
          location: include?.location
            ? this.locations.find((location) => location.driverId === driver.id) ?? null
            : undefined,
        })),
    deleteMany: async ({ where }: any) => {
      const before = this.drivers.length;
      this.drivers = this.drivers.filter((item) => item.userId !== where.userId);
      return { count: before - this.drivers.length };
    },
  };

  driverLocation = {
    findUnique: async ({ where }: any) =>
      this.locations.find((location) => location.driverId === where.driverId) ?? null,
    upsert: async ({ where, update, create }: any) => {
      let location = this.locations.find((item) => item.driverId === where.driverId);

      if (location) {
        Object.assign(location, update, { updatedAt: new Date() });
      } else {
        location = {
          id: `location_${this.locations.length + 1}`,
          updatedAt: new Date(),
          ...create,
        };
        this.locations.push(location);
      }

      return location;
    },
  };

  tariff = {
    findFirst: async ({ where }: any) =>
      this.tariffs.find((tariff) => tariff.code === where.code && tariff.isActive === where.isActive) ?? null,
    findUnique: async ({ where }: any) => this.tariffs.find((tariff) => tariff.code === where.code) ?? null,
    findMany: async () => this.tariffs.filter((tariff) => tariff.isActive),
  };

  order = {
    create: async ({ data }: any) => {
      const order = {
        id: `order_${this.orders.length + 1}`,
        driverId: null,
        finalPrice: null,
        waitingMinutes: 0,
        stopMinutes: 0,
        acceptedAt: null,
        arrivedAt: null,
        startedAt: null,
        completedAt: null,
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.orders.push(order);
      return order;
    },
    findMany: async ({ where }: any = {}) =>
      this.orders.filter((order) =>
        Object.entries(where ?? {}).every(([key, value]) => order[key] === value),
      ),
    findFirst: async ({ where }: any) =>
      this.orders.find(
        (order) =>
          order.driverId === where.driverId &&
          (!where.status?.in || where.status.in.includes(order.status)),
      ) ?? null,
    findUnique: async ({ where, include, select }: any) => {
      const order = this.orders.find((item) => item.id === where.id);

      if (!order) {
        return null;
      }

      const result = {
        ...order,
        tariff: include?.tariff
          ? this.tariffs.find((tariff) => tariff.id === order.tariffId) ?? null
          : undefined,
      };

      return this.pick(result, select);
    },
    updateMany: async ({ where, data }: any) => {
      const order = this.orders.find((item) =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      );

      if (!order) {
        return { count: 0 };
      }

      Object.assign(order, data, { updatedAt: new Date() });
      return { count: 1 };
    },
    update: async ({ where, data }: any) => {
      const order = this.orders.find((item) => item.id === where.id);
      Object.assign(order, data, { updatedAt: new Date() });
      return order;
    },
  };

  $transaction = async (callback: (tx: this) => Promise<unknown>) => callback(this);

  pick(record: any, select?: Record<string, boolean>) {
    if (!record || !select) {
      return record;
    }

    return Object.fromEntries(Object.keys(select).map((key) => [key, record[key]]));
  }
}

describe('Realtime integration', () => {
  let app: INestApplication;
  let baseUrl: string;
  let passengerSocket: Socket;
  let driverSocket: Socket;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://taxi:taxi@localhost:5432/taxi_app?schema=public';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'test-secret';
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = '*';

    const { AppModule } = await import('../../app.module');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(new InMemoryPrisma())
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 0 : address.port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    passengerSocket?.disconnect();
    driverSocket?.disconnect();
    await app?.close();
  });

  it('emits order lifecycle events from REST changes', async () => {
    const passengerLogin = await post('/api/auth/dev-login', {
      phone: '+998901112233',
      role: UserRole.PASSENGER,
    });
    const driverLogin = await post('/api/auth/dev-login', {
      phone: '+998901112244',
      role: UserRole.DRIVER,
    });

    passengerSocket = await connectSocket(passengerLogin.accessToken);
    driverSocket = await connectSocket(driverLogin.accessToken);

    await emitWithAck(driverSocket, 'driver:online', {});

    const driverOrderCreated = once(driverSocket, SERVER_SOCKET_EVENTS.ORDER_CREATED);
    const passengerOrderAccepted = once(passengerSocket, SERVER_SOCKET_EVENTS.ORDER_ACCEPTED);

    const order = await post(
      '/api/orders',
      {
        tariffCode: 'ECONOMY',
        pickupAddress: 'Точка А',
        pickupLat: 41.311081,
        pickupLng: 69.240562,
        destinationAddress: 'Точка Б',
        destinationLat: 41.299496,
        destinationLng: 69.240073,
        distanceKm: 4.7,
      },
      passengerLogin.accessToken,
    );

    await expect(driverOrderCreated).resolves.toMatchObject({
      order: {
        id: order.id,
        status: OrderStatus.SEARCHING,
      },
    });

    await post(`/api/orders/${order.id}/accept`, {}, driverLogin.accessToken);

    await expect(passengerOrderAccepted).resolves.toMatchObject({
      order: {
        id: order.id,
        status: OrderStatus.DRIVER_ASSIGNED,
      },
    });
  });

  async function post(path: string, body: unknown, token?: string) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    expect(response.ok).toBe(true);
    return response.json();
  }

  async function connectSocket(token: string): Promise<Socket> {
    const socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });

    await once(socket, 'connect');
    return socket;
  }

  function once(socket: Socket, event: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 3000);
      socket.once(event, (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
      socket.once('connect_error', reject);
    });
  }

  function emitWithAck(socket: Socket, event: string, payload: unknown): Promise<unknown> {
    return new Promise((resolve) => {
      socket.emit(event, payload, resolve);
    });
  }
});
