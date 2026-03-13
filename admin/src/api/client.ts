import axios from 'axios';
import type { Coefficient, Room } from '../types';

const api = axios.create({ baseURL: '/api/admin' });

export const getRooms = (): Promise<Room[]> =>
  api.get<Room[]>('/rooms').then((r) => r.data);

export const getCoefficients = (): Promise<Coefficient[]> =>
  api.get<Coefficient[]>('/coefficients').then((r) => r.data);

export const patchCoefficient = (
  bnovoId: number,
  data: Partial<Pick<Coefficient, 'coefficient1' | 'coefficient2' | 'coefficient3'>>,
): Promise<Coefficient> =>
  api.patch<Coefficient>(`/coefficients/${bnovoId}`, data).then((r) => r.data);
