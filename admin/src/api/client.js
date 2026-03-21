import axios from 'axios';
const api = axios.create({ baseURL: '/api/admin' });
export const getRooms = () => api.get('/rooms').then((r) => r.data.data);
export const getCoefficients = () => api.get('/coefficients').then((r) => r.data.data);
export const patchCoefficient = (bnovoId, data) => api.patch(`/coefficients/${bnovoId}`, data).then((r) => r.data.data);
