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
    ward: string;
    wardCode?: string;
    propertyType: PropertyType;
    description?: string;
    images: string[];
    totalRooms?: number;
    rooms?: any[]; // Defined in room types if needed
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
