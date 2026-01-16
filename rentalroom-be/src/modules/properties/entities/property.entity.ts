export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  STUDIO = 'STUDIO',
}

export class Property {
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
  createdAt: Date;
}
