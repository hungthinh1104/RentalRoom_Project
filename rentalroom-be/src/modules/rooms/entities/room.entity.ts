export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  UNAVAILABLE = 'UNAVAILABLE',
  DEPOSIT_PENDING = 'DEPOSIT_PENDING',
}

export class Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  area: number;
  pricePerMonth: number;
  deposit: number;
  status: RoomStatus;
  description?: string;
  maxOccupants?: number;
}
