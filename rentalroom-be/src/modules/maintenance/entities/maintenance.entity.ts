export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  APPLIANCE = 'APPLIANCE',
  OTHER = 'OTHER',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class MaintenanceRequest {
  id: string;
  roomId: string;
  tenantId: string;
  assignedTo?: string;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  description: string;
  status: MaintenanceStatus;
  createdAt: Date;
  completedAt?: Date;
}
