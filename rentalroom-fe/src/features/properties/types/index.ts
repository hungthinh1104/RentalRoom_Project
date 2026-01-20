import type { Room } from "@/types";

export enum PropertyType {
    APARTMENT = 'APARTMENT',
    HOUSE = 'HOUSE',
    STUDIO = 'STUDIO',
}

export interface Property {
    id: string;
    landlordId: string;
    name: string;
    address: string;
    city: string;
    cityCode?: string;
    district?: string;
    ward: string;
    wardCode?: string;
    propertyType: PropertyType;
    description?: string;
    images: string[];
    totalRooms?: number;
    occupiedRooms?: number;
    rooms?: Room[];
    createdAt: string;
}

export interface CreatePropertyInput {
    name: string;
    address: string;
    city: string;
    ward: string;
    propertyType: PropertyType;
    description?: string;
    images?: string[];
}
