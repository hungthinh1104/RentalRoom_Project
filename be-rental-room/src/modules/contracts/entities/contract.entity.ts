export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED',
}

export class RentalApplication {
  id: string;
  roomId: string;
  tenantId: string;
  landlordId: string;
  status: ApplicationStatus;
  requestedMoveInDate?: Date;
  message?: string;
  createdAt: Date;
}

export class Contract {
  id: string;
  applicationId: string;
  roomId: string;
  tenantId: string;
  landlordId: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  status: ContractStatus;
  eSignatureUrl?: string;
}
