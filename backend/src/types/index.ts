export interface AdminRoomResponse {
  bnovoId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCoefficientResponse {
  bnovoId: string;
  roomName: string;
  coefficient1: number;
  coefficient2: number;
  coefficient3: number;
  updatedAt: Date;
}
