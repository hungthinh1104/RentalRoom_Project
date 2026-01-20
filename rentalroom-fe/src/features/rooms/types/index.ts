import type {
    Room as SharedRoom,
    RoomAmenity,
    RoomImage,
    RoomReview
} from '@/types';

export enum RoomStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    UNAVAILABLE = 'UNAVAILABLE',
    DEPOSIT_PENDING = 'DEPOSIT_PENDING',
    MAINTENANCE = 'MAINTENANCE',
    RESERVED = 'RESERVED',
}

export enum AmenityType {
    AC = 'AC',
    FRIDGE = 'FRIDGE',
    WASHER = 'WASHER',
    BED = 'BED',
    WIFI = 'WIFI',
}

export interface Room {
    id: string;
    propertyId: string;
    roomNumber: string;
    area: number;
    pricePerMonth: number;
    deposit: number;
    status: RoomStatus;
    description?: string;
    maxOccupants?: number;
    images: string[];
    amenities: AmenityType[];
    averageRating?: number;
    reviewCount?: number;
    createdAt: string;
}

export interface CreateRoomInput {
    propertyId: string;
    roomNumber: string;
    area: number;
    pricePerMonth: number;
    deposit: number;
    status: RoomStatus;
    description?: string;
    maxOccupants?: number;
    images?: string[];
    amenities?: AmenityType[];
}

export interface BulkCreateRoomInput {
    rooms: CreateRoomInput[];
}

export type { SharedRoom, RoomAmenity, RoomImage, RoomReview };
