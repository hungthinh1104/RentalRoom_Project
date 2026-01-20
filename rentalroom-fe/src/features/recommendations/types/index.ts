import { RoomStatus } from "@/features/rooms/types";

export interface RecommendedProperty {
    id: string;
    name: string;
    address: string;
    city: string;
    ward: string;
}

export interface RecommendedRoomImage {
    url: string;
    displayOrder?: number;
}

export interface RecommendedRoom {
    id: string;
    roomNumber: string;
    pricePerMonth: number;
    status: RoomStatus;
    property: RecommendedProperty;
    images: RecommendedRoomImage[];
    area?: number;
    createdAt?: string;
}
