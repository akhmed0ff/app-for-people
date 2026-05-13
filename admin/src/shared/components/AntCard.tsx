import { Card } from 'antd';
import type { CardProps } from 'antd/es/card';
import type { FC } from 'react';

export const AntCard = Card as unknown as FC<CardProps>;
