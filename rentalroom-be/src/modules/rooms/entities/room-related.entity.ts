export enum AmenityType {
  AC = 'AC',
  FRIDGE = 'FRIDGE',
  WASHER = 'WASHER',
  BED = 'BED',
  WIFI = 'WIFI',
}

export class RoomImage {
  id: string;
  roomId: string;
  imageUrl: string;
  displayOrder: number;
}

export class RoomAmenity {
  id: string;
  roomId: string;
  amenityType: AmenityType;
  quantity: number;
}

export class RoomReview {
  id: string;
  tenantId: string;
  roomId: string;
  contractId: string;
  rating: number;
  cleanlinessRating: number;
  locationRating: number;
  valueRating: number;
  comment?: string;
  createdAt: Date;
}
