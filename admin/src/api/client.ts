import axios from 'axios';
import type { Coefficient, Room } from '../types';

const api = axios.create({ baseURL: '/api/admin' });

export const getRooms = (): Promise<Room[]> =>
  api.get<{ data: Room[] }>('/rooms').then((r) => r.data.data);

export const getCoefficients = (): Promise<Coefficient[]> =>
  api.get<{ data: Coefficient[] }>('/coefficients').then((r) => r.data.data);

export const patchCoefficient = (
  bnovoId: string,
  data: Partial<Pick<Coefficient, 'coefficient1' | 'coefficient2' | 'coefficient3'>>,
): Promise<Coefficient> =>
  api.patch<{ data: Coefficient }>(`/coefficients/${bnovoId}`, data).then((r) => r.data.data);
