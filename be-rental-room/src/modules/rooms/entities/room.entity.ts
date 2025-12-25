export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
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
