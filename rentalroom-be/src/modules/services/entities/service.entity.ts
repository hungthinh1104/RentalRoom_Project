export enum ServiceType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  INTERNET = 'INTERNET',
  PARKING = 'PARKING',
  CLEANING = 'CLEANING',
}

export enum BillingMethod {
  FIXED = 'FIXED',
  METERED = 'METERED',
}

export class Service {
  id: string;
  propertyId: string;
  serviceName: string;
  serviceType: ServiceType;
  price: number;
  unit: string;
  billingMethod: BillingMethod;
}
