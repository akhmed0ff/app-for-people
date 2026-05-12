import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateSocketPayload<T extends object>(
  dtoClass: new () => T,
  payload: unknown,
): Promise<T> {
  const dto = plainToInstance(dtoClass, payload ?? {});
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new BadRequestException('Invalid socket payload');
  }

  return dto;
}
